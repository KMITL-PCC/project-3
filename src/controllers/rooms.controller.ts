import roomsService from "../services/rooms.service";

const roomsController = {
	handleGetAll: async (req: any, res: any) => {
		try {
			const result = await roomsService.getAll();
			res.status(200).json({
				success: true,
				data: result,
			});
		} catch (error) {
			res.status(500).json({
				success: false,
				message: "Internal server error",
			});
		}
	},
	
	handleGetById: async (req: any, res: any) => {
		try {
			const result = await roomsService.getById(req.params.id);
			if (!result) {
				return res.status(404).json({
					success: false,
					message: "Room not found",
				});
			}
			res.status(200).json({
				success: true,
				data: result,
			});
		} catch (error) {
			res.status(500).json({
				success: false,
				message: "Internal server error",
			});
		}
	},
	handleCreate: async (req: any, res: any) => {
		const result = await roomsService.create(req.body);
		res.send(result);
	},
	handleUpdate: async (req: any, res: any) => {
		const result = await roomsService.update(req.params.id, req.body);
		res.send(result);
	},
	handleDelete: async (req: any, res: any) => {
		const result = await roomsService.delete(req.params.id);
		res.send(result);
	},
};

export default roomsController;
