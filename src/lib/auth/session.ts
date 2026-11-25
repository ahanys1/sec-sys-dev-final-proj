import { createHash, randomBytes } from "node:crypto";
import type { PrismaClient, Role } from "../../generated/prisma/client";
import { serializable, type Db } from "../tx";
import { ApiError } from "../http";
import type { Settings } from "./settings";

// SR-3, ASVS V7.2.1 to V7.2.4, V7.3.1, V7.3.2, V7.4.1, V7.4.2, V3.3.1: server-side sessions. The cookie holds
// only a random token; the database holds its SHA-256, and the role is read from the database on every request.
export const SESSION_COOKIE = "__Host-session";
export const MAX_SESSIONS = 5; // V7.1.2: the oldest session ends when a sixth is created
const TOUCH_EVERY_MS = 60_000;

export const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");
export const newToken = () => randomBytes(32).toString("base64url"); // 256 bits from the CSPRNG

export type SessionUser = {
  id: string;
  username: string;
  role: Role;
  mustChangePassword: boolean;
};

/** `__Host-` requires Secure, Path=/, and no Domain; HttpOnly and SameSite=Strict block script access and CSRF. */
export const sessionCookie = (token: string) => `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict`;
export const clearedCookie = () =>
  `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;

export function tokenFromCookieHeader(header: string | null): string | null {
  for (const part of (header ?? "").split(";")) {
    const [name, ...value] = part.trim().split("=");
    if (name === SESSION_COOKIE) return value.join("=") || null;
  }
  return null;
}

/** Create a session for a user, ending their oldest ones past the cap (V7.2.4: always a new token). */
export async function createSession(
  db: PrismaClient,
  userId: string,
  settings: Settings,
  credential?: { passwordHash: string; mustChangePassword: boolean },
): Promise<string> {
  const token = newToken();
  const now = Date.now();
  await serializable(db, async (tx) => {
    if (credential) {
      // SR-2/3, ASVS V6.4.1/V2.3.3: only one concurrent login may consume a temporary password.
      // Match the verified hash too, so a concurrent admin reset cannot authenticate an old credential.
      const where = { id: userId, active: true, ...credential };
      if (credential.mustChangePassword) {
        const consumed = await tx.user.updateMany({
          where: {
            ...where,
            tempPasswordUsedAt: null,
            OR: [{ tempPasswordExpiresAt: null }, { tempPasswordExpiresAt: { gt: new Date(now) } }],
          },
          data: { tempPasswordUsedAt: new Date(now) },
        });
        if (consumed.count !== 1) throw new ApiError("invalid_credentials");
      } else if (!(await tx.user.findFirst({ where, select: { id: true } }))) {
        throw new ApiError("invalid_credentials");
      }
    }
    const existing = await tx.session.findMany({ where: { userId }, orderBy: { createdAt: "asc" }, select: { id: true } });
    const evict = existing.slice(0, Math.max(0, existing.length - (MAX_SESSIONS - 1)));
    if (evict.length > 0) await tx.session.deleteMany({ where: { id: { in: evict.map((s) => s.id) } } });
    await tx.session.create({
      data: { tokenHash: hashToken(token), userId, expiresAt: new Date(now + settings.sessionMaxHours * 3_600_000) },
    });
  });
  return token;
}

/** Resolve a cookie token to a user, or null if it is unknown, expired, idle, or the account is deactivated. */
export async function resolveSession(
  db: Db,
  token: string | null,
  settings: Settings,
): Promise<{ sessionId: string; user: SessionUser } | null> {
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session) return null;

  const now = Date.now();
  const idleDeadline = session.lastActivityAt.getTime() + settings.sessionIdleMinutes * 60_000;
  const tempExpired =
    session.user.mustChangePassword &&
    session.user.tempPasswordExpiresAt !== null &&
    session.user.tempPasswordExpiresAt.getTime() < now;
  if (!session.user.active || session.expiresAt.getTime() <= now || idleDeadline <= now || tempExpired) {
    await db.session.deleteMany({ where: { id: session.id } });
    return null;
  }
  if (now - session.lastActivityAt.getTime() > TOUCH_EVERY_MS) {
    await db.session.update({ where: { id: session.id }, data: { lastActivityAt: new Date(now) } });
  }
  const { user } = session;
  return {
    sessionId: session.id,
    user: { id: user.id, username: user.username, role: user.role, mustChangePassword: user.mustChangePassword },
  };
}

export async function destroySession(db: Db, sessionId: string): Promise<void> {
  await db.session.deleteMany({ where: { id: sessionId } });
}

/** V7.4.2, V7.4.3: end every session for a user, optionally keeping the current one. */
export async function destroyUserSessions(db: Db, userId: string, exceptSessionId?: string): Promise<void> {
  await db.session.deleteMany({ where: { userId, ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}) } });
}

/** design §6: clear expired sessions and old counters on login. */
export async function cleanupExpired(db: Db): Promise<void> {
  const now = new Date();
  await db.session.deleteMany({ where: { expiresAt: { lt: now } } });
  await db.loginAttempt.deleteMany({
    where: { windowStart: { lt: new Date(now.getTime() - 24 * 3_600_000) }, OR: [{ lockoutUntil: null }, { lockoutUntil: { lt: now } }] },
  });
}
