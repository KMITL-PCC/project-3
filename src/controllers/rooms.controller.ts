import roomsService from "../services/rooms.service";

const roomsController = {
	handleGetAll: (req: any, res: any) => {
		const result = roomsService.getAll();
		res.send(result);
	},
	handleGetById: (req: any, res: any) => {
		const result = roomsService.getById(req.params.id);
		res.send(result);
	},
	handleCreate: (req: any, res: any) => {
		const result = roomsService.create(req.body);
		res.send(result);
	},
	handleUpdate: (req: any, res: any) => {
		const result = roomsService.update(req.params.id, req.body);
		res.send(result);
	},
	handleDelete: (req: any, res: any) => {
		const result = roomsService.delete(req.params.id);
		res.send(result);
	},
	handleGenerateQr: async (req: any, res: any) => {
		try {
			const { roomId, deviceId } = req.body;

			if (!roomId || !deviceId) {
				return res.status(400).json({ error: "Missing roomId or deviceId" });
			}

			const result = await roomsService.generateQr((roomId), (deviceId));
			return res.status(200).json({ ...result });

		} catch (error: any) {
			if (error.message === "SESSION_NOT_FOUND") {
				return res.status(404).json({ error: "Class session not found" });
			}
			console.error(error);
			return res.status(500).json({ error: "Internal Server Error" });
		}
	}
};

export default roomsController;
