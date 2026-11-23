import { z } from "zod";

// EP-22: Validate administrator-created incident categories.
export const createCategorySchema = z.strictObject({
  name: z.string().trim().min(1).max(100),
});

export type CreateCategoryInput = z.infer<
  typeof createCategorySchema
>;

// EP-23: Administrators may rename or activate/deactivate categories.
// At least one permitted field must be supplied.
export const updateCategorySchema = z
  .strictObject({
    name: z.string().trim().min(1).max(100).optional(),
    active: z.boolean().optional(),
  })
  .refine(
    (input) => input.name !== undefined || input.active !== undefined,
    { message: "At least one field is required" },
  );

export type UpdateCategoryInput = z.infer<
  typeof updateCategorySchema
>;
