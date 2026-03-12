import type { Request, Response } from "express";
import historyService from "../services/history.service";

const historyController = {
	handleGetAll: async (req: Request, res: Response) => {
		try {
			const session = req.session as any;
			const studentId = session.studentId;

			if (!studentId) {
				return res.status(401).json({
					success: false,
					message: "Unauthorized: No active session",
				});
			}

			const history = await historyService.getAll(studentId);

			if (!history || history.length === 0) {
				return res.status(404).json({
					success: false,
					message: "No history found",
				});
			}

			res.status(200).json({
				success: true,
				data: history,
			});
		} catch (error) {
			const e = error as Error;

			res.status(500).json({
				success: false,
				message: "Internal server error",
			});
		}
	},
};

export default historyController;
