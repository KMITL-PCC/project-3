import { prisma } from '../lib/prisma';

// Interface for Login input
interface LoginInput {
  studentId: string;
  password: string;
  room: string
}

const authService = {
  login: async (input: LoginInput) => {
    const { studentId, password, room } = input;

    console.log(`[AuthService] Checking user in DB for ${studentId}`);
    const user = await prisma.user.findUnique({
      where: { StudentId: studentId },
      include: { role: true, major: true }
    });

    if (!user) {
      throw new Error('Invalid credentials (User not found)');
    }

    // Simple password check (for development/testing)
    if (user.password !== password) {
      console.log(`[AuthService] Password mismatch for ${studentId}`);
      throw new Error('Invalid credentials');
    }

    return {
      id: user.id,
      studentId: user.StudentId,
      fname: user.fname,
      lname: user.lname,
      role: user.role?.name || null,
      roleId: user.roleId,
      major: user.major?.name || null,
    };
  },

  guestLogin: async (room: string) => {

    const existingRoom = await prisma.room.findFirst({
      where: {
        roomCode: room
      }
    });

    if (!existingRoom) {
      throw new Error('Does not exist room code');
    }
    const guestUser = await prisma.user.findUnique({
      where: {
        StudentId: 'Guest',
      },
      select: {
        StudentId: true,
      }
    });
    return guestUser;

  },

  register: (_data: any) => {
    throw new Error('Please use login endpoint (Auto-register logic applied)');
  },

  logout: () => {
    return { message: 'Logout successful' };
  },

  refreshToken: (_token: string) => {
    return { message: 'Not implemented yet' };
  },
};

export default authService;