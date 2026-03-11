import type { Request, Response } from "express";
import { dashboardRequestSchema } from "../validators/dashboard.schema";

import dashboardService from "../services/dashboard.service";
import z from "zod";

const dashboardController = {
  // handleGetByRoomId: async (req: Request, res: Response) => {
  //   try {
  //     const { roomCode } = req.params;
  //     const { startDate: sd, endDate: ed, page, limit } = req.query;

  //     const startDate = sd ? new Date(sd as string) : new Date();
  //     const endDate = ed ? new Date(ed as string) : new Date();

  //     const isQueryValid = dashboardRequestSchema.safeParse({
  //       roomCode,
  //       startDate,
  //       endDate,
  //       page,
  //       limit,
  //     });

  //     if (!isQueryValid.success) {
  //       return res.status(400).json({
  //         success: false,
  //         message: "Bad request",
  //         errors: z.treeifyError(isQueryValid.error),
  //       });
  //     }

  //     const {
  //       attendances,
  //       attendancesCount,
  //       pageCount,
  //       limit: perPage,
  //       page: currentPage,
  //     } = await dashboardService.getByRoomId(
  //       isQueryValid.data.roomCode,
  //       isQueryValid.data.startDate,
  //       isQueryValid.data.endDate,
  //       isQueryValid.data.page,
  //       isQueryValid.data.limit,
  //     );

  //     if (!attendances || attendances.length === 0) {
  //       return res.status(404).json({
  //         success: false,
  //         message: "No attendances found",
  //       });
  //     }

  //     res.status(200).json({
  //       success: true,
  //       data: attendances,
  //       pagination: {
  //         currentPage,
  //         perPage,
  //         total: attendancesCount,
  //         totalPages: pageCount,
  //       },
  //     });
  //   } catch (error) {
  //     const e = error as Error;

  //     res.status(500).json({
  //       success: false,
  //       message: e.message || "Internal server error",
  //     });
  //   }
  // },
  handleGetByRoomId: async (req: Request, res: Response) => {
    try {
      const { roomCode } = req.params;
      const { date: d, search, page, limit } = req.query;

      const date = d ? new Date(d as string) : new Date();

      const isQueryValid = dashboardRequestSchema.safeParse({
        roomCode,
        date,
        search,
        page,
        limit,
      });

      if (!isQueryValid.success) {
        return res.status(400).json({
          success: false,
          message: "Bad request",
          // errors: z.treeifyError(isQueryValid.error),
        });
      }

      const {
        attendances,
        attendancesCount,
        pageCount,
        limit: perPage,
        page: currentPage,
      } = await dashboardService.getByRoomId(
        isQueryValid.data.roomCode,
        isQueryValid.data.date,
        isQueryValid.data.search,
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
        pagination: {
          currentPage,
          perPage,
          total: attendancesCount,
          totalPages: pageCount,
        },
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

export default dashboardController;
