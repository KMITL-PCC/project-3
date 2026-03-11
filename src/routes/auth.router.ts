import type { Router } from 'express';
import authController from '../controllers/auth.controller';

const authRouter = (router: Router) => {
  // POST /api/auth/login  -> set session cookie
  router.post('/auth/login', (req, res) => {
    authController.handleLogin(req, res);
  });

  // POST /api/auth/register
  router.post('/auth/register', (req, res) => {
    authController.handleRegister(req, res);
  });

  // POST /api/auth/logout -> ลบ session ออกจาก Redis
  router.post('/auth/logout', (req, res) => {
    authController.handleLogout(req, res);
  });

  // GET /api/auth/me -> ดูข้อมูล user จาก session ปัจจุบัน
  router.get('/auth/me', (req, res) => {
    authController.handleMe(req, res);
  });

  // POST /api/auth/refresh  (placeholder)
  router.post('/auth/refresh', (req, res) => {
    authController.handleRefreshToken(req, res);
  });

  // POST /api/auth/student-check
  router.post('/auth/student-check', (req, res) => {
    authController.handleStudentCheck(req, res);
  });
};

export default authRouter;
