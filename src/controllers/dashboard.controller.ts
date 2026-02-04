import dashboardService from "../services/dashboard.service";

const dashboardController = {
	handleGetStats: (req: any, res: any) => {
		const result = dashboardService.getAllStats();
		res.send(result);
	},
};

export default dashboardController;
