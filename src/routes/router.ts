import express from "express";
import dashboardRouter from "./dashboard.router";
import usersRouter from "./users.router";
import roomsRouter from "./rooms.router";
import authRouter from "./auth.router";

const router = express.Router();

router.get("/", (req, res) => {
	res.send("Hello World");
});

dashboardRouter(router);
usersRouter(router);
roomsRouter(router);
authRouter(router);

export default router;
