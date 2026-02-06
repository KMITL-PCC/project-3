import allService from "../services/all.service";

const allController = {
	handleGetAll: async (req: any, res: any) => {
		const result = await allService.getAll();
		res.json(result);
	},
};

export default allController;
