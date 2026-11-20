import type { PrismaClient } from "../../generated/prisma/client";
import { runAudited } from "../audit";
import { checkNewPassword, hashPassword, PASSWORD_MESSAGES } from "./password";

// NH-4, T-62, DC-3: first-administrator creation, used by scripts/create-admin.ts. Audited with the system actor.
export const USERNAME_PATTERN = /^[a-z0-9._-]{3,32}$/;

export class CreateAdminError extends Error {}

export async function createFirstAdmin(db: PrismaClient, input: { username: string; password: string }) {
  const username = input.username.normalize("NFKC").trim().toLowerCase();
  if (!USERNAME_PATTERN.test(username)) {
    throw new CreateAdminError("Username must be 3 to 32 characters: a-z, 0-9, dot, underscore, hyphen.");
  }
  const problem = checkNewPassword(input.password, username);
  if (problem) throw new CreateAdminError(PASSWORD_MESSAGES[problem]);
  if (await db.user.findUnique({ where: { username } })) throw new CreateAdminError("That username already exists.");

  const passwordHash = await hashPassword(input.password);
  return runAudited(
    db,
    (tx) => tx.user.create({ data: { username, role: "admin", passwordHash, mustChangePassword: false } }),
    (created) => ({ actor: { type: "system" }, action: "user.create", targetId: created.id }),
  );
}
