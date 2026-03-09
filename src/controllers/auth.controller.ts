import { Request, Response } from 'express';
import authService from '../services/auth.service';
import { prisma } from '../lib/prisma';

const authController = {
    // 1. Handle Login -> ตรวจ RADIUS -> บันทึก session cookie
    handleLogin: async (req: Request, res: Response) => {
        try {
            const { studentId, password } = req.body;

            if (!studentId || !password) {
                res.status(400).json({ message: 'Student ID and password are required' });
                return;
            }

            console.log(`[Login API] Starting login for ${studentId}...`);
            // login() ตรวจ RADIUS ก่อน แล้วค่อย upsert DB
            const user = await authService.login({ studentId, password });
            console.log(`[Login API] Login successful for ${studentId}, setting session...`);

            // บันทึกข้อมูลลงใน Session (เก็บใน Redis)
            (req.session as any).userId   = user.id;
            (req.session as any).username = user.username;
            (req.session as any).role     = user.role;

            res.status(200).json({
                message: 'Login successful',
                user,
            });
        } catch (error: any) {
            console.error('Login Error:', error);
            const isReject = error.message?.toLowerCase().includes('reject') ||
                             error.message?.toLowerCase().includes('invalid credentials');
            res.status(isReject ? 401 : 500).json({
                message: error.message || 'Internal Server Error',
            });
        }
    },

    // 2. Handle Register
    handleRegister: async (req: Request, res: Response) => {
        try {
            const result = authService.register(req.body);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(400).json({ message: error.message });
        }
    },

    // 3. Handle Logout -> ลบ session ออกจาก Redis
    handleLogout: async (req: Request, res: Response) => {
        req.session.destroy((err) => {
            if (err) {
                console.error('Logout Error:', err);
                res.status(500).json({ message: 'Logout failed' });
                return;
            }
            res.clearCookie('connect.sid');
            res.status(200).json({ message: 'Logout successful' });
        });
    },

    // 4. Handle Me -> ดูข้อมูล user จาก session ปัจจุบัน
    handleMe: async (req: Request, res: Response) => {
        const session = req.session as any;
        if (!session.userId) {
            res.status(401).json({ message: 'Unauthorized: No active session' });
            return;
        }
        try {
            /*
            const user = await prisma.user.findUnique({
                where: { id: session.userId },
                select: {
                    id: true,
                    username: true,
                },
            });
            if (!user) {
                res.status(401).json({ message: 'User not found' });
                return;
            }
            res.status(200).json({ user });
            */
            res.status(200).json({ user: { id: session.userId, username: session.username, role: session.role, _mock: true } });
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    },

    // 5. Handle Refresh Token (placeholder)
    handleRefreshToken: async (req: Request, res: Response) => {
        try {
            const { token } = req.body;
            const result = authService.refreshToken(token);
            res.status(200).json(result);
        } catch (error: any) {
            res.status(500).json({ message: error.message });
        }
    },
};

export default authController;