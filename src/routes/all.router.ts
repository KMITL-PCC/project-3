import type { Router } from "express";

import allController from "../controllers/all.controller";

const allRouter = (router: Router) => {
	router.get("/api/fetch/all", (req, res) => {
		allController.handleGetAll(req, res);
	});
};

export default allRouter;
