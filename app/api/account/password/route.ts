import { z } from "zod";
import { runAudited } from "@/src/lib/audit";
import { getDb } from "@/src/lib/db";
import { ApiError, jsonResponse, methodNotAllowed, route } from "@/src/lib/http";
import { logger } from "@/src/lib/logger";
import { parseWrite } from "@/src/lib/request";
import { authenticate } from "@/src/lib/auth/guard";
import { checkNewPassword, hashPassword, PASSWORD_MAX, PASSWORD_MESSAGES, verifyPassword } from "@/src/lib/auth/password";
import { countAttempt, PASSWORD_CHANGE_LIMIT, retryAfterSeconds } from "@/src/lib/auth/rate-limit";
import { destroyUserSessions } from "@/src/lib/auth/session";

// EP-06: FR-11, SR-2, T-13 to T-16 (ASVS V6.2.1 to V6.2.12, V6.2.3, V7.4.3). Allowed while a temporary password is pending.
const schema = z.strictObject({
  currentPassword: z.string().min(1).max(PASSWORD_MAX),
  newPassword: z.string().max(PASSWORD_MAX * 2), // length rules are checked below with fixed messages
  endOtherSessions: z.boolean().default(true),
});

export const POST = route("account.password", async (requestId, request) => {
  const body = await parseWrite(request, schema);
  const { sessionId, user } = await authenticate(request, { allowPasswordChange: true });
  const db = getDb();

  // Same style of limit as login: five attempts per 15 minutes per user (design §6).
  if ((await countAttempt(db, "username", `pwchange:${user.id}`)) > PASSWORD_CHANGE_LIMIT) {
    throw new ApiError("rate_limited", undefined, { "Retry-After": String(retryAfterSeconds(null)) });
  }

  const record = await db.user.findUnique({ where: { id: user.id } });
  if (!record || !(await verifyPassword(record.passwordHash, body.currentPassword))) {
    logger.warn("account.password.failed", { requestId, userId: user.id, reason: "current" });
    throw new ApiError("invalid_request", { currentPassword: "Incorrect password." });
  }
  const problem = checkNewPassword(body.newPassword, record.username);
  if (problem) throw new ApiError("invalid_request", { newPassword: PASSWORD_MESSAGES[problem] });
  if (body.newPassword === body.currentPassword) {
    throw new ApiError("invalid_request", { newPassword: "Must differ from the current password." });
  }

  const passwordHash = await hashPassword(body.newPassword);
  await runAudited(
    db,
    async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash, mustChangePassword: false, tempPasswordExpiresAt: null },
      });
      if (body.endOtherSessions) await destroyUserSessions(tx, user.id, sessionId);
    },
    () => ({ actor: { type: "user", userId: user.id }, action: "user.password.change", targetId: user.id }),
  );
  logger.info("account.password.changed", { requestId, userId: user.id });
  return jsonResponse({ ok: true });
});

export const OPTIONS = () => methodNotAllowed(["POST"]);
