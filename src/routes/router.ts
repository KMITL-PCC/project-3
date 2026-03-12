import express from "express";
import dashboardRouter from "./dashboard.router";
import usersRouter from "./users.router";
import roomsRouter from "./rooms.router";
import authRouter from "./auth.router";
import historyRouter from "./history.router";

import qrcodeRouter from "./qrcode.router";

const router = express.Router();

router.get("/", (req, res) => {
	res.send("Hello World");
});

router.use("/dashboard", dashboardRouter);
router.use("/history", historyRouter);
usersRouter(router);
roomsRouter(router);
authRouter(router);
qrcodeRouter(router);

export default router;
