import express from "express";
import dashboardController from "../controllers/dashboard.controller";
import authMiddleware from "../middleware/auth.middleware";

const router = express.Router();

router.use(authMiddleware);

router.get("/", (req, res) => res.send("Dashboard Route"));

router.get("/:roomCode", dashboardController.handleGetByRoomId);

export default router;
