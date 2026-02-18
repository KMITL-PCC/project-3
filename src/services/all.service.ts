import { prisma } from "../lib/prisma";

const allService = {
	getAll: async () => {
		const users = await prisma.user.findMany();
		const rooms = await prisma.room.findMany();
		const attendance = await prisma.attendance.findMany();
        const deviceIot = await prisma.deviceIoT.findMany();
        const subject = await prisma.subject.findMany();
        const classSession = await prisma.classSession.findMany();
		return {
			users,
			rooms,
			attendance,
			deviceIot,
			subject,
            classSession,
		};  
	},
};

export default allService;
