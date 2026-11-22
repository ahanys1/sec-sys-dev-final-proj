import { z } from "zod";

export const createIncidentSchema = z.strictObject({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(10_000),
  categoryId: z.uuid(),
});

export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;