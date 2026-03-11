import { Request, Response } from 'express';
import authService from '../services/auth.service';
import { prisma } from '../lib/prisma';

const authController = {
    // 1. Handle Login -> บันทึก session cookie
    handleLogin: async (req: Request, res: Response) => {
        try {
            const { studentId, password } = req.body;

            if (!studentId || !password) {
                res.status(400).json({ message: 'Student ID and password are required' });
                return;
            }

            console.log(`[Login API] Starting login for ${studentId}...`);
            // login() check DB
            const user = await authService.login({ studentId, password });
            console.log(`[Login API] Login successful for ${studentId}, setting session...`);

            // บันทึกข้อมูลลงใน Session (เก็บใน Redis)
            (req.session as any).userId    = user.id;
            (req.session as any).studentId = user.studentId;
            (req.session as any).role      = user.role;
            (req.session as any).roleId    = user.roleId;
            (req.session as any).fname     = user.fname;
            (req.session as any).lname     = user.lname;

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
            const user = await prisma.user.findUnique({
                where: { id: session.userId },
                select: {
                    id: true,
                    StudentId: true,
                    fname: true,
                    lname: true,
                    nickname: true,
                    roleId: true,
                    role: { select: { name: true } },
                    majorId: true,
                    major: { select: { name: true } },
                    img: true,
                    phone: true,
                    email: true,
                    gen: true,
                },
            });
            if (!user) {
                res.status(401).json({ message: 'User not found' });
                return;
            }
            res.status(200).json({ user });
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

    // 6. Handle Student Check (for /scan page login)
    handleStudentCheck: async (req: Request, res: Response) => {
        const { studentId } = req.body;
        if (!studentId) {
            res.status(400).json({ error: 'studentId is required' });
            return;
        }

        try {
            const user = await prisma.user.findUnique({
                where: { StudentId: studentId },
                select: {
                    id: true,
                    StudentId: true,
                    prefix: true,
                    fname: true,
                    lname: true,
                    nickname: true,
                    majorId: true,
                    major: { select: { name: true } },
                    gen: true,
                }
            });
            if (!user) {
                res.status(404).json({ exists: false, message: 'Student not found. You can proceed as Guest.' });
                return;
            }
            res.json({ exists: true, student: user });
        } catch (error) {
            console.error('Student Check Error:', error);
            res.status(500).json({ error: 'Failed to verify identity' });
        }
    },
};

export default authController;