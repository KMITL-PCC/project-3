import type { Router } from "express";

import roomsController from "../controllers/rooms.controller";

const roomsRouter = (router: Router) => {
	router.get("/rooms", (req, res) => {
		roomsController.handleGetAll(req, res);
	});
	router.get("/rooms/:id", (req, res) => {
		roomsController.handleGetById(req, res);
	});
	router.post("/rooms", (req, res) => {
		roomsController.handleCreate(req, res);
	});
	router.put("/rooms/:id", (req, res) => {
		roomsController.handleUpdate(req, res);
	});
	router.delete("/rooms/:id", (req, res) => {
		roomsController.handleDelete(req, res);
	});
};

export default roomsRouter;
