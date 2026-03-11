import type { Request, Response } from "express";
import historyService from "../services/history.service";

const historyController = {
  handleGetAll: async (req: Request, res: Response) => {
    try {
      // It should be from session that query from sessionId in cookies
      const studentId = "64010002";

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
