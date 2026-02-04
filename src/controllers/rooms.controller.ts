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
};

export default roomsController;
