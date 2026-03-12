import { Prisma } from "../../prisma/generated/client";
import { formatDate } from "../lib/format-date";
import { prisma } from "../lib/prisma";

const dashboardService = {
	getByRoomId: async (
		roomCode: string,
		date: Date,
		search: string | undefined,
		page: number,
		limit: number,
	) => {
		const start = `${formatDate(date)}T00:00:00.000Z`;
		const end = `${formatDate(date)}T23:59:59.999Z`;

		const baseWhere: Prisma.CheckinWhereInput = {
			checkIn: {
				gte: start,
				lte: end,
			},
		};

		if (roomCode !== "All") {
			baseWhere.roomCode = roomCode;
		}

		const whereClause: Prisma.CheckinWhereInput = search
			? {
					...baseWhere,
					OR: [
						{
							StudentId: {
								contains: search,
								mode: Prisma.QueryMode.insensitive,
							},
						},
						{
							student: {
								fname: {
									contains: search,
									mode: Prisma.QueryMode.insensitive,
								},
							},
						},
						{
							student: {
								lname: {
									contains: search,
									mode: Prisma.QueryMode.insensitive,
								},
							},
						},
					],
				}
			: baseWhere;

		const [data, attendancesCount] = await Promise.all([
			prisma.checkin.findMany({
				where: whereClause,
				select: {
					checkIn: true,
					checkOut: true,
					StudentId: true,
					roomCode: true,
					student: {
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
			studentId: attendance.StudentId,
			user_name: `${attendance.student.fname} ${attendance.student.lname}`,
			checkinTime: attendance.checkIn,
			checkoutTime: attendance.checkOut,
			room_code: attendance.roomCode,
		}));

		return { attendances, attendancesCount, pageCount, limit, page };
	},
};

export default dashboardService;
