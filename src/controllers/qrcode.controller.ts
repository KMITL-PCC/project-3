import { Request, Response } from 'express';
import crypto from 'crypto';
import { redisClient } from '../lib/redis';

// Extends express-session interface
declare module 'express-session' {
  interface SessionData {
    roomData?: any;
    userId?: string;
    username?: string;
    role?: string;
  }
}

const qrcodeController = {
  // 1. Initialize a new QR Session (TTL 5 mins)
  initSession: async (req: Request, res: Response) => {
    try {
      const qr_session_id = crypto.randomUUID();
      const redisKey = `qr_session:${qr_session_id}`;
      
      const payload = { status: 'waiting' };
      // 5 minutes TTL
      await redisClient.setex(redisKey, 300, JSON.stringify(payload));

      res.status(200).json({
        message: 'QR Session initialized successfully',
        qr_session_id,
        expires_in: 300
      });
    } catch (error: any) {
      console.error('Session Init Error:', error);
      res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
  },

  // 2. Generate a random QR Token for a session (TTL 30 secs)
  generateToken: async (req: Request, res: Response) => {
    try {
      const { qr_session_id } = req.body;

      if (!qr_session_id) {
        res.status(400).json({ message: 'qr_session_id is required' });
        return;
      }

      // Verify the session still exists
      const sessionExists = await redisClient.exists(`qr_session:${qr_session_id}`);
      if (!sessionExists) {
        res.status(404).json({ message: 'QR session not found or expired' });
        return;
      }

      // Generate a 16-character random token
      const qr_token = crypto.randomBytes(8).toString('hex');
      const tokenKey = `qr_token:${qr_token}`;

      // 30 seconds TTL mapping token -> session
      await redisClient.setex(tokenKey, 30, qr_session_id);

      const frontendBaseUrl = req.headers.origin || 'http://localhost:8080';
      const scanUrl = `${frontendBaseUrl}/scan?token=${qr_token}`;

      res.status(200).json({
        message: 'QR Token generated successfully',
        qr_token,
        scan_url: scanUrl,
        expires_in: 30
      });
    } catch (error: any) {
      console.error('QR Token Gen Error:', error);
      res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
  },

  // 3. Scan the QR Token (Mobile device)
  scanQrCode: async (req: Request, res: Response) => {
    try {
      const { token } = req.body;
      
      // Attempt to extract userId from headers/session (assuming mobile login auth passes here)
      // Since this is scanning, the device scanning likely needs to provide which user is approving this.
      // If the mobile app hits this, we assume it's an authenticated request.
      // For now, let's take it from req.body (or we can extract from a mobile API session later).
      const { userId } = req.body; 

      if (!token) {
        res.status(400).json({ message: 'Token is required' });
        return;
      }

      if (!userId) {
        res.status(400).json({ message: 'userId is required from scanning device' });
        return;
      }

      const tokenKey = `qr_token:${token}`;
      const qr_session_id = await redisClient.get(tokenKey);

      if (!qr_session_id) {
        res.status(401).json({ message: 'Invalid or Expired Token' });
        return;
      }

      // Read current session
      const sessionKey = `qr_session:${qr_session_id}`;
      const sessionDataStr = await redisClient.get(sessionKey);
      
      if (!sessionDataStr) {
        res.status(404).json({ message: 'QR session expired' });
        return;
      }

      // Mark session as approved and attach user
      const updatedSession = { status: 'approved', userId };
      
      // Keep existing TTL, or overwrite with remaining time. Here we just set 60s buffer for web to poll.
      await redisClient.setex(sessionKey, 60, JSON.stringify(updatedSession));

      // Make token one-time use
      await redisClient.del(tokenKey);

      res.status(200).json({
        message: 'QR Code scanned, session approved',
        qr_session_id
      });
    } catch (error: any) {
      console.error('QR Code Scan Error:', error);
      res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
  },

  // 4. Poll for Session Status (Web browser)
  pollSessionStatus: async (req: Request, res: Response) => {
    try {
      const { qr_session_id } = req.params;

      if (!qr_session_id) {
        res.status(400).json({ message: 'qr_session_id is required' });
        return;
      }

      const sessionKey = `qr_session:${qr_session_id}`;
      const sessionDataStr = await redisClient.get(sessionKey);

      if (!sessionDataStr) {
        res.status(404).json({ message: 'QR session not found or expired' });
        return;
      }

      const sessionData = JSON.parse(sessionDataStr);

      if (sessionData.status === 'approved') {
        const { userId } = sessionData;
        
        // Convert to long-lived actual login session explicitly for the caller
        (req.session as any).userId = userId;
        req.session.cookie.maxAge = 24 * 60 * 60 * 1000; // 1 day in ms
        
        // Clear the one-time QR session now that a real session is formed
        await redisClient.del(sessionKey);

        res.status(200).json({
          status: 'approved',
          message: 'Login successful via QR',
          user: { id: userId } // Return necessary info
        });
        return;
      }

      // If still waiting
      res.status(200).json({ status: 'waiting' });

    } catch (error: any) {
      console.error('QR Session Status Error:', error);
      res.status(500).json({ message: error.message || 'Internal Server Error' });
    }
  }
};

export default qrcodeController;
