import { formatDate } from "../lib/format-date";
import { prisma } from "../lib/prisma";

// const TIME_PERIODS = [
// 	{ label: "00:00 - 11:59", startHour: 0, endHour: 11, endMinute: 59 },
// 	{ label: "12:00 - 16:00", startHour: 12, endHour: 16, endMinute: 0 },
// 	{ label: "17:00 - 23:59", startHour: 17, endHour: 23, endMinute: 59 },
// ];

// function getTimePeriodIndex(date: Date): number {
// 	const hour = date.getHours();
// 	const minute = date.getMinutes();

// 	for (let i = 0; i < TIME_PERIODS.length; i++) {
// 		const period = TIME_PERIODS[i];
// 		const startMatch = hour >= period.startHour;
// 		const endMatch =
// 			hour < period.endHour ||
// 			(hour === period.endHour && minute <= period.endMinute);

// 		if (startMatch && endMatch) {
// 			return i;
// 		}
// 	}
// 	return -1;
// }

const dashboardService = {
  getByRoomId: async (
    roomId: number,
    startDate: Date,
    endDate: Date,
    page: number,
    limit: number,
  ) => {
    const parsedStartDate = `${formatDate(startDate)}T00:00:00.000Z`;
    const parsedEndDate = `${formatDate(endDate)}T23:59:59.999Z`;

    const whereClause = {
      classSession: {
        roomId: roomId,
      },
      checkinTime: {
        gte: parsedStartDate,
        lte: parsedEndDate,
      },
    };

    prisma.attendance;

    const [data, attendancesCount] = await Promise.all([
      prisma.attendance.findMany({
        where: whereClause,
        select: {
          checkinTime: true,
          // checkoutTime: true, ไม่มีใน Database
          user: {
            select: {
              id: true,
              username: true,
            },
          },
        },
        take: limit,
        skip: (page - 1) * limit,
      }),
      prisma.attendance.count(),
    ]);

    const pageCount = Math.ceil(attendancesCount / limit);

    const attendances = data.map((attendance) => ({
      studentId: attendance.user.id,
      username: attendance.user.username,
      checkinTime: attendance.checkinTime,
      // checkoutTime: attendance.checkoutTime,
    }));

    return { attendances, attendancesCount, pageCount, limit, page };
  },

  // getStatsByRoomId: async (roomId: number, date: Date) => {
  // 	const year = date.getFullYear();
  // 	const month = String(date.getMonth() + 1).padStart(2, "0");
  // 	const day = String(date.getDate()).padStart(2, "0");

  // 	const start = `${year}-${month}-${day}T00:00:00.000Z`;
  // 	const end = `${year}-${month}-${day}T23:59:59.999Z`;

  // 	const [attendances, totalStudents] = await Promise.all([
  // 		prisma.attendance.findMany({
  // 			where: {
  // 				classSession: {
  // 					roomId: roomId,
  // 				},
  // 				checkinTime: {
  // 					gte: start,
  // 					lte: end,
  // 				},
  // 			},
  // 			select: {
  // 				checkinTime: true,
  // 				checkoutTime: true,
  // 			},
  // 		}),
  // 		prisma.room.findUnique({
  // 			where: { id: roomId },
  // 			select: { maxStudents: true },
  // 		}),
  // 	]);

  // 	const timeInCounts = TIME_PERIODS.map(() => 0);
  // 	const timeOutCounts = TIME_PERIODS.map(() => 0);

  // 	for (const attendance of attendances) {
  // 		const checkinIndex = getTimePeriodIndex(attendance.checkinTime);
  // 		if (checkinIndex !== -1) {
  // 			timeInCounts[checkinIndex]++;
  // 		}

  // 		if (attendance.checkoutTime) {
  // 			const checkoutIndex = getTimePeriodIndex(attendance.checkoutTime);
  // 			if (checkoutIndex !== -1) {
  // 				timeOutCounts[checkoutIndex]++;
  // 			}
  // 		}
  // 	}

  // 	return {
  // 		totalStudents: totalStudents?.maxStudents ?? 0,
  // 		timeIn: TIME_PERIODS.map((period, index) => ({
  // 			label: period.label,
  // 			count: timeInCounts[index],
  // 		})),
  // 		timeOut: TIME_PERIODS.map((period, index) => ({
  // 			label: period.label,
  // 			count: timeOutCounts[index],
  // 		})),
  // 	};
  // },
};

export default dashboardService;
