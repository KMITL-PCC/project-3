import type { NextFunction, Request, Response } from "express";

const dashboardMiddleware = (
	req: Request,
	res: Response,
	next: NextFunction,
) => {
	console.log("Dashboard middleware");
	next();
};

export default dashboardMiddleware;
