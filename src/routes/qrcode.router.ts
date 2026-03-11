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
  // Perform Check-in/Out/Swap action
  qrRouter.post('/action', qrcodeController.actionQrCode);

  router.use('/qrcode', qrRouter);
}

export default qrcodeRouter;

