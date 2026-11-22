import { z } from "zod";

export const createIncidentSchema = z.strictObject({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(10_000),
  categoryId: z.uuid(),
});

export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;

// EP-11: Validate reviewer/admin comments before persistence (C-3).
export const createCommentSchema = z
  .object({
    body: z.string().trim().min(1).max(2000),
  })
  .strict();

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

 // EP-10: Only forward incident status transitions are permitted.
export const updateIncidentStatusSchema = z.strictObject({
  status: z.enum(["under_review", "closed"]),
});

export type UpdateIncidentStatusInput = z.infer<
  typeof updateIncidentStatusSchema
>;
