import { prisma } from "../lib/prisma";

const dashboardService = {
	getAllStats: async () => {
		const totalUsers = await prisma.users.findMany();

		console.log(totalUsers);

		return totalUsers;
	},
};

export default dashboardService;
