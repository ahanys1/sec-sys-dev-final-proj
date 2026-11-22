import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import pg from "pg";
import type { PrismaClient } from "@/src/generated/prisma/client";
import { hashPassword } from "@/src/lib/auth/password";

const ownerUrl = process.env.TEST_DATABASE_OWNER_URL;
const appUrl = process.env.TEST_DATABASE_APP_URL;

const PASSWORD = `pw-${randomUUID()}-fixture`;

describe.skipIf(!ownerUrl || !appUrl)("incident creation", () => {
  const owner = new pg.Pool({ connectionString: ownerUrl, max: 1 });
  const tag = randomUUID().slice(0, 6);

  let db: PrismaClient;
  let create: (request: Request) => Promise<Response>;
  let login: (request: Request) => Promise<Response>;

  let reporterId: string;
  let reporterUsername: string;
  let categoryId: string;
  let cookie: string;

  beforeAll(async () => {
    process.env.DATABASE_URL = appUrl;
    process.env.TRUSTED_PROXY_HOPS = "1";

    db = (await import("@/src/lib/db")).getDb();
    create = (await import("@/app/api/incidents/route")).POST;
    login = (await import("@/app/api/auth/login/route")).POST;

    reporterUsername = `incident-${tag}`;

    const reporter = await db.user.create({
      data: {
        username: reporterUsername,
        role: "user",
        active: true,
        mustChangePassword: false,
        passwordHash: await hashPassword(PASSWORD),
      },
    });

    reporterId = reporter.id;

    const category = await db.category.create({
      data: {
        name: `incident-category-${tag}`,
        active: true,
      },
    });
    categoryId = category.id;

    const response = await login(
      new Request("https://app.test/api/auth/login", {
        method: "POST",
        headers: {
          origin: "https://app.test",
          host: "app.test",
          "content-type": "application/json",
          "x-forwarded-for": "203.0.113.20",
        },
        body: JSON.stringify({
          username: reporterUsername,
          password: PASSWORD,
        }),
      }),
    );

    expect(response.status).toBe(200);
    cookie = response.headers.get("set-cookie")?.split(";")[0] ?? "";
    expect(cookie).not.toBe("");
  });

    afterAll(async () => {
    if (!db) {
        await owner.end();
        return;
    }

    // Remove temporary sessions. Preserve the incident and
    // append-only audit record created by the test.
    if (reporterId) {
        await db.session.deleteMany({
        where: { userId: reporterId },
        });
    }

    await owner.end();
    await db.$disconnect();
    });

  const postIncident = (body: unknown, sessionCookie = cookie) =>
    create(
        new Request("https://app.test/api/incidents", {
        method: "POST",
        headers: {
            origin: "https://app.test",
            host: "app.test",
            "content-type": "application/json",
            cookie: sessionCookie,
        },
        body: JSON.stringify(body),
        }),
    );

async function signInAs(role: "reviewer" | "admin") {
  const username = `incident-${role}-${randomUUID().slice(0, 8)}`;


  const user = await db.user.create({
    data: {
      username,
      role,
      active: true,
      mustChangePassword: false,
      passwordHash: await hashPassword(PASSWORD),
    },
  });

  const response = await login(
    new Request("https://app.test/api/auth/login", {
      method: "POST",
      headers: {
        origin: "https://app.test",
        host: "app.test",
        "content-type": "application/json",
        "x-forwarded-for": "203.0.113.21",
      },
      body: JSON.stringify({
        username,
        password: PASSWORD,
      }),
    }),
  );

  expect(response.status).toBe(200);

  const sessionCookie =
    response.headers.get("set-cookie")?.split(";")[0] ?? "";

  expect(sessionCookie).not.toBe("");

  return { user, sessionCookie };
}

  it("creates an incident and its audit record", async () => {
  const response = await postIncident({
    title: "Suspicious login activity",
    description: "Repeated failed login attempts observed.",
    categoryId,
  });

  expect(response.status).toBe(201);

  const body = await response.json();
  const incidentId = body.incident.id as string;

  expect(body.incident).toMatchObject({
    title: "Suspicious login activity",
    status: "open",
    categoryId,
  });

  expect(body.incident).not.toHaveProperty("description");

  const stored = await db.incident.findUniqueOrThrow({
    where: { id: incidentId },
  });

  expect(stored.reporterId).toBe(reporterId);
  expect(stored.description).toBe(
    "Repeated failed login attempts observed.",
  );

  const audit = await db.auditLog.findFirst({
    where: {
      action: "incident.create",
      targetId: incidentId,
    },
  });

  expect(audit).not.toBeNull();
  expect(audit?.userId).toBe(reporterId);
  expect(audit?.details).toBeNull();
});

it("rejects nonexistent and inactive categories without creating incidents or audit records", async () => {
  const inactiveCategory = await db.category.create({
    data: {
      name: `inactive-category-${randomUUID()}`,
      active: false,
    },
  });

  const cases = [
    { categoryId: randomUUID(), title: "Missing category test" },
    { categoryId: inactiveCategory.id, title: "Inactive category test" },
  ];

  for (const testCase of cases) {
    const incidentsBefore = await db.incident.count({
      where: { reporterId },
    });

    const auditsBefore = await db.auditLog.count({
      where: {
        userId: reporterId,
        action: "incident.create",
      },
    });

    const response = await postIncident({
      title: testCase.title,
      description: "This incident should not be created.",
      categoryId: testCase.categoryId,
    });

    expect(response.status).toBe(400);

    expect(
      await db.incident.count({ where: { reporterId } }),
    ).toBe(incidentsBefore);

    expect(
      await db.auditLog.count({
        where: {
          userId: reporterId,
          action: "incident.create",
        },
      }),
    ).toBe(auditsBefore);
  }
});

it("rejects incident creation without authentication", async () => {
  const response = await create(
    new Request("https://app.test/api/incidents", {
      method: "POST",
      headers: {
        origin: "https://app.test",
        host: "app.test",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        title: "Unauthorized incident",
        description: "This must not be stored.",
        categoryId,
      }),
    }),
  );

  expect(response.status).toBe(401);

  const stored = await db.incident.findFirst({
    where: { title: "Unauthorized incident" },
  });

  expect(stored).toBeNull();
});

it("rejects incident creation by reviewers and admins", async () => {
  for (const role of ["reviewer", "admin"] as const) {
    const { user, sessionCookie } = await signInAs(role);

    const incidentsBefore = await db.incident.count({
      where: { reporterId: user.id },
    });

    const auditsBefore = await db.auditLog.count({
      where: {
        userId: user.id,
        action: "incident.create",
      },
    });

    const response = await postIncident(
      {
        title: `Forbidden incident ${role}`,
        description: "This must not be stored.",
        categoryId,
      },
      sessionCookie,
    );

    expect(response.status).toBe(403);

    expect(
      await db.incident.count({
        where: { reporterId: user.id },
      }),
    ).toBe(incidentsBefore);

    expect(
      await db.auditLog.count({
        where: {
          userId: user.id,
          action: "incident.create",
        },
      }),
    ).toBe(auditsBefore);
  }
});

it("rejects incident creation when a password change is required", async () => {
  const incidentsBefore = await db.incident.count({
    where: { reporterId },
  });

  const auditsBefore = await db.auditLog.count({
    where: {
      userId: reporterId,
      action: "incident.create",
    },
  });

  await db.user.update({
    where: { id: reporterId },
    data: { mustChangePassword: true },
  });

  try {
    const response = await postIncident({
      title: "Password change required",
      description: "This incident must not be created.",
      categoryId,
    });

    expect(response.status).toBe(403);

    expect(
      await db.incident.count({
        where: { reporterId },
      }),
    ).toBe(incidentsBefore);

    expect(
      await db.auditLog.count({
        where: {
          userId: reporterId,
          action: "incident.create",
        },
      }),
    ).toBe(auditsBefore);
  } finally {
    await db.user.update({
      where: { id: reporterId },
      data: { mustChangePassword: false },
    });
  }
});

});