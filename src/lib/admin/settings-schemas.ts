
import { z } from "zod";

// EP-19: Admin settings validation.
// Reject invalid input rather than silently applying fallback values.
export const updateSettingsSchema = z
  .object({
    statusMessage: z.string().max(280).optional(),
    sessionIdleMinutes: z.number().int().min(5).max(60).optional(),
    sessionMaxHours: z.number().int().min(1).max(12).optional(),
    lockoutThreshold: z.number().int().min(3).max(10).optional(),
    lockoutMinutes: z.number().int().min(5).max(60).optional(),
    tempPasswordHours: z.number().int().min(1).max(72).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one setting must be provided",
  });

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
