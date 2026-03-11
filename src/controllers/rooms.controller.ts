// /app/src/controllers/rooms.controller.ts
import roomsService from "../services/rooms.service";
import { Request, Response } from "express";

const roomsController = {
  handleGetAll: async (req: Request, res: Response) => {
    try {
      const result = await roomsService.getAll();
      res.status(200).json({ result });
    } catch (error) {
      console.error("Error fetching rooms:", error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  },

  // handleGetById: async (req: Request, res: Response) => {
  //   try {
  //     const id = req.params.id; // รับมาเป็น String ตรงๆ เลย
  //     const result = await roomsService.getById(id);
  //     if (!result) {
  //       res.status(404).json({ message: "Room not found" });
  //       return;
  //     }
  //     res.status(200).json(result);
  //   } catch (error) {
  //     res.status(500).json({ message: "Internal Server Error" });
  //   }
  // },

  // handleCreate: async (req: Request, res: Response) => {
  //   try {
  //     // โยน req.body ไปให้ Service จัดการต่อ
  //     const result = await roomsService.create(req.body);
  //     res.status(201).json(result);
  //   } catch (error) {
  //     console.error("Error creating room:", error);
  //     res.status(500).json({ message: "Internal Server Error" });
  //   }
  // },

  // handleUpdate: async (req: Request, res: Response) => {
  //   try {
  //     const id = req.params.id; // String
  //     const data = req.body;
  //     const result = await roomsService.update(id, data);
  //     res.status(200).json(result);
  //   } catch (error) {
  //     res.status(500).json({ message: "Internal Server Error" });
  //   }
  // },

  // handleDelete: async (req: Request, res: Response) => {
  //   try {
  //     const id = req.params.id; // String
  //     const result = await roomsService.delete(id);
  //     res.status(200).json(result);
  //   } catch (error) {
  //     res.status(500).json({ message: "Internal Server Error" });
  //   }
  // },
};

export default roomsController;