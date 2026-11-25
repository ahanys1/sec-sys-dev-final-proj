import { randomInt } from "node:crypto";
import { Prisma, type PrismaClient, type Role } from "../../generated/prisma/client";
import { recordAudit, runAudited, type AuditAction } from "../audit";
import { ApiError } from "../http";
import { checkNewPassword, hashPassword } from "../auth/password";
import { destroyUserSessions } from "../auth/session";
import { getSettings } from "../auth/settings";
import { serializable } from "../tx";

// EP-12 to EP-17: FR-1 to FR-3, FR-11, SR-6, T-20, T-27, T-28 (ASVS V6.4.1, V7.4.2, V8.2.3, V15.3.1, V15.3.3).

/** Explicit allowlist: the password hash is never selected (T-28, V15.3.1). */
export const USER_SELECT = {
  id: true,
  username: true,
  role: true,
  active: true,
  mustChangePassword: true,
  tempPasswordExpiresAt: true,
  createdAt: true,
} as const;
export type AdminUser = Prisma.UserGetPayload<{ select: typeof USER_SELECT }>;

// 24 characters from 32 symbols (no 0, O, 1, I) is 120 bits from the CSPRNG, above the 15-character policy minimum.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const TEMP_PASSWORD_LENGTH = 24;

/** V6.4.1, V11.5.1: random, policy-compliant, shown once, and it expires. */
export function generateTemporaryPassword(username?: string): string {
  for (;;) {
    const password = Array.from({ length: TEMP_PASSWORD_LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
    if (checkNewPassword(password, username) === null) return password;
  }
}

/** Duplicate usernames and vanished rows become safe, generic errors. */
async function translate<T>(work: () => Promise<T>): Promise<T> {
  try {
    return await work();
  } catch (err) {
    const code = (err as { code?: unknown }).code;
    if (code === "P2002") throw new ApiError("conflict");
    if (code === "P2025") throw new ApiError("not_found");
    throw err;
  }
}

const actorOf = (userId: string) => ({ type: "user", userId }) as const;

/** SR-6: an admin never changes their own role, status, or password through these routes. */
function assertNotSelf(actorId: string, targetId: string): void {
  if (actorId === targetId) throw new ApiError("forbidden");
}

export async function listUsers(db: PrismaClient): Promise<AdminUser[]> {
  return db.user.findMany({ select: USER_SELECT, orderBy: { username: "asc" }, take: 500 });
}

export async function createUser(db: PrismaClient, actorId: string, input: { username: string; role: Role }) {
  const settings = await getSettings(db);
  const temporaryPassword = generateTemporaryPassword(input.username);
  const passwordHash = await hashPassword(temporaryPassword);
  const user = await translate(() =>
    runAudited(
      db,
      (tx) =>
        tx.user.create({
          data: {
            username: input.username,
            role: input.role,
            passwordHash,
            mustChangePassword: true,
            tempPasswordUsedAt: null,
            tempPasswordExpiresAt: new Date(Date.now() + settings.tempPasswordHours * 3_600_000),
          },
          select: USER_SELECT,
        }),
      (created) => ({ actor: actorOf(actorId), action: "user.create", targetId: created.id }),
    ),
  );
  return { user, temporaryPassword };
}

export async function updateUsername(db: PrismaClient, actorId: string, targetId: string, username: string) {
  return translate(() =>
    runAudited(
      db,
      (tx) => tx.user.update({ where: { id: targetId }, data: { username }, select: USER_SELECT }),
      () => ({ actor: actorOf(actorId), action: "user.update", targetId }),
    ),
  );
}

/** Another active admin must remain after the change (T-27); checked inside the Serializable transaction. */
async function assertAnotherAdmin(tx: Prisma.TransactionClient, targetId: string): Promise<void> {
  const others = await tx.user.count({ where: { role: "admin", active: true, id: { not: targetId } } });
  if (others === 0) throw new ApiError("conflict");
}

async function guardedChange(
  db: PrismaClient,
  actorId: string,
  targetId: string,
  change: (tx: Prisma.TransactionClient, target: AdminUser) => Promise<{ data: Prisma.UserUpdateInput; action: AuditAction } | null>,
): Promise<AdminUser> {
  assertNotSelf(actorId, targetId);
  return translate(() =>
    serializable(db, async (tx) => {
      const target = await tx.user.findUnique({ where: { id: targetId }, select: USER_SELECT });
      if (!target) throw new ApiError("not_found");
      const plan = await change(tx, target);
      if (!plan) return target; // nothing to change, nothing to audit
      const updated = await tx.user.update({ where: { id: targetId }, data: plan.data, select: USER_SELECT });
      await recordAudit(tx, { actor: actorOf(actorId), action: plan.action, targetId });
      return updated;
    }),
  );
}

export function changeRole(db: PrismaClient, actorId: string, targetId: string, role: Role) {
  return guardedChange(db, actorId, targetId, async (tx, target) => {
    if (target.role === role) return null;
    if (target.role === "admin" && target.active) await assertAnotherAdmin(tx, targetId);
    return { data: { role }, action: "user.role" };
  });
}

/** Deactivation ends every session of the target (V7.4.2, V7.4.5). Reactivation is audited as a user update. */
export function setActive(db: PrismaClient, actorId: string, targetId: string, active: boolean) {
  return guardedChange(db, actorId, targetId, async (tx, target) => {
    if (target.active === active) return null;
    if (!active) {
      if (target.role === "admin") await assertAnotherAdmin(tx, targetId);
      await destroyUserSessions(tx, targetId);
    }
    return { data: { active }, action: active ? "user.update" : "user.deactivate" };
  });
}

/** EP-17: a new temporary password, forced change at next login, and all target sessions ended (V7.4.2). */
export async function resetPassword(db: PrismaClient, actorId: string, targetId: string) {
  assertNotSelf(actorId, targetId);
  const record = await db.user.findUnique({ where: { id: targetId }, select: { username: true } });
  if (!record) throw new ApiError("not_found");
  const settings = await getSettings(db);
  const temporaryPassword = generateTemporaryPassword(record.username);
  const passwordHash = await hashPassword(temporaryPassword);
  const user = await translate(() =>
    runAudited(
      db,
      async (tx) => {
        const updated = await tx.user.update({
          where: { id: targetId },
          data: {
            passwordHash,
            mustChangePassword: true,
            tempPasswordUsedAt: null,
            tempPasswordExpiresAt: new Date(Date.now() + settings.tempPasswordHours * 3_600_000),
          },
          select: USER_SELECT,
        });
        await destroyUserSessions(tx, targetId);
        return updated;
      },
      () => ({ actor: actorOf(actorId), action: "user.password.reset", targetId }),
    ),
  );
  return { user, temporaryPassword };
}
