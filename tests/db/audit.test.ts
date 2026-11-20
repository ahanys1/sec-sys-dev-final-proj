import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import pg from "pg";
import { runAudited } from "@/src/lib/audit";

// Needs a migrated database (see tests/db/schema.test.ts). Skipped when unset.
const ownerUrl = process.env.TEST_DATABASE_OWNER_URL;
const appUrl = process.env.TEST_DATABASE_APP_URL;

describe.skipIf(!ownerUrl || !appUrl)("transactional audit (FR-11, V2.3.3)", () => {
  const owner = new pg.Pool({ connectionString: ownerUrl, max: 1 });
  const prefix = `audit-test-${randomUUID().slice(0, 8)}`;

  async function db() {
    process.env.DATABASE_URL = appUrl; // the app role, as in production
    return (await import("@/src/lib/db")).getDb();
  }

  afterAll(async () => {
    await owner.query("DELETE FROM categories WHERE name LIKE $1", [`${prefix}%`]);
    await owner.end();
    await (await db()).$disconnect();
  });

  it("commits the change and its audit record together", async () => {
    const name = `${prefix}-ok`;
    const category = await runAudited(
      await db(),
      (tx) => tx.category.create({ data: { name } }),
      (c) => ({ actor: { type: "system" }, action: "category.create", targetId: c.id }),
    );
    const audit = await owner.query("SELECT 1 FROM audit_log WHERE action = 'category.create' AND target_id = $1", [category.id]);
    expect(audit.rowCount).toBe(1);
  });

  it("rolls the change back when the audit insert fails", async () => {
    const name = `${prefix}-rollback`;
    await expect(
      runAudited(
        await db(),
        (tx) => tx.category.create({ data: { name } }),
        () => ({ actor: { type: "user", userId: randomUUID() }, action: "category.create" }), // no such user
      ),
    ).rejects.toThrow();
    const found = await owner.query("SELECT 1 FROM categories WHERE name = $1", [name]);
    expect(found.rowCount).toBe(0);
  });
});
