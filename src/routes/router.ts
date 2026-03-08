import express from "express";
import dashboardRouter from "./dashboard.router";
import usersRouter from "./users.router";
import roomsRouter from "./rooms.router";
import authRouter from "./auth.router";

const router = express.Router();

router.get("/", (req, res) => {
	res.send("Hello World");
});

router.use("/dashboard", dashboardRouter);
router.use("/users", usersRouter);
router.use("/rooms", roomsRouter);
router.use("/auth", authRouter);

export default router;
