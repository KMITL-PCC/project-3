import type { Router } from "express";

import dashboardController from "../controllers/dashboard.controller";

const dashboardRouter = (router: Router) => {
	router.get("/dashboard", (req, res) => {
		dashboardController.handleGetStats(req, res);
	});
};

export default dashboardRouter;
