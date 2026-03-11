import express from "express";
import dashboardController from "../controllers/dashboard.controller";
import dashboardMiddleware from "../middleware/dashboard.middleware";

const router = express.Router();

router.use(dashboardMiddleware);

router.get("/", (req, res) => res.send("Dashboard Route"));

router.get("/:roomCode", dashboardController.handleGetByRoomId);

export default router;
