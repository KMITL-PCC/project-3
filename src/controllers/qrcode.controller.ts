import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import crypto from 'crypto';

// Dynamic QR Code Tokens (Keyed by token, allowing concurrent confirmation)
const activeQrTokens = new Map<string, {
  expires: number,
  class_session_id: number,
  subject_id: number,
  startTime: Date,
  endTime: Date,
  roomCode: string,
  roomDesc: string
}>();

// Booth Status (Keyed by class_session_id string, for booth refresh polling)
const boothStatus = new Map<string, {
  latestToken: string,
  used: boolean
}>();

const QR_VALIDITY_MS = 5 * 60 * 1000; // 5 minutes for user to confirm
const QR_RENEWAL_THRESHOLD_MS = 30 * 1000; // Booth renews every 30s regardless

async function createAuditLog(userId: string, username: string, action: string, targetId: string, details: any) {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        username,
        action,
        targetId,
        details: details ? JSON.stringify(details) : undefined,
      }
    });
  } catch (error) {
    console.error('Audit Log Error:', error);
  }
}

const qrcodeController = {
  // Generate or refresh dynamic QR code
  generateToken: async (req: Request, res: Response) => {
    const { class_session_id, macAddress } = req.body;

    if (!class_session_id) {
      res.status(400).json({ error: 'class_session_id is required' });
      return;
    }

    try {
      // Fetch Class Session and Device/Room info
      const [session, device] = await Promise.all([
        prisma.classSession.findUnique({
          where: { id: parseInt(class_session_id) },
          include: { room: true }
        }),
        macAddress ? prisma.device.findUnique({
          where: { macAddress },
          include: { room: true }
        }) : null
      ]);

      if (!session) {
        res.status(404).json({ error: 'Class session not found' });
        return;
      }

      // Resolve roomCode: device room → session room → reject
      const roomCode = (device && device.roomCode) ? device.roomCode : session.roomId;
      const roomDesc = (device && device.room && device.room.roomDesc)
        ? device.room.roomDesc
        : (session.room?.roomDesc || null);

      // Generate a simple unique token
      const token = crypto.randomBytes(8).toString('hex');
      const now = Date.now();

      // 1. Register token in global registry (active for 5 mins)
      activeQrTokens.set(token, {
        expires: now + QR_VALIDITY_MS,
        class_session_id: session.id,
        subject_id: session.subjectId,
        startTime: session.startTime,
        endTime: session.endTime,
        roomCode,
        roomDesc: roomDesc || 'Unknown Location'
      });

      // 2. Update booth status (tracking if the current token on screen has been scanned)
      boothStatus.set(String(session.id), {
        latestToken: token,
        used: false
      });

      // Cleanup expired tokens
      for (const [t, data] of activeQrTokens.entries()) {
        if (data.expires < now) activeQrTokens.delete(t);
      }

      const frontendUrl = process.env.FRONTEND_URL || `http://${req.hostname}:3000`;

      res.json({
        message: "QR Token generated successfully",
        qr_token: token,
        scan_url: `${frontendUrl}/scan?token=${token}`,
        expires_in: QR_VALIDITY_MS / 1000,
        metadata: {
          subject_id: session.subjectId,
          roomCode,
          roomDesc
        }
      });

    } catch (error: any) {
      console.error('QR Generate error:', error);
      res.status(500).json({ error: 'Failed to generate QR code' });
    }
  },

  // Scan dynamic QR code (Discovery Phase)
  scanQrCode: async (req: Request, res: Response) => {
    // Booth Scan uses userId, project-front uses studentId
    const { token, userId, studentId } = req.body;
    const finalId = userId || studentId;

    if (!token || !finalId) {
      res.status(400).json({ error: 'Token and studentId/userId are required' });
      return;
    }

    // Find token data
    const tokenData = activeQrTokens.get(token);
    if (!tokenData) {
      res.status(404).json({ error: 'Invalid or expired token' });
      return;
    }

    if (Date.now() > tokenData.expires) {
      activeQrTokens.delete(token);
      res.status(410).json({ error: 'Token has expired' });
      return;
    }

    try {
      // Fetch user info if possible
      const user = await prisma.user.findUnique({
        where: { StudentId: String(finalId) }
      });

      // Detect current state for this user
      const activeCheckin = await prisma.checkin.findFirst({
        where: {
          StudentId: String(finalId),
          checkOut: null
        },
        orderBy: { checkIn: 'desc' }
      });

      let recommendedAction = 'CHECK_IN';
      let currentSession: any = null;

      if (activeCheckin) {
        if (activeCheckin.roomCode === tokenData.roomCode) {
          recommendedAction = 'CHECK_OUT';
        } else {
          recommendedAction = 'SWAP';
        }
        currentSession = activeCheckin;
      }

      // If this token is the LATEST one on the booth screen, mark booth as "used" to trigger refresh
      const status = boothStatus.get(String(tokenData.class_session_id));
      if (status && status.latestToken === token) {
        status.used = true;
      }

      res.json({
        success: true,
        action: recommendedAction,
        currentSession,
        metadata: {
          class_session_id: tokenData.class_session_id,
          activityId: tokenData.class_session_id, // Booth Scan mapping
          activityTitle: `Room session ${tokenData.roomCode}`, // Booth Scan mapping
          subject_id: tokenData.subject_id,
          startTime: tokenData.startTime,
          endTime: tokenData.endTime,
          roomCode: tokenData.roomCode,
          roomDesc: tokenData.roomDesc,
          studentName: user ? `${user.fname || ''} ${user.lname || ''}`.trim() : 'Guest User'
        }
      });

    } catch (error: any) {
      console.error('Scan discovery error:', error);
      res.status(500).json({ error: 'Failed to verify check-in state' });
    }
  },

  // Poll for QR usage status
  pollSessionStatus: async (req: Request, res: Response) => {
    const { class_session_id } = req.params;
    const status = boothStatus.get(class_session_id as string);

    if (!status) {
      res.json({ used: true, reason: 'uninitialized' });
      return;
    }

    res.json({ used: status.used });
  },

  // Perform Check-in/Out/Swap action
  actionQrCode: async (req: Request, res: Response) => {
    const { action, studentId, userId, token, isGuest } = req.body;
    const finalId = userId || studentId;

    if (!action || !finalId || !token) {
      res.status(400).json({ error: 'Action, studentId/userId, and token are required' });
      return;
    }

    // Validate token again
    const tokenData = activeQrTokens.get(token);
    if (!tokenData || Date.now() > tokenData.expires) {
      if (tokenData) activeQrTokens.delete(token);
      res.status(404).json({ error: 'Token expired or invalid. Please scan again.' });
      return;
    }

    try {
      const roomCode = tokenData.roomCode;

      // 1. Ensure user exists (upsert)
      await prisma.user.upsert({
        where: { StudentId: String(finalId) },
        update: {},
        create: {
          StudentId: String(finalId),
          fname: isGuest ? 'Guest' : 'Student',
          lname: isGuest ? 'User' : 'Member',
          password: '1234',
        }
      });

      if (action === 'CHECK_IN' || action === 'SWAP') {
        if (action === 'SWAP') {
          await prisma.checkin.updateMany({
            where: { StudentId: String(finalId), checkOut: null },
            data: { checkOut: new Date() }
          });
        }

        await prisma.checkin.create({
          data: {
            StudentId: String(finalId),
            roomCode: roomCode,
            checkIn: new Date()
          }
        });
      } else if (action === 'CHECK_OUT') {
        await prisma.checkin.updateMany({
          where: { StudentId: String(finalId), roomCode: roomCode, checkOut: null },
          data: { checkOut: new Date() }
        });
      }

      // Record audit log
      await createAuditLog(String(finalId), isGuest ? 'Guest' : String(finalId), `QR_${action}`, roomCode, { token });

      // Mark as completed (delete from active tokens)
      activeQrTokens.delete(token);

      res.json({
        success: true,
        message: `${action} completed successfully`,
        action
      });

    } catch (error: any) {
      console.error('Final action error:', error);
      res.status(500).json({ error: 'Failed to complete transaction' });
    }
  },

  // Get current status for a student in a specific room
  getUserStatus: async (req: Request, res: Response) => {
    const { roomCode } = req.params;
    const session = req.session as any;
    const studentId = session.studentId;

    if (!studentId) {
      res.status(401).json({ error: 'Unauthorized: No active session' });
      return;
    }

    try {
      // Find latest active check-in
      const activeCheckin = await prisma.checkin.findFirst({
        where: {
          StudentId: studentId,
          checkOut: null
        },
        orderBy: { checkIn: 'desc' },
        include: { room: true }
      });

      if (!activeCheckin) {
        res.json({ action: 'CHECK_IN' });
        return;
      }

      if (activeCheckin.roomCode === roomCode) {
        res.json({ 
          action: 'CHECK_OUT',
          since: activeCheckin.checkIn
        });
        return;
      }

      // If checked in elsewhere
      res.json({
        action: 'SWAP',
        currentRoom: activeCheckin.roomCode,
        currentRoomDesc: activeCheckin.room?.roomDesc || 'Unknown',
        since: activeCheckin.checkIn
      });

    } catch (error: any) {
      console.error('Get status error:', error);
      res.status(500).json({ error: 'Failed to fetch status' });
    }
  },

  // Direct action (for attendance page without QR token)
  directAction: async (req: Request, res: Response) => {
    const { action, roomCode } = req.body;
    const session = req.session as any;
    const studentId = session.studentId;

    if (!studentId) {
      res.status(401).json({ error: 'Unauthorized: No active session' });
      return;
    }

    if (!action || !roomCode) {
      res.status(400).json({ error: 'Action and roomCode are required' });
      return;
    }

    try {
      if (action === 'CHECK_IN' || action === 'SWAP') {
        if (action === 'SWAP') {
          // Checkout from all other rooms first
          await prisma.checkin.updateMany({
            where: { StudentId: studentId, checkOut: null },
            data: { checkOut: new Date() }
          });
        }

        // Create new check-in
        await prisma.checkin.create({
          data: {
            StudentId: studentId,
            roomCode: roomCode,
            checkIn: new Date()
          }
        });
      } else if (action === 'CHECK_OUT') {
        await prisma.checkin.updateMany({
          where: { StudentId: studentId, roomCode: roomCode, checkOut: null },
          data: { checkOut: new Date() }
        });
      }

      // Record audit log
      await createAuditLog(studentId, studentId, `DIRECT_${action}`, roomCode, { direct: true });

      res.json({
        success: true,
        message: `${action} completed successfully`,
        action
      });

    } catch (error: any) {
      console.error('Direct action error:', error);
      res.status(500).json({ error: 'Failed to complete transaction' });
    }
  },

  // Ping token (for screen sync/refresh)
  pingToken: async (req: Request, res: Response) => {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ error: 'Token is required' });
      return;
    }

    const tokenData = activeQrTokens.get(token);
    if (!tokenData) {
      res.status(404).json({ error: 'Invalid or expired token' });
      return;
    }

    // Booth screen sync logic (refresh used status)
    const status = boothStatus.get(String(tokenData.class_session_id));
    if (status && status.latestToken === token) {
      // Small metadata refresh or heartbeat
      res.json({ success: true, ping: 'pong' });
    } else {
      res.json({ success: true, warning: 'token_not_latest' });
    }
  }
};

export default qrcodeController;
