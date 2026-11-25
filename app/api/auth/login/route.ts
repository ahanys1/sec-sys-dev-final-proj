import { z } from "zod";
import { getDb } from "@/src/lib/db";
import { ApiError, jsonResponse, methodNotAllowed, route } from "@/src/lib/http";
import { clientIp } from "@/src/lib/ip";
import { logger } from "@/src/lib/logger";
import { parseWrite } from "@/src/lib/request";
import { verifyAgainstDummy, verifyPassword } from "@/src/lib/auth/password";
import { clearAttempts, countAttempt, IP_LIMIT, lockIfNeeded, lockoutEnds, retryAfterSeconds } from "@/src/lib/auth/rate-limit";
import { getSettings } from "@/src/lib/auth/settings";
import {
  cleanupExpired,
  createSession,
  destroySession,
  resolveSession,
  sessionCookie,
  tokenFromCookieHeader,
} from "@/src/lib/auth/session";

// EP-02: FR-4, SR-2, SR-3, T-01 to T-05 (ASVS V6.3.1, V7.2.3, V7.2.4, V2.4.1).
const schema = z.strictObject({ username: z.string().min(1).max(128), password: z.string().min(1).max(128) });

// One generic failure for every reason: unknown name, wrong password, deactivated, expired temporary password.
const failure = () => new ApiError("invalid_credentials");

const normalize = (username: string) => username.normalize("NFKC").trim().toLowerCase().slice(0, 64);

export const POST = route("auth.login", async (requestId, request) => {
  const { username: submitted, password } = await parseWrite(request, schema);
  const db = getDb();
  const settings = await getSettings(db);
  const username = normalize(submitted);
  const ip = clientIp(request.headers);

  // Limits run before any hashing so floods can't burn CPU (T-04).
  if ((await countAttempt(db, "ip", ip)) > IP_LIMIT) {
    logger.warn("auth.login.limited", { requestId, reason: "ip", ip });
    throw new ApiError("rate_limited", undefined, { "Retry-After": String(retryAfterSeconds(null)) });
  }
  const lockedUntil = await lockoutEnds(db, username);
  if (lockedUntil) {
    logger.warn("auth.login.limited", { requestId, reason: "lockout", ip });
    throw new ApiError("rate_limited", undefined, { "Retry-After": String(retryAfterSeconds(lockedUntil)) });
  }

  const user = await db.user.findUnique({ where: { username } });
  const tempExpired =
    user?.mustChangePassword && (user.tempPasswordUsedAt !== null ||
      (user.tempPasswordExpiresAt !== null && user.tempPasswordExpiresAt.getTime() <= Date.now()));
  const ok = user && user.active && !tempExpired ? await verifyPassword(user.passwordHash, password) : await verifyAgainstDummy(password);

  if (!user || !ok) {
    const failures = await countAttempt(db, "username", username);
    await lockIfNeeded(db, username, failures, settings);
    // T-07: log an account ID only when one matches; never the submitted name or password.
    logger.warn("auth.login.failed", { requestId, ip, userId: user?.id });
    throw failure();
  }

  // V7.2.4: end any session this browser already holds, then issue a fresh token.
  const previous = tokenFromCookieHeader(request.headers.get("cookie"));
  const existing = await resolveSession(db, previous, settings);
  if (existing) await destroySession(db, existing.sessionId);
  await cleanupExpired(db);
  await clearAttempts(db, username);
  const token = await createSession(db, user.id, settings, {
    passwordHash: user.passwordHash,
    mustChangePassword: user.mustChangePassword,
  });

  logger.info("auth.login.ok", { requestId, ip, userId: user.id });
  const response = jsonResponse({ user: { username: user.username, role: user.role }, mustChangePassword: user.mustChangePassword });
  response.headers.append("Set-Cookie", sessionCookie(token));
  return response;
});

// NFR-2, ASVS V16.5.1: unsupported methods use the same JSON error and Allow header.
export const OPTIONS = () => methodNotAllowed(["POST"]);

export const GET = () => methodNotAllowed(["POST"]);

export const HEAD = () => methodNotAllowed(["POST"]);

export const PUT = () => methodNotAllowed(["POST"]);

export const PATCH = () => methodNotAllowed(["POST"]);

export const DELETE = () => methodNotAllowed(["POST"]);
