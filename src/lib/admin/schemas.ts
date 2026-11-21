import { z } from "zod";
import { USERNAME_PATTERN } from "../auth/create-admin";

// SR-7, V2.2.1, V2.2.2: strict schemas for the admin account routes. Profile edits can never carry
// `role`, `active`, or password fields (EP-16; V15.3.3, V8.2.3).
export const ROLES = ["user", "reviewer", "admin"] as const;

/** Normalized once (NFKC, trimmed, lowercase) and then validated, matching login lookup. */
export const usernameSchema = z
  .string()
  .max(64)
  .transform((value) => value.normalize("NFKC").trim().toLowerCase())
  .pipe(z.string().regex(USERNAME_PATTERN));

export const createUserSchema = z.strictObject({ username: usernameSchema, role: z.enum(ROLES) });
export const updateUsernameSchema = z.strictObject({ username: usernameSchema });
export const roleSchema = z.strictObject({ role: z.enum(ROLES) });
export const statusSchema = z.strictObject({ active: z.boolean() });
export const emptySchema = z.strictObject({});
export const idSchema = z.uuid();
