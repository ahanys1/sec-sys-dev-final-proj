import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import pg from "pg";
import type { PrismaClient, Role } from "@/src/generated/prisma/client";
import { ApiError } from "@/src/lib/http";
import { hashPassword, verifyPassword } from "@/src/lib/auth/password";

// Needs a migrated database (see tests/db/schema.test.ts). Skipped when unset. Run files one at a time:
// the last-admin test parks other admins for a moment.
const ownerUrl = process.env.TEST_DATABASE_OWNER_URL;
const appUrl = process.env.TEST_DATABASE_APP_URL;

const PASSWORD = `pw-${randomUUID()}-fixture`; // generated per run (ASSUMP-2, SR-14)

type Plain = (request: Request) => Promise<Response>;
type Targeted = (request: Request, context: { params: Promise<{ id: string }> }) => Promise<Response>;

describe.skipIf(!ownerUrl || !appUrl)("admin account management (EP-12 to EP-17; FR-1 to FR-3, FR-11, SR-6)", () => {
  const owner = new pg.Pool({ connectionString: ownerUrl, max: 1 });
  const tag = randomUUID().slice(0, 6);
  let db: PrismaClient;
  let lib: typeof import("@/src/lib/admin/users");
  let login: Plain, list: Plain, create: Plain;
  let rename: Targeted, role: Targeted, status: Targeted, reset: Targeted;
  let seq = 0;

  beforeAll(async () => {
    process.env.DATABASE_URL = appUrl;
    process.env.TRUSTED_PROXY_HOPS = "1";
    db = (await import("@/src/lib/db")).getDb();
    lib = await import("@/src/lib/admin/users");
    login = (await import("@/app/api/auth/login/route")).POST;
    ({ GET: list, POST: create } = await import("@/app/api/admin/users/route"));
    rename = (await import("@/app/api/admin/users/[id]/route")).PATCH;
    role = (await import("@/app/api/admin/users/[id]/role/route")).PATCH;
    status = (await import("@/app/api/admin/users/[id]/status/route")).PATCH;
    reset = (await import("@/app/api/admin/users/[id]/password-reset/route")).POST;
  });

  afterAll(async () => {
    // Accounts that acted keep audit rows and can't be deleted: just make sure they can't sign in.
    await owner.query("UPDATE users SET active = false WHERE username LIKE $1", [`admtest-${tag}-%`]);
    await owner.query(
      "DELETE FROM users WHERE username LIKE $1 AND id NOT IN (SELECT user_id FROM audit_log WHERE user_id IS NOT NULL)",
      [`admtest-${tag}-%`],
    );
    await owner.end();
    await db.$disconnect();
  });

  const nextName = () => `admtest-${tag}-${++seq}`;
  const nextIp = () => `198.51.100.${++seq % 250}-${tag}${seq}`.slice(0, 45);

  async function makeUser(options: { role?: Role; active?: boolean; mustChangePassword?: boolean } = {}) {
    const username = nextName();
    const user = await db.user.create({
      data: {
        username,
        role: options.role ?? "user",
        active: options.active ?? true,
        mustChangePassword: options.mustChangePassword ?? false,
        passwordHash: await hashPassword(PASSWORD),
      },
    });
    return { id: user.id, username };
  }

  const req = (method: string, path: string, body: unknown, cookie?: string) =>
    new Request(`https://app.test${path}`, {
      method,
      headers: {
        origin: "https://app.test",
        host: "app.test",
        "content-type": "application/json",
        "x-forwarded-for": nextIp(),
        ...(cookie ? { cookie } : {}),
      },
      ...(method === "GET" ? {} : { body: JSON.stringify(body) }),
    });
  const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

  async function signIn(options?: Parameters<typeof makeUser>[0]) {
    const user = await makeUser(options);
    const response = await login(req("POST", "/api/auth/login", { username: user.username, password: PASSWORD }));
    expect(response.status).toBe(200);
    return { ...user, cookie: response.headers.get("set-cookie")!.split(";")[0] };
  }
  const admin = () => signIn({ role: "admin" });

  const audit = async (targetId: string) =>
    (await owner.query("SELECT action, user_id, details FROM audit_log WHERE target_id = $1 ORDER BY id", [targetId])).rows;
  const sessionCount = async (userId: string) =>
    Number((await owner.query("SELECT count(*) FROM sessions WHERE user_id = $1", [userId])).rows[0].count);

  describe("access control on every admin route (SR-4, SR-5, T-20)", () => {
    it("returns 401 without a session, and 403 for user, reviewer, and an admin who must still change their password", async () => {
      const target = await makeUser();
      const calls = (cookie?: string) => [
        list(req("GET", "/api/admin/users", undefined, cookie)),
        create(req("POST", "/api/admin/users", { username: nextName(), role: "user" }, cookie)),
        rename(req("PATCH", "/x", { username: nextName() }, cookie), ctx(target.id)),
        role(req("PATCH", "/x", { role: "admin" }, cookie), ctx(target.id)),
        status(req("PATCH", "/x", { active: false }, cookie), ctx(target.id)),
        reset(req("POST", "/x", {}, cookie), ctx(target.id)),
      ];
      for (const response of await Promise.all(calls())) expect(response.status).toBe(401);
      for (const who of [await signIn({ role: "user" }), await signIn({ role: "reviewer" }), await signIn({ role: "admin", mustChangePassword: true })]) {
        // A temporary-password admin can sign in but is gated (C-11).
        for (const response of await Promise.all(calls(who.cookie))) expect(response.status).toBe(403);
      }
      const after = await db.user.findUnique({ where: { id: target.id } });
      expect(after).toMatchObject({ role: "user", active: true });
      expect(await audit(target.id)).toEqual([]);
    });

    it("rejects a cross-origin write before it does anything (C-4)", async () => {
      const a = await admin();
      const request = req("POST", "/api/admin/users", { username: nextName(), role: "user" }, a.cookie);
      request.headers.set("origin", "https://evil.test");
      expect((await create(request)).status).toBe(403);
    });

    it("answers 404 for a malformed or unknown target ID", async () => {
      const a = await admin();
      expect((await role(req("PATCH", "/x", { role: "user" }, a.cookie), ctx("not-a-uuid"))).status).toBe(404);
      expect((await role(req("PATCH", "/x", { role: "user" }, a.cookie), ctx(randomUUID()))).status).toBe(404);
      expect((await reset(req("POST", "/x", {}, a.cookie), ctx(randomUUID()))).status).toBe(404);
    });
  });

  describe("list (EP-12; T-28, V15.3.1)", () => {
    it("returns an explicit field allowlist and never a hash", async () => {
      const a = await admin();
      const response = await list(req("GET", "/api/admin/users", undefined, a.cookie));
      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("no-store");
      const { users } = await response.json();
      expect(users.length).toBeGreaterThan(0);
      for (const user of users) {
        expect(Object.keys(user).sort()).toEqual(["active", "createdAt", "id", "mustChangePassword", "role", "tempPasswordExpiresAt", "username"]);
      }
      expect(JSON.stringify(users)).not.toMatch(/argon2|password_?hash/i);
    });
  });

  describe("create (EP-13; V6.4.1, V11.5.1)", () => {
    it("issues a one-time temporary password that expires, forces a change, and is audited", async () => {
      const a = await admin();
      const username = nextName();
      const response = await create(req("POST", "/api/admin/users", { username, role: "reviewer" }, a.cookie));
      expect(response.status).toBe(201);
      expect(response.headers.get("cache-control")).toBe("no-store");
      const { user, temporaryPassword } = await response.json();
      expect(temporaryPassword).toHaveLength(24);
      expect(user).toMatchObject({ username, role: "reviewer", active: true, mustChangePassword: true });

      const row = await db.user.findUniqueOrThrow({ where: { id: user.id } });
      expect(row.passwordHash).not.toContain(temporaryPassword);
      expect(await verifyPassword(row.passwordHash, temporaryPassword)).toBe(true);
      const hours = (row.tempPasswordExpiresAt!.getTime() - Date.now()) / 3_600_000;
      expect(hours).toBeGreaterThan(23);
      expect(hours).toBeLessThanOrEqual(24.01);

      // Never returned again, and not stored in the audit record.
      const again = JSON.stringify(await (await list(req("GET", "/api/admin/users", undefined, a.cookie))).json());
      expect(again).not.toContain(temporaryPassword);
      const records = await audit(user.id);
      expect(records).toHaveLength(1);
      expect(records[0]).toMatchObject({ action: "user.create", user_id: a.id, details: null });

      // The new user signs in with it but is restricted to the password flow until it is changed (C-11).
      const signedIn = await login(req("POST", "/api/auth/login", { username, password: temporaryPassword }));
      expect(signedIn.status).toBe(200);
      const cookie = signedIn.headers.get("set-cookie")!.split(";")[0];
      expect((await list(req("GET", "/api/admin/users", undefined, cookie))).status).toBe(403);
    });

    it("refuses duplicates, bad usernames, and mass-assigned fields without creating anything", async () => {
      const a = await admin();
      const existing = await makeUser();
      const duplicate = await create(req("POST", "/api/admin/users", { username: existing.username.toUpperCase(), role: "user" }, a.cookie));
      expect(duplicate.status).toBe(409);
      for (const body of [
        { username: "no", role: "user" },
        { username: nextName(), role: "root" },
        { username: nextName(), role: "user", active: false },
        { username: nextName(), role: "user", mustChangePassword: false },
        { username: nextName(), role: "user", passwordHash: "x" },
      ]) {
        expect((await create(req("POST", "/api/admin/users", body, a.cookie))).status).toBe(400);
      }
      const bad = await db.user.count({ where: { username: { startsWith: `admtest-${tag}-` }, passwordHash: "x" } });
      expect(bad).toBe(0);
    });
  });

  describe("role change (EP-14; SR-6, T-27)", () => {
    it("changes a role, audits it, and refuses to change your own (SR-6)", async () => {
      const a = await admin();
      const target = await makeUser();
      const response = await role(req("PATCH", "/x", { role: "reviewer" }, a.cookie), ctx(target.id));
      expect(response.status).toBe(200);
      expect((await response.json()).user.role).toBe("reviewer");
      expect((await audit(target.id)).map((r) => r.action)).toEqual(["user.role"]);

      const self = await role(req("PATCH", "/x", { role: "user" }, a.cookie), ctx(a.id));
      expect(self.status).toBe(403);
      expect((await db.user.findUniqueOrThrow({ where: { id: a.id } })).role).toBe("admin");
      expect(await audit(a.id)).toEqual([]);
    });

    it("does not audit a request that changes nothing", async () => {
      const a = await admin();
      const target = await makeUser({ role: "reviewer" });
      expect((await role(req("PATCH", "/x", { role: "reviewer" }, a.cookie), ctx(target.id))).status).toBe(200);
      expect(await audit(target.id)).toEqual([]);
    });
  });

  describe("status (EP-15; V7.4.2, V7.4.5, T-27)", () => {
    it("deactivation ends all of the target's sessions and blocks sign-in; reactivation restores it", async () => {
      const a = await admin();
      const target = await signIn();
      expect(await sessionCount(target.id)).toBe(1);
      const response = await status(req("PATCH", "/x", { active: false }, a.cookie), ctx(target.id));
      expect(response.status).toBe(200);
      expect(await sessionCount(target.id)).toBe(0);
      const blocked = await login(req("POST", "/api/auth/login", { username: target.username, password: PASSWORD }));
      expect(blocked.status).toBe(401);

      expect((await status(req("PATCH", "/x", { active: true }, a.cookie), ctx(target.id))).status).toBe(200);
      expect((await audit(target.id)).map((r) => r.action)).toEqual(["user.deactivate", "user.update"]);
      expect((await login(req("POST", "/api/auth/login", { username: target.username, password: PASSWORD }))).status).toBe(200);
    });

    it("refuses to deactivate yourself", async () => {
      const a = await admin();
      expect((await status(req("PATCH", "/x", { active: false }, a.cookie), ctx(a.id))).status).toBe(403);
      expect((await db.user.findUniqueOrThrow({ where: { id: a.id } })).active).toBe(true);
    });
  });

  describe("last active admin (T-27, NFR-5)", () => {
    it("is protected for demotion and deactivation, and two admins cannot remove each other at once", async () => {
      const a = await admin();
      const b = await admin();
      // Park every other active admin so a and b are the only two (needs sequential DB test files).
      const parked = (
        await owner.query("UPDATE users SET active = false WHERE role = 'admin' AND active AND id NOT IN ($1, $2) RETURNING id", [a.id, b.id])
      ).rows.map((r) => r.id as string);
      try {
        const outcomes = await Promise.allSettled([lib.setActive(db, a.id, b.id, false), lib.setActive(db, b.id, a.id, false)]);
        expect(outcomes.filter((o) => o.status === "fulfilled")).toHaveLength(1);
        const failed = outcomes.find((o) => o.status === "rejected") as PromiseRejectedResult;
        expect(failed.reason).toBeInstanceOf(ApiError);
        expect((failed.reason as ApiError).code).toBe("conflict");
        const remaining = await owner.query("SELECT count(*) FROM users WHERE role = 'admin' AND active AND id IN ($1, $2)", [a.id, b.id]);
        expect(Number(remaining.rows[0].count)).toBe(1);

        // Now exactly one of them is the last active admin: demoting or deactivating them (by the inactive one) is refused.
        const last = Number((await owner.query("SELECT count(*) FROM users WHERE id = $1 AND active", [a.id])).rows[0].count) === 1 ? a : b;
        const other = last === a ? b : a;
        await expect(lib.changeRole(db, other.id, last.id, "user")).rejects.toMatchObject({ code: "conflict" });
        await expect(lib.setActive(db, other.id, last.id, false)).rejects.toMatchObject({ code: "conflict" });
        expect((await db.user.findUniqueOrThrow({ where: { id: last.id } })).role).toBe("admin");
      } finally {
        if (parked.length > 0) await owner.query("UPDATE users SET active = true WHERE id = ANY($1::uuid[])", [parked]);
      }
    });

    it("allows demoting an admin when another active admin remains", async () => {
      const a = await admin();
      const b = await makeUser({ role: "admin" });
      const response = await role(req("PATCH", "/x", { role: "user" }, a.cookie), ctx(b.id));
      expect(response.status).toBe(200);
    });
  });

  describe("username (EP-16; V15.3.3, V8.2.3)", () => {
    it("changes only the username, rejects role, active, and password fields, and refuses duplicates", async () => {
      const a = await admin();
      const target = await makeUser();
      const other = await makeUser();
      for (const extra of [{ role: "admin" }, { active: false }, { password: "x" }]) {
        const response = await rename(req("PATCH", "/x", { username: nextName(), ...extra }, a.cookie), ctx(target.id));
        expect(response.status).toBe(400);
      }
      expect((await rename(req("PATCH", "/x", { username: other.username }, a.cookie), ctx(target.id))).status).toBe(409);

      const fresh = nextName();
      const response = await rename(req("PATCH", "/x", { username: fresh }, a.cookie), ctx(target.id));
      expect(response.status).toBe(200);
      expect(await db.user.findUniqueOrThrow({ where: { id: target.id } })).toMatchObject({ username: fresh, role: "user", active: true });
      expect((await audit(target.id)).map((r) => r.action)).toEqual(["user.update"]);
    });
  });

  describe("password reset (EP-17; V6.4.1, V7.4.2)", () => {
    it("sets a new temporary password, forces a change, ends the target's sessions, and audits it", async () => {
      const a = await admin();
      const target = await signIn();
      const response = await reset(req("POST", "/x", {}, a.cookie), ctx(target.id));
      expect(response.status).toBe(200);
      expect(response.headers.get("cache-control")).toBe("no-store");
      const { temporaryPassword } = await response.json();
      expect(temporaryPassword).toHaveLength(24);

      expect(await sessionCount(target.id)).toBe(0);
      const row = await db.user.findUniqueOrThrow({ where: { id: target.id } });
      expect(row.mustChangePassword).toBe(true);
      expect(row.tempPasswordExpiresAt!.getTime()).toBeGreaterThan(Date.now());
      expect(await verifyPassword(row.passwordHash, PASSWORD)).toBe(false);
      expect(await verifyPassword(row.passwordHash, temporaryPassword)).toBe(true);
      const records = await audit(target.id);
      expect(records.map((r) => r.action)).toEqual(["user.password.reset"]);
      expect(JSON.stringify(records)).not.toContain(temporaryPassword);
    });

    it("refuses to reset your own password here and rejects a body", async () => {
      const a = await admin();
      expect((await reset(req("POST", "/x", {}, a.cookie), ctx(a.id))).status).toBe(403);
      const target = await makeUser();
      expect((await reset(req("POST", "/x", { password: "chosen" }, a.cookie), ctx(target.id))).status).toBe(400);
    });
  });
});
