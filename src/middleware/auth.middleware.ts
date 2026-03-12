import type { NextFunction, Request, Response } from "express";

/**
 * authMiddleware — ตรวจสอบ session ว่า login อยู่หรือไม่
 * ถ้าไม่มี session.userId → 401 Unauthorized
 */
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const session = req.session as any;

  if (!session?.userId) {
    res.status(401).json({
      success: false,
      message: 'Unauthorized: No active session',
    });
    return;
  }

  console.log(`[Auth Middleware] userId=${session.userId} role=${session.role}`);
  next();
};

export default authMiddleware;
