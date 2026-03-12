import express from 'express';
import qrcodeController from '../controllers/qrcode.controller';

function qrcodeRouter(router: express.Router) {
  const qrRouter = express.Router();

  // Generate or refresh dynamic QR code
  qrRouter.post('/generate', qrcodeController.generateToken);
  // Scan dynamic QR code (Discovery Phase)
  qrRouter.post('/scan', qrcodeController.scanQrCode);
  // Poll for QR usage status
  qrRouter.get('/poll/:class_session_id', qrcodeController.pollSessionStatus);
  // Get current user status in a room
  qrRouter.get('/status/:roomCode', qrcodeController.getUserStatus);
  // Perform Check-in/Out/Swap action (QR based)
  qrRouter.post('/action', qrcodeController.actionQrCode);
  // Perform Direct Check-in/Out/Swap action (No QR token)
  qrRouter.post('/action/direct', qrcodeController.directAction);
  // Ping/Heartbeat for token
  qrRouter.post('/ping', qrcodeController.pingToken);

  router.use('/qrcode', qrRouter);
}

export default qrcodeRouter;

