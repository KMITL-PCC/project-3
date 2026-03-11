import { Prisma } from "../../prisma/generated/prisma/client";
import { formatDate } from "../lib/format-date";
import { prisma } from "../lib/prisma";

const dashboardService = {
  // getByRoomId: async (
  //   roomCode: string,
  //   startDate: Date,
  //   endDate: Date,
  //   page: number,
  //   limit: number,
  // ) => {
  //   const parsedStartDate = `${formatDate(startDate)}T00:00:00.000Z`;
  //   const parsedEndDate = `${formatDate(endDate)}T23:59:59.999Z`;

  //   const whereClause = {
  //     room_code: roomCode,
  //     check_in: {
  //       gte: parsedStartDate,
  //       lte: parsedEndDate,
  //     },
  //   };

  //   const [data, attendancesCount] = await Promise.all([
  //     prisma.checkin.findMany({
  //       where: whereClause,
  //       select: {
  //         check_in: true,
  //         check_out: true,
  //         student_id: true,
  //         users: {
  //           select: {
  //             fname: true,
  //             lname: true,
  //           },
  //         },
  //       },
  //       take: limit,
  //       skip: (page - 1) * limit,
  //     }),
  //     prisma.checkin.count({ where: whereClause }),
  //   ]);

  //   const pageCount = Math.ceil(attendancesCount / limit);

  //   const attendances = data.map((attendance) => ({
  //     studentId: attendance.student_id,
  //     fname: attendance.users.fname,
  //     lname: attendance.users.lname,
  //     checkinTime: attendance.check_in,
  //     checkoutTime: attendance.check_out,
  //   }));

  //   return { attendances, attendancesCount, pageCount, limit, page };
  // },
  getByRoomId: async (
    roomCode: string,
    date: Date,
    search: string | undefined,
    page: number,
    limit: number,
  ) => {
    const start = `${formatDate(date)}T00:00:00.000Z`;
    const end = `${formatDate(date)}T23:59:59.999Z`;

    const whereClause = search
      ? {
          room_code: roomCode,
          OR: [
            {
              student_id: {
                contains: search,
                mode: Prisma.QueryMode.insensitive,
              },
            },
            {
              users: {
                fname: {
                  contains: search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            },
            {
              users: {
                lname: {
                  contains: search,
                  mode: Prisma.QueryMode.insensitive,
                },
              },
            },
          ],
          check_in: {
            gte: start,
            lte: end,
          },
        }
      : {
          room_code: roomCode,
          check_in: {
            gte: start,
            lte: end,
          },
        };

    const [data, attendancesCount] = await Promise.all([
      prisma.checkin.findMany({
        where: whereClause,
        select: {
          check_in: true,
          check_out: true,
          student_id: true,
          users: {
            select: {
              fname: true,
              lname: true,
            },
          },
        },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.checkin.count({ where: whereClause }),
    ]);

    const pageCount = Math.ceil(attendancesCount / limit);

    const attendances = data.map((attendance) => ({
      studentId: attendance.student_id,
      user_name: `${attendance.users.fname} ${attendance.users.lname}`,
      checkinTime: attendance.check_in,
      checkoutTime: attendance.check_out,
    }));

    return { attendances, attendancesCount, pageCount, limit, page };
  },
};

export default dashboardService;
