
import { z } from "zod";

// EP-22: Validate administrator-created incident categories.
export const createCategorySchema = z.strictObject({
  name: z.string().trim().min(1).max(100),
});

export type CreateCategoryInput = z.infer<
  typeof createCategorySchema
>;