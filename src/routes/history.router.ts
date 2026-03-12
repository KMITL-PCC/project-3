import express from "express";
import authMiddleware from "../middleware/auth.middleware";
import historyController from "../controllers/history.controller";

const router = express.Router();

router.use(authMiddleware);

router.get("/", historyController.handleGetAll);

export default router;
