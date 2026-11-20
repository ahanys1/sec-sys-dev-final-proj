import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import pg from "pg";
import type { PrismaClient, Role } from "@/src/generated/prisma/client";
import { ApiError } from "@/src/lib/http";
import { hashPassword, verifyPassword } from "@/src/lib/auth/password";
import { authenticate } from "@/src/lib/auth/guard";
import { createFirstAdmin } from "@/src/lib/auth/create-admin";
import { hashToken, tokenFromCookieHeader } from "@/src/lib/auth/session";

// Needs a migrated database (see tests/db/schema.test.ts). Skipped when unset.
const ownerUrl = process.env.TEST_DATABASE_OWNER_URL;
const appUrl = process.env.TEST_DATABASE_APP_URL;

const PASSWORD = "correct-horse-battery-staple-9";
const NEW_PASSWORD = "a-different-long-passphrase-42";

describe.skipIf(!ownerUrl || !appUrl)("authentication and sessions", () => {
  const owner = new pg.Pool({ connectionString: ownerUrl, max: 1 });
  const tag = randomUUID().slice(0, 6);
  let db: PrismaClient;
  let login: (r: Request) => Promise<Response>;
  let logout: (r: Request) => Promise<Response>;
  let changePassword: (r: Request) => Promise<Response>;
  let seq = 0;

  beforeAll(async () => {
    process.env.DATABASE_URL = appUrl; // the app role, as in production
    process.env.TRUSTED_PROXY_HOPS = "1";
    db = (await import("@/src/lib/db")).getDb();
    login = (await import("@/app/api/auth/login/route")).POST;
    logout = (await import("@/app/api/auth/logout/route")).POST;
    changePassword = (await import("@/app/api/account/password/route")).POST;
  });

  afterAll(async () => {
    await owner.query(
      "DELETE FROM users WHERE username LIKE $1 AND id NOT IN (SELECT user_id FROM audit_log WHERE user_id IS NOT NULL)",
      [`authtest-${tag}-%`],
    );
    await owner.query("DELETE FROM login_attempts WHERE key LIKE $1 OR key LIKE 'pwchange:%' OR scope = 'ip'", [`authtest-${tag}-%`]);
    await owner.end();
    await db.$disconnect();
  });

  const nextName = () => `authtest-${tag}-${++seq}`;
  const nextIp = () => `198.51.100.${++seq % 250}-${tag}${seq}`.slice(0, 45); // unique IP bucket per test

  async function makeUser(
    options: { role?: Role; mustChangePassword?: boolean; active?: boolean; tempExpiresAt?: Date | null } = {},
  ) {
    const username = nextName();
    const user = await db.user.create({
      data: {
        username,
        role: options.role ?? "user",
        active: options.active ?? true,
        mustChangePassword: options.mustChangePassword ?? false,
        tempPasswordExpiresAt: options.tempExpiresAt ?? null,
        passwordHash: await hashPassword(PASSWORD),
      },
    });
    return { id: user.id, username };
  }

  const post = (path: string, body: unknown, extra: Record<string, string> = {}) =>
    new Request(`https://app.test${path}`, {
      method: "POST",
      headers: {
        origin: "https://app.test",
        host: "app.test",
        "content-type": "application/json",
        "x-forwarded-for": "203.0.113.1",
        ...extra,
      },
      body: JSON.stringify(body),
    });

  const cookieOf = (response: Response) => response.headers.get("set-cookie")?.split(";")[0] ?? "";
  const doLogin = (username: string, password = PASSWORD, extra: Record<string, string> = {}) =>
    login(post("/api/auth/login", { username, password }, { "x-forwarded-for": nextIp(), ...extra }));
  const withCookie = (cookie: string) => new Request("https://app.test/x", { headers: { cookie } });

  async function signIn(options?: Parameters<typeof makeUser>[0]) {
    const user = await makeUser(options);
    const response = await doLogin(user.username);
    expect(response.status).toBe(200);
    return { ...user, cookie: cookieOf(response), response };
  }

  async function codeOf(work: Promise<unknown>) {
    try {
      await work;
    } catch (error) {
      return error instanceof ApiError ? error.code : "other";
    }
    return "none";
  }

  describe("login (EP-02; SR-2, SR-3, T-01 to T-07)", () => {
    it("issues a hardened session cookie and stores only the token hash (V7.2.3)", async () => {
      const { response, cookie, id } = await signIn();
      const setCookie = response.headers.get("set-cookie")!;
      for (const part of ["__Host-session=", "HttpOnly", "Secure", "SameSite=Strict", "Path=/"]) expect(setCookie).toContain(part);
      expect(setCookie).not.toMatch(/Domain=/i);
      const token = tokenFromCookieHeader(cookie)!;
      const rows = await owner.query("SELECT token_hash FROM sessions WHERE user_id = $1", [id]);
      expect(rows.rows[0].token_hash).toBe(hashToken(token));
      expect(rows.rows[0].token_hash).not.toBe(token);
      const body = await response.clone().json();
      expect(Object.keys(body).sort()).toEqual(["mustChangePassword", "user"]);
      expect(Object.keys(body.user).sort()).toEqual(["role", "username"]); // never the hash (V15.3.1)
      expect(JSON.stringify(body)).not.toMatch(/argon2|hash/i);
    });

    it("gives the same failure for an unknown user and a wrong password (T-02)", async () => {
      const user = await makeUser();
      const wrong = await doLogin(user.username, "not-the-right-password");
      const unknown = await doLogin(nextName());
      expect(wrong.status).toBe(401);
      expect(unknown.status).toBe(401);
      const strip = async (r: Response) => {
        const { error } = await r.json();
        return { code: error.code, message: error.message };
      };
      expect(await strip(wrong)).toEqual(await strip(unknown));
    });

    it("rejects a deactivated account and an expired temporary password with the same failure", async () => {
      const inactive = await makeUser({ active: false });
      expect((await doLogin(inactive.username)).status).toBe(401);
      const expired = await makeUser({ mustChangePassword: true, tempExpiresAt: new Date(Date.now() - 1000) });
      expect((await doLogin(expired.username)).status).toBe(401);
    });

    it("locks an account after repeated failures, even with the right password, and also for unknown names (T-01, T-03)", async () => {
      const user = await makeUser();
      for (let i = 0; i < 5; i++) expect((await doLogin(user.username, "bad-password-attempt")).status).toBe(401);
      const locked = await doLogin(user.username);
      expect(locked.status).toBe(429);
      expect(locked.headers.get("retry-after")).toBeTruthy();

      const ghost = nextName();
      for (let i = 0; i < 5; i++) await doLogin(ghost, "bad-password-attempt");
      expect((await doLogin(ghost)).status).toBe(429); // no enumeration: a name with no account locks too
    });

    it("limits attempts per IP before hashing (T-04)", async () => {
      const ip = nextIp();
      const statuses: number[] = [];
      for (let i = 0; i < 22; i++) {
        statuses.push((await login(post("/api/auth/login", { username: nextName(), password: "x" }, { "x-forwarded-for": ip }))).status);
      }
      expect(statuses.slice(0, 20).every((s) => s === 401)).toBe(true);
      expect(statuses[21]).toBe(429);
    });

    it("rejects a missing Origin and unknown body fields (C-3, C-4)", async () => {
      const user = await makeUser();
      const noOrigin = new Request("https://app.test/api/auth/login", {
        method: "POST",
        headers: { host: "app.test", "content-type": "application/json" },
        body: JSON.stringify({ username: user.username, password: PASSWORD }),
      });
      expect((await login(noOrigin)).status).toBe(403);
      const extra = await login(post("/api/auth/login", { username: user.username, password: PASSWORD, role: "admin" }));
      expect(extra.status).toBe(400);
    });

    it("issues a new token and ends the old session on re-login (V7.2.4)", async () => {
      const first = await signIn();
      const again = await login(post("/api/auth/login", { username: first.username, password: PASSWORD }, { cookie: first.cookie, "x-forwarded-for": nextIp() }));
      const second = cookieOf(again);
      expect(second).not.toBe(first.cookie);
      expect(await codeOf(authenticate(withCookie(first.cookie)))).toBe("unauthenticated");
      await authenticate(withCookie(second));
    });

    it("keeps at most five sessions and ends the oldest (V7.1.2)", async () => {
      const user = await makeUser();
      const cookies: string[] = [];
      for (let i = 0; i < 6; i++) cookies.push(cookieOf(await doLogin(user.username)));
      const count = await owner.query("SELECT count(*)::int AS n FROM sessions WHERE user_id = $1", [user.id]);
      expect(count.rows[0].n).toBe(5);
      expect(await codeOf(authenticate(withCookie(cookies[0])))).toBe("unauthenticated");
      await authenticate(withCookie(cookies[5]));
    });
  });

  describe("session checks (SR-1, SR-4, SR-5, C-1, C-2, C-11)", () => {
    it("rejects a missing or forged cookie", async () => {
      expect(await codeOf(authenticate(new Request("https://app.test/x")))).toBe("unauthenticated");
      expect(await codeOf(authenticate(withCookie("__Host-session=forged")))).toBe("unauthenticated");
    });

    it("enforces the inactivity timeout (V7.3.1)", async () => {
      const { cookie, id } = await signIn();
      await owner.query("UPDATE sessions SET last_activity_at = now() - interval '31 minutes' WHERE user_id = $1", [id]);
      expect(await codeOf(authenticate(withCookie(cookie)))).toBe("unauthenticated");
      const left = await owner.query("SELECT count(*)::int AS n FROM sessions WHERE user_id = $1", [id]);
      expect(left.rows[0].n).toBe(0);
    });

    it("enforces the absolute lifetime (V7.3.2)", async () => {
      const { cookie, id } = await signIn();
      await owner.query("UPDATE sessions SET expires_at = now() - interval '1 second' WHERE user_id = $1", [id]);
      expect(await codeOf(authenticate(withCookie(cookie)))).toBe("unauthenticated");
    });

    it("stops working when the account is deactivated (V7.4.2)", async () => {
      const { cookie, id } = await signIn();
      await owner.query("UPDATE users SET active = false WHERE id = $1", [id]);
      expect(await codeOf(authenticate(withCookie(cookie)))).toBe("unauthenticated");
    });

    it("reads the role from the database on every request, not the cookie (T-11)", async () => {
      const { cookie, id } = await signIn();
      expect((await authenticate(withCookie(cookie))).user.role).toBe("user");
      await owner.query("UPDATE users SET role = 'reviewer' WHERE id = $1", [id]);
      expect((await authenticate(withCookie(cookie))).user.role).toBe("reviewer");
      expect(await codeOf(authenticate(withCookie(cookie), { roles: ["admin"] }))).toBe("forbidden");
    });

    it("limits a temporary-password session to logout and password change (C-11, T-16)", async () => {
      const { cookie, response } = await signIn({ mustChangePassword: true });
      expect((await response.json()).mustChangePassword).toBe(true);
      expect(await codeOf(authenticate(withCookie(cookie)))).toBe("password_change_required");
      expect((await authenticate(withCookie(cookie), { allowPasswordChange: true })).user.mustChangePassword).toBe(true);
    });
  });

  describe("logout (EP-05; FR-5, V7.4.1)", () => {
    it("ends the session, clears the cookie and site data", async () => {
      const { cookie } = await signIn();
      const response = await logout(post("/api/auth/logout", {}, { cookie }));
      expect(response.status).toBe(200);
      expect(response.headers.get("set-cookie")).toContain("Max-Age=0");
      expect(response.headers.get("clear-site-data")).toContain("cookies");
      expect(await codeOf(authenticate(withCookie(cookie)))).toBe("unauthenticated");
    });

    it("needs a session and a same-origin request", async () => {
      expect((await logout(post("/api/auth/logout", {}))).status).toBe(401);
      const { cookie } = await signIn();
      const forged = new Request("https://app.test/api/auth/logout", {
        method: "POST",
        headers: { host: "app.test", origin: "https://evil.test", "content-type": "application/json", cookie },
        body: "{}",
      });
      expect((await logout(forged)).status).toBe(403);
    });
  });

  describe("password change (EP-06; FR-11, SR-2, V6.2.3, V7.4.3)", () => {
    const change = (cookie: string, body: Record<string, unknown>) => changePassword(post("/api/account/password", body, { cookie }));

    it("needs a session", async () => {
      expect((await changePassword(post("/api/account/password", { currentPassword: PASSWORD, newPassword: NEW_PASSWORD }))).status).toBe(401);
    });

    it("requires the current password", async () => {
      const { cookie } = await signIn();
      const response = await change(cookie, { currentPassword: "wrong-current-password", newPassword: NEW_PASSWORD });
      expect(response.status).toBe(400);
      expect((await response.json()).error.fields).toHaveProperty("currentPassword");
    });

    it("rejects short and common passwords and mass assignment", async () => {
      const { cookie } = await signIn();
      const short = await change(cookie, { currentPassword: PASSWORD, newPassword: "short" });
      expect((await short.json()).error.fields).toHaveProperty("newPassword");
      const common = await change(cookie, { currentPassword: PASSWORD, newPassword: "totally-unrelated-incident-text" });
      expect(common.status).toBe(400);
      const sneaky = await change(cookie, { currentPassword: PASSWORD, newPassword: NEW_PASSWORD, role: "admin" });
      expect(sneaky.status).toBe(400);
    });

    it("changes the password, clears the temporary-password gate, ends other sessions, and audits it", async () => {
      const user = await makeUser({ mustChangePassword: true });
      const first = cookieOf(await doLogin(user.username));
      const other = cookieOf(await doLogin(user.username));
      const response = await change(first, { currentPassword: PASSWORD, newPassword: NEW_PASSWORD });
      expect(response.status).toBe(200);

      const row = await owner.query("SELECT password_hash, must_change_password FROM users WHERE id = $1", [user.id]);
      expect(row.rows[0].must_change_password).toBe(false);
      expect(await verifyPassword(row.rows[0].password_hash, NEW_PASSWORD)).toBe(true);
      expect((await authenticate(withCookie(first))).user.mustChangePassword).toBe(false);
      expect(await codeOf(authenticate(withCookie(other)))).toBe("unauthenticated");

      const audit = await owner.query("SELECT actor_type, target_id FROM audit_log WHERE action = 'user.password.change' AND user_id = $1", [user.id]);
      expect(audit.rows).toEqual([{ actor_type: "user", target_id: user.id }]);
      expect((await doLogin(user.username, PASSWORD)).status).toBe(401);
      expect((await doLogin(user.username, NEW_PASSWORD)).status).toBe(200);
    });

    it("keeps other sessions when asked to (V7.4.3 is optional)", async () => {
      const user = await makeUser();
      const first = cookieOf(await doLogin(user.username));
      const other = cookieOf(await doLogin(user.username));
      expect((await change(first, { currentPassword: PASSWORD, newPassword: NEW_PASSWORD, endOtherSessions: false })).status).toBe(200);
      await authenticate(withCookie(other));
    });

    it("limits attempts to five per window", async () => {
      const { cookie } = await signIn();
      const statuses: number[] = [];
      for (let i = 0; i < 6; i++) statuses.push((await change(cookie, { currentPassword: "wrong-current-password", newPassword: NEW_PASSWORD })).status);
      expect(statuses.slice(0, 5).every((s) => s === 400)).toBe(true);
      expect(statuses[5]).toBe(429);
    });
  });

  describe("first administrator (NH-4, T-62; scripts/create-admin.ts)", () => {
    it("creates an admin with a hash and a system-actor audit record, and refuses bad input", async () => {
      const username = nextName();
      await expect(createFirstAdmin(db, { username: "Bad Name!", password: PASSWORD })).rejects.toThrow(/Username must be/);
      await expect(createFirstAdmin(db, { username, password: "short" })).rejects.toThrow(/Must be 15 to 128/);
      const admin = await createFirstAdmin(db, { username, password: PASSWORD });
      await expect(createFirstAdmin(db, { username, password: PASSWORD })).rejects.toThrow(/already exists/);

      const found = await owner.query(
        "SELECT u.role, u.password_hash, u.must_change_password, a.actor_type, a.user_id FROM users u JOIN audit_log a ON a.target_id = u.id::text WHERE u.id = $1 AND a.action = 'user.create'",
        [admin.id],
      );
      expect(found.rows).toHaveLength(1);
      expect(found.rows[0]).toMatchObject({ role: "admin", must_change_password: false, actor_type: "system", user_id: null });
      expect(await verifyPassword(found.rows[0].password_hash, PASSWORD)).toBe(true);
      expect((await doLogin(username)).status).toBe(200); // can sign in straight away
    });
  });
});
