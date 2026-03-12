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
    const { token, studentId } = req.body;

    if (!token || !studentId) {
      res.status(400).json({ error: 'Token and studentId are required' });
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
        where: { StudentId: studentId }
      });

      // Detect current state for this user
      const activeCheckin = await prisma.checkin.findFirst({
        where: {
          StudentId: studentId,
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
    const { action, studentId, token, isGuest } = req.body;

    if (!action || !studentId || !token) {
      res.status(400).json({ error: 'Action, studentId, and token are required' });
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
        where: { StudentId: studentId },
        update: {},
        create: {
          StudentId: studentId,
          fname: isGuest ? 'Guest' : 'Student',
          lname: isGuest ? 'User' : 'Member',
          password: '1234',
        }
      });

      if (action === 'CHECK_IN' || action === 'SWAP') {
        if (action === 'SWAP') {
          await prisma.checkin.updateMany({
            where: { StudentId: studentId, checkOut: null },
            data: { checkOut: new Date() }
          });
        }

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
      await createAuditLog(studentId, isGuest ? 'Guest' : studentId, `QR_${action}`, roomCode, { token });

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
  }
};

export default qrcodeController;
