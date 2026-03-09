import { prisma } from '../lib/prisma';
import redisClient from '../lib/redis';
import { v4 as uuidv4 } from 'uuid';

const roomsService = {
	getAll: () => {
		// TODO: Implement get all rooms
	},
	getById: (id: string) => {
		// TODO: Implement get room by id
	},
	create: (data: any) => {
		// TODO: Implement create room
	},
	update: (id: string, data: any) => {
		// TODO: Implement update room
	},
	delete: (id: string) => {
		// TODO: Implement delete room
	},
	generateQr: async (roomId: string, deviceId: string) => {
        const currentSession = await prisma.class_session.findFirst({
			where: { room_id: roomId, device_id: deviceId },
			include: {
                room: true,
				device_iot: true
            },
			orderBy: { id: 'desc' }
		});

		if (!currentSession) {
			throw new Error("SESSION_NOT_FOUND");
		}

		const qrToken = uuidv4();

        const redisKey = `qrToken:${qrToken}`;
		const roomDesc = currentSession.room?.room_desc || "No Description";
		const adId = currentSession.device_iot?.adId || null;
		const createdAt = new Date().toISOString();

		const data = JSON.stringify({
			roomId: roomId,
			roomDesc: roomDesc,
			adId: adId,
			createdAt: createdAt
		});

        await redisClient.set(redisKey, data, { EX: 30 });

        return { qrToken: qrToken };
	}
};

export default roomsService;
