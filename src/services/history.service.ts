import { prisma } from "../lib/prisma";

const historyService = {
  getAll: async (studentId: string) => {
    const results = await prisma.checkin.findMany({
      where: {
        users: {
          StudentId: studentId,
        },
      },
      select: {
        check_in: true,
        check_out: true,
        room_code: true,
        student_id: true,
        users: {
          select: {
            fname: true,
            lname: true,
          },
        },
      },
    });

    const history = results.map((result) => {
      return {
        status: result.check_out ? "checked_out" : "checked_in",
        room_code: result.room_code,
        student_id: result.student_id,
        user_name: `${result.users.fname} ${result.users.lname}`,
      };
    });

    return history;
  },
};

export default historyService;
