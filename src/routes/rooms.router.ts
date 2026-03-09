import express from "express";

import roomsController from "../controllers/rooms.controller";

const router = express.Router();

router.get("/", (req, res) => {
	roomsController.handleGetAll(req, res);
});
router.get("/:id", (req, res) => {
	roomsController.handleGetById(req, res);
});
router.post("/", (req, res) => {
	roomsController.handleCreate(req, res);
});
router.put("/:id", (req, res) => {
	roomsController.handleUpdate(req, res);
});
router.delete("/:id", (req, res) => {
	roomsController.handleDelete(req, res);
});
router.post("/generate-qr", (req, res) => { 
	roomsController.handleGenerateQr(req, res);
});

export default router;
