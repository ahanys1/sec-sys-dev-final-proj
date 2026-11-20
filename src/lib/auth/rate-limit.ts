import type { Db } from "../tx";

// T-01, T-03, T-12, ASVS V6.3.1, V2.4.1: counters live in the database (login_attempts) so they survive restarts and
// hold across instances. Usernames are counted as submitted, even when no such account exists (T-02).
export const IP_LIMIT = 20;
export const PASSWORD_CHANGE_LIMIT = 5;
export const WINDOW_MS = 15 * 60_000;

const windowStart = (now: number) => new Date(Math.floor(now / WINDOW_MS) * WINDOW_MS);

/** Atomic upsert with bound parameters; returns the attempts counted in the current window. */
export async function countAttempt(db: Db, scope: "ip" | "username", key: string, now = Date.now()): Promise<number> {
  const rows = await db.$queryRaw<{ count: number }[]>`
    INSERT INTO login_attempts (scope, key, window_start, count)
    VALUES (${scope}::"AttemptScope", ${key}, ${windowStart(now)}, 1)
    ON CONFLICT (scope, key, window_start) DO UPDATE SET count = login_attempts.count + 1
    RETURNING count`;
  return rows[0].count;
}

/** Start a lockout once failures reach the threshold. */
export async function lockIfNeeded(
  db: Db,
  key: string,
  failures: number,
  settings: { lockoutThreshold: number; lockoutMinutes: number },
  now = Date.now(),
): Promise<void> {
  if (failures < settings.lockoutThreshold) return;
  await db.loginAttempt.updateMany({
    where: { scope: "username", key, windowStart: windowStart(now) },
    data: { lockoutUntil: new Date(now + settings.lockoutMinutes * 60_000) },
  });
}

export async function lockoutEnds(db: Db, key: string, now = Date.now()): Promise<Date | null> {
  const row = await db.loginAttempt.findFirst({
    where: { scope: "username", key, lockoutUntil: { gt: new Date(now) } },
    orderBy: { lockoutUntil: "desc" },
  });
  return row?.lockoutUntil ?? null;
}

export async function clearAttempts(db: Db, key: string): Promise<void> {
  await db.loginAttempt.deleteMany({ where: { scope: "username", key } });
}

export const retryAfterSeconds = (until: Date | null, now = Date.now()) =>
  until ? Math.max(1, Math.ceil((until.getTime() - now) / 1000)) : Math.ceil(WINDOW_MS / 1000);
