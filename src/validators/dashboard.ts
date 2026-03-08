import z from "zod";

const dashboardRequestSchema = z.object({
  roomCode: z.string(),
  startDate: z.date(),
  endDate: z.date(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().default(10),
});

type DashboardRequest = z.infer<typeof dashboardRequestSchema>;

export { dashboardRequestSchema, type DashboardRequest };
