
import { randomUUID } from "node:crypto";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import pg from "pg";
import { hashPassword } from "@/src/lib/auth/password";

import type { PrismaClient } from "@/src/generated/prisma/client";

const ownerUrl = process.env.TEST_DATABASE_OWNER_URL;
const appUrl = process.env.TEST_DATABASE_APP_URL;

describe.skipIf(!ownerUrl || !appUrl)("admin settings persistence and audit", () => {
  const owner = new pg.Pool({ connectionString: ownerUrl, max: 1 });

  let db: PrismaClient;
  let adminId: string;

  let updateAdminSettings: typeof import("@/src/lib/admin/settings").updateAdminSettings;

  let settingsGet: typeof import("@/app/api/admin/settings/route").GET;

  let settingsPatch: typeof import("@/app/api/admin/settings/route").PATCH;

  let login: typeof import("@/app/api/auth/login/route").POST;

  const settingsRequest = (
  method: "GET" | "PATCH",
  body?: unknown,
  cookie?: string,
) =>
  new Request("https://app.test/api/admin/settings", {
    method,
    headers: {
      origin: "https://app.test",
      host: "app.test",
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
    },
    ...(method === "PATCH"
      ? { body: JSON.stringify(body) }
      : {}),
  });

  const testPassword = `Test-${randomUUID()}-Password!`;

async function signIn(
  role: "user" | "reviewer" | "admin",
  mustChangePassword = false,
) {
  const username = `settings-${randomUUID().slice(0, 8)}`;

  await db.user.create({
    data: {
      username,
      passwordHash: await hashPassword(testPassword),
      role,
      active: true,
      mustChangePassword,
    },
  });

  const response = await login(
    new Request("https://app.test/api/auth/login", {
      method: "POST",
      headers: {
        origin: "https://app.test",
        host: "app.test",
        "content-type": "application/json",
        "x-forwarded-for": "198.51.100.42",
      },
      body: JSON.stringify({
        username,
        password: testPassword,
      }),
    }),
  );

  expect(response.status).toBe(200);

  const cookie = response.headers.get("set-cookie")?.split(";")[0];

  expect(cookie).toBeTruthy();

  return cookie!;
}

  beforeAll(async () => {
    process.env.DATABASE_URL = appUrl;

    db = (await import("@/src/lib/db")).getDb();
    updateAdminSettings = (
      await import("@/src/lib/admin/settings")
    ).updateAdminSettings;

    login = (await import("@/app/api/auth/login/route")).POST;

    // A real user is required by the settings and audit foreign keys.
    const admin = await db.user.create({
      data: {
        username: `settings-test-${randomUUID().slice(0, 8)}`,
        passwordHash: "integration-test-only",
        role: "admin",
        active: true,
        mustChangePassword: false,
      },
    });

    adminId = admin.id;

    const settingsRoute = await import("@/app/api/admin/settings/route");
    settingsGet = settingsRoute.GET;
    settingsPatch = settingsRoute.PATCH;

  });

beforeEach(async () => {
  await db.settings.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      updatedById: adminId,
      lockoutThreshold: 5,
      lockoutMinutes: 15,
      sessionIdleMinutes: 30,
      sessionMaxHours: 8,
      tempPasswordHours: 24,
      statusMessage: "",
    },
    update: {
      lockoutThreshold: 5,
      lockoutMinutes: 15,
      sessionIdleMinutes: 30,
      sessionMaxHours: 8,
      tempPasswordHours: 24,
      statusMessage: "",
    },
  });
});
  afterEach(async () => {
  await db.settings.update({
    where: { id: 1 },
    data: {
      lockoutThreshold: 5,
      lockoutMinutes: 15,
      sessionIdleMinutes: 30,
      sessionMaxHours: 8,
      tempPasswordHours: 24,
      statusMessage: "",
    },
  });
});

  afterAll(async () => {
    // The disposable database is removed by scripts/test-db.sh.
    await owner.end();
    if (db) await db.$disconnect();
  });

  it("persists a settings change and records its audit event", async () => {
    const current = await db.settings.findUnique({
      where: { id: 1 },
    });

    const previousThreshold = current?.lockoutThreshold ?? 5;
    const newThreshold = previousThreshold === 6 ? 7 : 6;

    const updated = await updateAdminSettings(db, adminId, {
      lockoutThreshold: newThreshold,
    });

    expect(updated.lockoutThreshold).toBe(newThreshold);

    const stored = await db.settings.findUnique({
      where: { id: 1 },
    });

    expect(stored?.lockoutThreshold).toBe(newThreshold);
    expect(stored?.updatedById).toBe(adminId);

    const audit = await db.auditLog.findFirst({
      where: {
        action: "settings.update",
        userId: adminId,
        targetId: "1",
      },
      orderBy: { id: "desc" },
    });

    expect(audit).not.toBeNull();
    expect(audit?.details).toEqual({
      lockoutThreshold: {
        old: previousThreshold,
        new: newThreshold,
      },
    });
  });

