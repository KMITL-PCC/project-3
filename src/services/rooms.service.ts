import { prisma } from "../lib/prisma";

const roomsService = {
	getAll: async () => {
		return await prisma.room.findMany({
			select: {
				roomCode: true,
				roomDesc: true,
			},
		});
	},
	getById: async (id: string) => {
		return await prisma.room.findUnique({
			where: { roomCode: id },
		});
	},
	create: async (data: any) => {
		// TODO: Implement create room
	},
	update: async (id: string, data: any) => {
		// TODO: Implement update room
	},
	delete: async (id: string) => {
		// TODO: Implement delete room
	},
};

export default roomsService;
