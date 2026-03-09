import express from 'express';
import qrcodeController from '../controllers/qrcode.controller';

function qrcodeRouter(router: express.Router) {
  const qrRouter = express.Router();

  // 1. Web Init Session
  qrRouter.post('/session-init', qrcodeController.initSession);
  // 2. Web Generate Token
  qrRouter.post('/generate', qrcodeController.generateToken);
  // 3. Mobile Scan
  qrRouter.post('/scan', qrcodeController.scanQrCode);
  // 4. Web Poll
  qrRouter.get('/status/:qr_session_id', qrcodeController.pollSessionStatus);

  router.use('/qrcode', qrRouter);
}

export default qrcodeRouter;