it("does not write or audit unchanged settings", async () => {
  const before = await db.settings.findUniqueOrThrow({
    where: { id: 1 },
  });

  const auditCountBefore = await db.auditLog.count({
    where: {
      action: "settings.update",
      userId: adminId,
      targetId: "1",
    },
  });

  const result = await updateAdminSettings(db, adminId, {
    lockoutThreshold: before.lockoutThreshold,
  });

  const after = await db.settings.findUniqueOrThrow({
    where: { id: 1 },
  });

  const auditCountAfter = await db.auditLog.count({
    where: {
      action: "settings.update",
      userId: adminId,
      targetId: "1",
    },
  });

  expect(result.lockoutThreshold).toBe(before.lockoutThreshold);
  expect(after.updatedAt).toEqual(before.updatedAt);
  expect(auditCountAfter).toBe(auditCountBefore);
});

it("updates only the requested setting and preserves other values", async () => {
  const before = await db.settings.findUniqueOrThrow({
    where: { id: 1 },
  });

  const newMinutes = before.sessionIdleMinutes === 20 ? 25 : 20;

  const result = await updateAdminSettings(db, adminId, {
    sessionIdleMinutes: newMinutes,
  });

  const after = await db.settings.findUniqueOrThrow({
    where: { id: 1 },
  });

  expect(result.sessionIdleMinutes).toBe(newMinutes);
  expect(after.sessionIdleMinutes).toBe(newMinutes);

  // An unrelated setting must remain unchanged.
  expect(after.lockoutThreshold).toBe(before.lockoutThreshold);
  expect(after.sessionMaxHours).toBe(before.sessionMaxHours);
  expect(after.lockoutMinutes).toBe(before.lockoutMinutes);
  expect(after.tempPasswordHours).toBe(before.tempPasswordHours);
  expect(after.statusMessage).toBe(before.statusMessage);

  const audit = await db.auditLog.findFirst({
    where: {
      action: "settings.update",
      userId: adminId,
      targetId: "1",
    },
    orderBy: { id: "desc" },
  });

  expect(audit?.details).toEqual({
    sessionIdleMinutes: {
      old: before.sessionIdleMinutes,
      new: newMinutes,
    },
  });
});

it("rolls back a settings change when the transaction fails", async () => {
  const original = await db.settings.findUniqueOrThrow({
    where: { id: 1 },
  });

  const newThreshold =
    original.lockoutThreshold === 5 ? 6 : 5;

  await expect(
    db.$transaction(async (tx) => {
      await tx.settings.update({
        where: { id: 1 },
        data: { lockoutThreshold: newThreshold },
      });

      // Simulate a failure after the settings update.
      throw new Error("Simulated audit failure");
    }),
  ).rejects.toThrow("Simulated audit failure");

  const persisted = await db.settings.findUniqueOrThrow({
    where: { id: 1 },
  });

  expect(persisted.lockoutThreshold).toBe(
    original.lockoutThreshold,
  );
});
describe("settings endpoint authorization", () => {
  it("returns 401 for unauthenticated GET and PATCH", async () => {
    const before = await db.settings.findUniqueOrThrow({
    where: { id: 1 },
    });

    const getResponse = await settingsGet(
      settingsRequest("GET"),
    );

    const patchResponse = await settingsPatch(
      settingsRequest("PATCH", {
        lockoutThreshold: 6,
      }),
    );

    expect(getResponse.status).toBe(401);
    expect(patchResponse.status).toBe(401);

    const after = await db.settings.findUniqueOrThrow({
        where: { id: 1 },
    });

        expect(after.lockoutThreshold).toBe(before.lockoutThreshold);
        expect(after.updatedAt).toEqual(before.updatedAt);
  });
});
it("returns 403 for users, reviewers, and password-change-required admins", async () => {
  const before = await db.settings.findUniqueOrThrow({
    where: { id: 1 },
  });

  const cookies = [
  await signIn("user"),
  await signIn("reviewer"),
  await signIn("admin", true),
];

  for (const cookie of cookies) {
    const getResponse = await settingsGet(
      settingsRequest("GET", undefined, cookie),
    );

    const patchResponse = await settingsPatch(
      settingsRequest("PATCH", {
        lockoutThreshold: 6,
      }, cookie),
    );

    expect(getResponse.status).toBe(403);
    expect(patchResponse.status).toBe(403);
  }

  const after = await db.settings.findUniqueOrThrow({
    where: { id: 1 },
  });

  expect(after.lockoutThreshold).toBe(before.lockoutThreshold);
  expect(after.updatedAt).toEqual(before.updatedAt);
});

});
