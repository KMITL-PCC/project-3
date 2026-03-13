import { prisma } from "../lib/prisma";

const historyService = {
	getAll: async (studentId: string) => {
		const results = await prisma.checkin.findMany({
			where: {
				student: {
					StudentId: studentId,
				},
			},
			select: {
				checkIn: true,
				checkOut: true,
				roomCode: true,
				StudentId: true,
				student: {
					select: {
						fname: true,
						lname: true,
					},
				},
			},
		});

		const history = results.map((result) => {
			return {
				status: result.checkOut ? "checked_out" : "checked_in",
				room_code: result.roomCode,
				student_id: result.StudentId,
				user_name: `${result.student.fname} ${result.student.lname}`,
			};
		});

		console.log(`[History Service] Retrieved history for studentId ${studentId}:`, history);

		return history;
	},
};

export default historyService;
