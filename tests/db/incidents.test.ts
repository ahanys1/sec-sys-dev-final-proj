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
  let list: (request: Request) => Promise<Response>;
  let detail: (request: Request, context: { params: Promise<{ id: string }> },) => Promise<Response>;

  let reporterId: string;
  let reporterUsername: string;
  let categoryId: string;
  let cookie: string;

  beforeAll(async () => {
    process.env.DATABASE_URL = appUrl;
    process.env.TRUSTED_PROXY_HOPS = "1";

    db = (await import("@/src/lib/db")).getDb();
    create = (await import("@/app/api/incidents/route")).POST;
    list = (await import("@/app/api/incidents/route")).GET;
    login = (await import("@/app/api/auth/login/route")).POST;
    detail = (await import("@/app/api/incidents/[id]/route")).GET;

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
  const getIncidents = (sessionCookie = cookie) =>
    list(
      new Request("https://app.test/api/incidents", {
        method: "GET",
        headers: {
          host: "app.test",
          cookie: sessionCookie,
        },
      }),
    );
  const getIncident = (id: string, sessionCookie = cookie) =>
    detail(
      new Request(`https://app.test/api/incidents/${id}`, {
        method: "GET",
        headers: {
          host: "app.test",
          cookie: sessionCookie,
        },
      }),
      { params: Promise.resolve({ id }) },
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
it("lists the reporter's own incidents without exposing descriptions", async () => {
  const title = `incident-list-${randomUUID()}`;
  const description = `private-description-${randomUUID()}`;

  const created = await postIncident({
    title,
    description,
    categoryId,
  });

  expect(created.status).toBe(201);

  const response = await getIncidents();

  expect(response.status).toBe(200);

  const body = await response.json();
  const incident = body.incidents.find(
    (item: { title: string }) => item.title === title,
  );

  expect(incident).toBeDefined();
  expect(incident.status).toBe("open");
  expect(incident.categoryId).toBe(categoryId);

  // Neither the selected incident nor the response may expose descriptions.
  expect(incident).not.toHaveProperty("description");
  expect(JSON.stringify(body)).not.toContain(description);
});
it("does not expose another reporter's incidents", async () => {
  const otherReporter = await db.user.create({
    data: {
      username: `incident-other-${randomUUID().slice(0, 8)}`,
      role: "user",
      active: true,
      mustChangePassword: false,
      passwordHash: await hashPassword(PASSWORD),
    },
  });

  const privateTitle = `other-incident-${randomUUID()}`;

  // Create an incident belonging to another reporter.
  const otherIncident = await db.incident.create({
    data: {
      reporterId: otherReporter.id,
      title: privateTitle,
      description: "Another reporter's private incident description",
      categoryId,
      status: "open",
    },
  });

  // The original reporter requests their own incident list.
  const response = await getIncidents();

  expect(response.status).toBe(200);

  const body = await response.json();

  expect(
    body.incidents.some(
      (incident: { id: string }) => incident.id === otherIncident.id,
    ),
  ).toBe(false);

  expect(JSON.stringify(body)).not.toContain(privateTitle);
  expect(JSON.stringify(body)).not.toContain(otherIncident.description);
});
it("rejects unauthenticated incident listing", async () => {
  const response = await getIncidents("");

  expect(response.status).toBe(401);

  const body = await response.json();
  expect(body.error.code).toBe("unauthenticated");
  expect(body).not.toHaveProperty("incidents");
});
it("rejects reporter listing requests from reviewers and admins", async () => {
  for (const role of ["reviewer", "admin"] as const) {
    const { sessionCookie } = await signInAs(role);

    const response = await getIncidents(sessionCookie);

    expect(response.status).toBe(403);

    const body = await response.json();
    expect(body.error.code).toBe("forbidden");
    expect(body).not.toHaveProperty("incidents");
  }
});
it("allows a reporter to view their own incident details", async () => {
  const description = "Detailed incident information for the reporter.";

  const created = await postIncident({
    title: "Reporter detail access test",
    description,
    categoryId,
  });

  expect(created.status).toBe(201);

  const { incident: createdIncident } = await created.json();

  const response = await getIncident(createdIncident.id);

  expect(response.status).toBe(200);

  const { incident } = await response.json();

  expect(incident.id).toBe(createdIncident.id);
  expect(incident.title).toBe("Reporter detail access test");
  expect(incident.description).toBe(description);
  expect(incident.reporterId).toBe(reporterId);
});
it("returns 404 when a reporter requests another reporter's incident", async () => {
  const otherReporter = await signInAs("reviewer");

  const otherIncident = await db.incident.create({
    data: {
      title: "Private incident",
      description: "Confidential incident details.",
      categoryId,
      reporterId: otherReporter.user.id,
      status: "open",
    },
  });

  const response = await getIncident(otherIncident.id);

  expect(response.status).toBe(404);

  const body = await response.json();
  expect(body.error.code).toBe("not_found");
  expect(JSON.stringify(body)).not.toContain(otherIncident.description);
});
it("allows reviewers and admins to view open incident details", async () => {
  const created = await postIncident({
    title: "Incident for role access",
    description: "Details visible to authorized staff.",
    categoryId,
  });

  expect(created.status).toBe(201);

  const { incident } = await created.json();

  for (const role of ["reviewer", "admin"] as const) {
    const { sessionCookie } = await signInAs(role);

    const response = await getIncident(incident.id, sessionCookie);

    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.incident.id).toBe(incident.id);
    expect(body.incident.description).toBe(
      "Details visible to authorized staff.",
    );
  }
});
it("returns the same 404 for missing and malformed incident IDs", async () => {
  const missing = await getIncident(randomUUID());
  const malformed = await getIncident("not-a-uuid");

  expect(missing.status).toBe(404);
  expect(malformed.status).toBe(404);

  const missingBody = await missing.json();
  const malformedBody = await malformed.json();

  expect(missingBody.error.code).toBe("not_found");
  expect(malformedBody.error.code).toBe("not_found");
  expect(malformedBody.error.message).toBe(missingBody.error.message);
});
it("rejects unauthenticated incident detail requests", async () => {
  const response = await getIncident(randomUUID(), "");

  expect(response.status).toBe(401);

  const body = await response.json();
  expect(body.error.code).toBe("unauthenticated");
  expect(body).not.toHaveProperty("incident");
});
it("restricts closed incident details to the reporter and admin", async () => {
  const created = await postIncident({
    title: "Closed incident access test",
    description: "Confidential closed incident details.",
    categoryId,
  });

  expect(created.status).toBe(201);

  const { incident } = await created.json();

  // Set up a closed incident for testing.
  await db.incident.update({
    where: { id: incident.id },
    data: { status: "closed" },
  });

  const { sessionCookie: reviewerCookie } = await signInAs("reviewer");
  const { sessionCookie: adminCookie } = await signInAs("admin");

  // Reviewers cannot retrieve closed incident details.
  const reviewerResponse = await getIncident(incident.id, reviewerCookie);
  expect(reviewerResponse.status).toBe(404);

  const reviewerBody = await reviewerResponse.json();
  expect(reviewerBody.error.code).toBe("not_found");
  expect(JSON.stringify(reviewerBody)).not.toContain(
    "Confidential closed incident details.",
  );

  // Administrators can view incidents regardless of status (FR-10).
  const adminResponse = await getIncident(incident.id, adminCookie);
  expect(adminResponse.status).toBe(200);

  const adminBody = await adminResponse.json();
  expect(adminBody.incident.status).toBe("closed");
  expect(adminBody.incident.description).toBe(
    "Confidential closed incident details.",
  );

  // Reporters retain access to their own incident history.
  const reporterResponse = await getIncident(incident.id);
  expect(reporterResponse.status).toBe(200);
  expect((await reporterResponse.json()).incident.id).toBe(incident.id);
});
});