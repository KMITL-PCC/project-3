import express from "express";
import dashboardRouter from "./dashboard.router";
import usersRouter from "./users.router";
import roomsRouter from "./rooms.router";
import authRouter from "./auth.router";
import allRouter from "./all.router";

const router = express.Router();

router.get("/", (req, res) => {
	res.send("Hello World");
});

dashboardRouter(router);
usersRouter(router);
roomsRouter(router);
authRouter(router);
allRouter(router);

export default router;
