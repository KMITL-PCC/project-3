import dashboardService from "../services/dashboard.service";

const dashboardController = {
	handleGetStats: async (req: any, res: any) => {
		const result = await dashboardService.getAllStats();
		res.json(result);
	},
};

export default dashboardController;
