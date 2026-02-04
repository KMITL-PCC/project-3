import type { Router } from "express";

import usersController from "../controllers/users.controller";

const usersRouter = (router: Router) => {
	router.get("/users", (req, res) => {
		usersController.handleGetAll(req, res);
	});
	router.get("/users/:id", (req, res) => {
		usersController.handleGetById(req, res);
	});
	router.post("/users", (req, res) => {
		usersController.handleCreate(req, res);
	});
	router.put("/users/:id", (req, res) => {
		usersController.handleUpdate(req, res);
	});
	router.delete("/users/:id", (req, res) => {
		usersController.handleDelete(req, res);
	});
};

export default usersRouter;
