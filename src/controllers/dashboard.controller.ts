import type { Request, Response } from "express";
import { dashboardRequestSchema } from "../validators/dashboard";

import dashboardService from "../services/dashboard.service";
import z from "zod";

const dashboardController = {
	handleGetByRoomId: async (req: Request, res: Response) => {
		try {
			const { roomId } = req.params;
			const { date, page, limit } = req.query;

			const targetDate = date ? new Date(date as string) : new Date();

			const isQueryValid = dashboardRequestSchema.safeParse({
				roomId,
				date: targetDate,
				page,
				limit,
			});

			if (!isQueryValid.success) {
				return res.status(400).json({
					success: false,
					message: "Bad request",
					errors: z.treeifyError(isQueryValid.error),
				});
			}

			const attendances = await dashboardService.getByRoomId(
				isQueryValid.data.roomId,
				isQueryValid.data.date,
				isQueryValid.data.page,
				isQueryValid.data.limit,
			);

			if (!attendances || attendances.length === 0) {
				return res.status(404).json({
					success: false,
					message: "No attendances found",
				});
			}

			res.status(200).json({
				success: true,
				data: attendances,
			});
		} catch (error) {
			const e = error as Error;

			res.status(500).json({
				success: false,
				message: e.message || "Internal server error",
			});
		}
	},

	// handleGetStatsByRoomId: async (req: Request, res: Response) => {
	// 	try {
	// 		const { roomId } = req.params;
	// 		const { date } = req.query;

	// 		const targetDate = date ? new Date(date as string) : new Date();

	// 		const isQueryValid = dashboardRequestSchema.safeParse({
	// 			roomId,
	// 			date: targetDate,
	// 		});

	// 		if (!isQueryValid.success) {
	// 			return res.status(400).json({
	// 				success: false,
	// 				message: "Bad request",
	// 				errors: isQueryValid.error.flatten().fieldErrors,
	// 			});
	// 		}

	// 		const stats = await dashboardService.getStatsByRoomId(
	// 			isQueryValid.data.roomId,
	// 			isQueryValid.data.date,
	// 		);

	// 		res.status(200).json({
	// 			success: true,
	// 			data: stats,
	// 		});
	// 	} catch (error) {
	// 		const e = error as Error;

	// 		res.status(500).json({
	// 			success: false,
	// 			message: e.message || "Internal server error",
	// 		});
	// 	}
	// },
};

export default dashboardController;
