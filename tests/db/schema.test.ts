import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import pg from "pg";

// Needs a migrated database with both roles (see .github/workflows/ci.yml). Skipped when unset.
const ownerUrl = process.env.TEST_DATABASE_OWNER_URL;
const appUrl = process.env.TEST_DATABASE_APP_URL;

describe.skipIf(!ownerUrl || !appUrl)("database schema and grants (T-33, T-42; FR-12, SR-11)", () => {
  const owner = new pg.Pool({ connectionString: ownerUrl, max: 1 });
  const app = new pg.Pool({ connectionString: appUrl, max: 1 });
  afterAll(async () => {
    await owner.query("DELETE FROM users WHERE username LIKE 'test-%'");
    await Promise.all([owner.end(), app.end()]);
  });

  const addUser = (username: string) =>
    app.query(
      "INSERT INTO users (username, role, password_hash, updated_at) VALUES ($1, 'user', 'x', now())",
      [username],
    );

  it("lets the app role append to the audit log", async () => {
    await app.query("INSERT INTO audit_log (actor_type, action) VALUES ('system', 'user.create')");
  });

  it("denies the app role UPDATE and DELETE on the audit log", async () => {
    await expect(app.query("UPDATE audit_log SET action = 'x'")).rejects.toThrow(/permission denied/);
    await expect(app.query("DELETE FROM audit_log")).rejects.toThrow(/permission denied/);
  });

  it("rejects UPDATE, DELETE, and TRUNCATE even for the owner (trigger)", async () => {
    for (const sql of ["UPDATE audit_log SET action = 'x'", "DELETE FROM audit_log", "TRUNCATE audit_log"]) {
      await expect(owner.query(sql)).rejects.toThrow(/append-only/);
    }
  });

  it("requires a user ID for user actors and none for system actors (DC-3)", async () => {
    await expect(app.query("INSERT INTO audit_log (actor_type, action) VALUES ('user', 'x')")).rejects.toThrow(
      /audit_log_actor_check/,
    );
  });

  it("gives the app role no DDL and no DELETE on business tables (V13.2.2)", async () => {
    await expect(app.query("CREATE TABLE evil (x int)")).rejects.toThrow(/permission denied/);
    await expect(app.query("DROP TABLE users")).rejects.toThrow(/must be owner/);
    await expect(app.query("DELETE FROM users")).rejects.toThrow(/permission denied/);
    await expect(app.query("DELETE FROM incidents")).rejects.toThrow(/permission denied/);
  });

  it("allows DELETE only on sessions and login_attempts", async () => {
    await app.query("DELETE FROM sessions WHERE false");
    await app.query("DELETE FROM login_attempts WHERE false");
  });

  it("enforces the username format, category uniqueness, and the settings singleton", async () => {
    await expect(addUser("Bad Name")).rejects.toThrow(/users_username_format/);
    await addUser(`test-${randomUUID().slice(0, 8)}`);
    const name = `Cat-${randomUUID().slice(0, 8)}`;
    await expect(
      app.query("INSERT INTO categories (name) VALUES ($1), ($2)", [name, name.toLowerCase()]),
    ).rejects.toThrow(/categories_name_lower_key/);
    await expect(app.query("INSERT INTO settings (id, updated_at) VALUES (2, now())")).rejects.toThrow(
      /settings_singleton/,
    );
  });
});
