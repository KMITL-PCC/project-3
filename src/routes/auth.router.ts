import type { Router } from "express";

import authController from "../controllers/auth.controller";

const authRouter = (router: Router) => {
	router.post("/auth/login", (req, res) => {
		authController.handleLogin(req, res);
	});
	router.post("/auth/register", (req, res) => {
		authController.handleRegister(req, res);
	});
	router.post("/auth/logout", (req, res) => {
		authController.handleLogout(req, res);
	});
	router.post("/auth/refresh", (req, res) => {
		authController.handleRefreshToken(req, res);
	});
};

export default authRouter;
