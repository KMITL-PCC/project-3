// /app/src/services/rooms.service.ts
import { prisma } from "../lib/prisma";

const roomsService = {
  getAll: async () => {
    // ดึงข้อมูลฟิลด์ที่มีใน schema จริงๆ
    const rooms = await prisma.room.findMany({
      select: {
        room_code: true,
        room_desc: true,
        room_floor: true,
        room_capacity: true,
        building_code: true,
      },
    });
    return rooms;
  },

  // getById: async (id: string) => {
  //   try {
  //     const room = await prisma.room.findUnique({
  //       where: { room_code: id }, // ใช้ room_code เป็นเงื่อนไข
  //     });
  //     return room;
  //   } catch (error) {
  //     throw new Error("Failed to get room by id");
  //   }
  // },

  // create: async (data: any) => {
  //   try {
  //     const newRoom = await prisma.room.create({
  //       data: {
  //         room_code: data.room_code, // บังคับต้องส่งมา เพราะเป็น Primary Key และไม่ได้เป็น Auto Increment
  //         room_desc: data.room_desc,
  //         room_floor: data.room_floor,
  //         room_capacity: data.room_capacity,
  //         building_code: data.building_code,
  //       },
  //     });
  //     return newRoom;
  //   } catch (error) {
  //     throw new Error("Failed to create room");
  //   }
  // },

  // update: async (id: string, data: any) => {
  //   try {
  //     const updatedRoom = await prisma.room.update({
  //       where: { room_code: id },
  //       data: {
  //         room_desc: data.room_desc,
  //         room_floor: data.room_floor,
  //         room_capacity: data.room_capacity,
  //         building_code: data.building_code,
  //       },
  //     });
  //     return updatedRoom;
  //   } catch (error) {
  //     throw new Error("Failed to update room");
  //   }
  // },

  // delete: async (id: string) => {
  //   try {
  //     const deletedRoom = await prisma.room.delete({
  //       where: { room_code: id },
  //     });
  //     return deletedRoom;
  //   } catch (error) {
  //     throw new Error("Failed to delete room");
  //   }
  // },
};

export default roomsService;