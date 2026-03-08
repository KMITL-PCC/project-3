import express from "express";
import dashboardController from "../controllers/dashboard.controller";
import dashboardMiddleware from "../middleware/dashboard.middleware";

const router = express.Router();

router.use(dashboardMiddleware);

router.get("/:roomId", dashboardController.handleGetByRoomId);

// router.get("/stats/:roomId", dashboardController.handleGetStatsByRoomId);

export default router;
