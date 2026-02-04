import usersService from "../services/users.service";

const usersController = {
	handleGetAll: (req: any, res: any) => {
		const result = usersService.getAll();
		res.send(result);
	},
	handleGetById: (req: any, res: any) => {
		const result = usersService.getById(req.params.id);
		res.send(result);
	},
	handleCreate: (req: any, res: any) => {
		const result = usersService.create(req.body);
		res.send(result);
	},
	handleUpdate: (req: any, res: any) => {
		const result = usersService.update(req.params.id, req.body);
		res.send(result);
	},
	handleDelete: (req: any, res: any) => {
		const result = usersService.delete(req.params.id);
		res.send(result);
	},
};

export default usersController;
