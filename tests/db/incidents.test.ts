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
  let reviewerQueue: (request: Request) => Promise<Response>;
  let createComment: (request: Request, context: { params: Promise<{ id: string }> },) => Promise<Response>;
  let updateStatus: (request: Request, context: { params: Promise<{ id: string }> },) => Promise<Response>;
  let patchCategory: (request: Request, context: { params: Promise<{ id: string }> },) => Promise<Response>;
  let getAdminCategories: (request: Request) => Promise<Response>;
  let postAdminCategory: (request: Request) => Promise<Response>;
  let patchAdminCategory: (request: Request, context: { params: Promise<{ id: string }> },) => Promise<Response>;

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
    reviewerQueue = (await import("@/app/api/reviewer/incidents/route")).GET;
    createComment = (await import("@/app/api/incidents/[id]/comments/route")).POST;

    const adminCategoriesRoute = await import("@/app/api/admin/categories/route"
    );
    getAdminCategories = adminCategoriesRoute.GET;
    postAdminCategory = adminCategoriesRoute.POST;

    const adminCategoryRoute = await import("@/app/api/admin/categories/[id]/route"
    );
    patchAdminCategory = adminCategoryRoute.PATCH;

    const statusRoute = await import("@/app/api/incidents/[id]/status/route"
    );
    updateStatus = statusRoute.PATCH;

    const categoryRoute = await import("@/app/api/incidents/[id]/category/route"
    );
    patchCategory = categoryRoute.PATCH;

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

  async function patchStatus(
    incidentId: string,
    body: unknown,
    sessionCookie: string,
  ) {
    return updateStatus(
      new Request(`https://app.test/api/incidents/${incidentId}/status`, {
        method: "PATCH",
        headers: {
          origin: "https://app.test",
          host: "app.test",
          "content-type": "application/json",
          cookie: sessionCookie,
        },
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({ id: incidentId }) },
    );
  }

  const createAdminCategory = (
    body: unknown,
    sessionCookie: string,
  ) =>
    postAdminCategory(
      new Request("https://app.test/api/admin/categories", {
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

  const updateCategory = (
    incidentId: string,
    body: unknown,
    sessionCookie = cookie,
  ) =>
    patchCategory(
      new Request(
        `https://app.test/api/incidents/${incidentId}/category`,
        {
          method: "PATCH",
          headers: {
            origin: "https://app.test",
            host: "app.test",
            "content-type": "application/json",
            cookie: sessionCookie,
          },
          body: JSON.stringify(body),
        },
      ),
      { params: Promise.resolve({ id: incidentId }) },
    );


  const updateAdminCategory = (
    categoryId: string,
    body: unknown,
    sessionCookie: string,
  ) =>
    patchAdminCategory(
      new Request(
        `https://app.test/api/admin/categories/${categoryId}`,
        {
          method: "PATCH",
          headers: {
            origin: "https://app.test",
            host: "app.test",
            "content-type": "application/json",
            cookie: sessionCookie,
          },
          body: JSON.stringify(body),
        },
      ),
      { params: Promise.resolve({ id: categoryId }) },
    );

  const postComment = (incidentId: string, body: unknown, sessionCookie = cookie,) =>
    createComment(
      new Request(
        `https://app.test/api/incidents/${incidentId}/comments`,
        {
          method: "POST",
          headers: {
            origin: "https://app.test",
            host: "app.test",
            "content-type": "application/json",
            cookie: sessionCookie,
          },
          body: JSON.stringify(body),
        },
      ),
      { params: Promise.resolve({ id: incidentId }) },
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
  const getReviewerQueue = (sessionCookie = cookie) =>
    reviewerQueue(
      new Request("https://app.test/api/reviewer/incidents", {
        method: "GET",
        headers: {
          host: "app.test",
          cookie: sessionCookie,
        },
      }),
    );
  const roleSessions: Partial<
    Record<
      "reviewer" | "admin",
      {
        user: Awaited<ReturnType<typeof db.user.create>>;
        sessionCookie: string;
      }
    >
  > = {};
async function signInAs(role: "reviewer" | "admin") {
    const existing = roleSessions[role];

    if (existing) {
      return existing;
  }
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

  const session = { user, sessionCookie };
  roleSessions[role] = session;

  return session;
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
it("rejects unauthenticated reviewer queue requests", async () => {
  const response = await getReviewerQueue("");

  expect(response.status).toBe(401);

  const body = await response.json();
  expect(body.error.code).toBe("unauthenticated");
  expect(body).not.toHaveProperty("incidents");
});
it("lists open and under-review incidents from all reporters without descriptions", async () => {
  const { sessionCookie } = await signInAs("reviewer");

  const otherReporter = await db.user.create({
    data: {
      username: `inc-other-${randomUUID().slice(0, 8)}`,
      role: "user",
      active: true,
      mustChangePassword: false,
      passwordHash: await hashPassword(PASSWORD),
    },
  });

  const openIncident = await db.incident.create({
    data: {
      reporterId,
      categoryId,
      title: "EP10 open incident",
      description: "EP10 private open description",
      status: "open",
    },
  });

  const reviewIncident = await db.incident.create({
    data: {
      reporterId: otherReporter.id,
      categoryId,
      title: "EP10 under-review incident",
      description: "EP10 private review description",
      status: "under_review",
    },
  });

  const closedIncident = await db.incident.create({
    data: {
      reporterId,
      categoryId,
      title: "EP10 closed incident",
      description: "EP10 private closed description",
      status: "closed",
    },
  });

  const response = await getReviewerQueue(sessionCookie);

  expect(response.status).toBe(200);

  const body = await response.json();
  const ids = body.incidents.map((incident: { id: string }) => incident.id);

  expect(ids).toContain(openIncident.id);
  expect(ids).toContain(reviewIncident.id);
  expect(ids).not.toContain(closedIncident.id);

  expect(body.incidents.every(
    (incident: { status: string }) =>
      incident.status === "open" || incident.status === "under_review",
  )).toBe(true);

  expect(JSON.stringify(body)).not.toContain("EP10 private open description");
  expect(JSON.stringify(body)).not.toContain("EP10 private review description");
  expect(JSON.stringify(body)).not.toContain("EP10 private closed description");

  expect(body.incidents.every(
    (incident: Record<string, unknown>) =>
      !Object.hasOwn(incident, "description"),
  )).toBe(true);
});
it("rejects reviewer queue requests from reporters and admins", async () => {
  // An ordinary reporter cannot access the reviewer queue.
  const reporterResponse = await getReviewerQueue(cookie);

  expect(reporterResponse.status).toBe(403);

  const reporterBody = await reporterResponse.json();
  expect(reporterBody.error.code).toBe("forbidden");
  expect(reporterBody).not.toHaveProperty("incidents");

  // Administrators cannot access this reviewer-specific endpoint.
  const { sessionCookie } = await signInAs("admin");

  const adminResponse = await getReviewerQueue(sessionCookie);

  expect(adminResponse.status).toBe(403);

  const adminBody = await adminResponse.json();
  expect(adminBody.error.code).toBe("forbidden");
  expect(adminBody).not.toHaveProperty("incidents");
});
it("allows a reviewer to comment and records an audit event (EP-11)", async () => {
  // Create an open incident using the existing reporter session.
  const created = await postIncident({
    title: "Comment integration test",
    description: "Testing comment creation and audit logging.",
    categoryId,
  });

  expect(created.status).toBe(201);

  const createdBody = await created.json();
  const incidentId = createdBody.incident.id as string;

  // Authenticate as a reviewer.
  const { sessionCookie } = await signInAs("reviewer");

  const response = await postComment(
    incidentId,
    { body: "Reviewed the incident and confirmed the report." },
    sessionCookie,
  );

  expect(response.status).toBe(201);

  const body = await response.json();

  expect(body.comment.incidentId).toBe(incidentId);
  expect(body.comment.body).toBe(
    "Reviewed the incident and confirmed the report.",
  );

  // Confirm the comment was persisted.
  const stored = await db.comment.findUnique({
    where: { id: body.comment.id },
  });

  expect(stored).not.toBeNull();
  expect(stored?.incidentId).toBe(incidentId);
  expect(stored?.body).toBe(body.comment.body);

  // Confirm the corresponding audit record exists.
  const audit = await db.auditLog.findFirst({
    where: {
      action: "comment.create",
      targetId: incidentId,
    },
    orderBy: { id: "desc" },
  });

  expect(audit).not.toBeNull();
});
it("rejects reporter comments without creating records (EP-11)", async () => {
  const created = await postIncident({
    title: "Reporter comment restriction",
    description: "Verify reporters cannot add comments.",
    categoryId,
  });

  expect(created.status).toBe(201);

  const { incident } = await created.json();

  const response = await postComment(
    incident.id,
    { body: "Attempted reporter comment." },
  );

  expect(response.status).toBe(403);

  const storedComments = await db.comment.count({
    where: { incidentId: incident.id },
  });

  const auditEvents = await db.auditLog.count({
    where: {
      action: "comment.create",
      targetId: incident.id,
    },
  });

  expect(storedComments).toBe(0);
  expect(auditEvents).toBe(0);
});
it("rejects unauthenticated comment creation (EP-11)", async () => {
  const created = await postIncident({
    title: "Unauthenticated comment restriction",
    description: "Verify comments require authentication.",
    categoryId,
  });

  expect(created.status).toBe(201);

  const { incident } = await created.json();

  const response = await postComment(
    incident.id,
    { body: "Attempted anonymous comment." },
    "",
  );

  expect(response.status).toBe(401);

  expect(
    await db.comment.count({
      where: { incidentId: incident.id },
    }),
  ).toBe(0);

  expect(
    await db.auditLog.count({
      where: {
        action: "comment.create",
        targetId: incident.id,
      },
    }),
  ).toBe(0);
});
it("hides closed incidents from reviewer comments (EP-11)", async () => {
  const created = await postIncident({
    title: "Closed incident comment restriction",
    description: "Verify reviewers cannot comment on closed incidents.",
    categoryId,
  });

  expect(created.status).toBe(201);

  const { incident } = await created.json();

  // Arrange a closed incident directly in the database.
  await db.incident.update({
    where: { id: incident.id },
    data: { status: "closed" },
  });

  const { sessionCookie } = await signInAs("reviewer");

  const response = await postComment(
    incident.id,
    { body: "Attempted comment on a closed incident." },
    sessionCookie,
  );

  expect(response.status).toBe(404);

  // Rejected requests must not persist comments or comment audit events.
  expect(
    await db.comment.count({
      where: { incidentId: incident.id },
    }),
  ).toBe(0);

  expect(
    await db.auditLog.count({
      where: {
        action: "comment.create",
        targetId: incident.id,
      },
    }),
  ).toBe(0);
});
it("allows admins to comment on closed incidents (EP-11)", async () => {
  const created = await postIncident({
    title: "Admin closed incident comment",
    description: "Verify admins can comment on closed incidents.",
    categoryId,
  });

  expect(created.status).toBe(201);

  const { incident } = await created.json();

  // Arrange a closed incident until EP-21 implements status transitions.
  await db.incident.update({
    where: { id: incident.id },
    data: { status: "closed" },
  });

  const { user, sessionCookie } = await signInAs("admin");

  const response = await postComment(
    incident.id,
    { body: "Administrative follow-up after closure." },
    sessionCookie,
  );

  expect(response.status).toBe(201);

  const { comment } = await response.json();

  expect(comment.incidentId).toBe(incident.id);
  expect(comment.authorId).toBe(user.id);
  expect(comment.body).toBe("Administrative follow-up after closure.");

  // Verify the comment was persisted.
  const stored = await db.comment.findUnique({
    where: { id: comment.id },
  });

  expect(stored).not.toBeNull();
  expect(stored?.authorId).toBe(user.id);

  // Verify the audit event identifies the administrator.
  const audit = await db.auditLog.findFirst({
    where: {
      action: "comment.create",
      targetId: incident.id,
      userId: user.id,
    },
  });

  expect(audit).not.toBeNull();
});

it("rejects invalid comment bodies without database changes (EP-11)", async () => {
  const created = await postIncident({
    title: "Comment validation test",
    description: "Testing invalid comment inputs.",
    categoryId,
  });

  expect(created.status).toBe(201);
  const { incident } = await created.json();

  const { sessionCookie } = await signInAs("reviewer");

  const invalidBodies = [
    { body: "" },
    { body: "   " },
    { body: "x".repeat(2001) },
    { body: 123 },
    { body: "Valid comment", authorId: reporterId },
    {},
  ];

  for (const invalidBody of invalidBodies) {
    const response = await postComment(
      incident.id,
      invalidBody,
      sessionCookie,
    );

    expect(response.status).toBe(400);
  }

  expect(
    await db.comment.count({
      where: { incidentId: incident.id },
    }),
  ).toBe(0);

  expect(
    await db.auditLog.count({
      where: {
        action: "comment.create",
        targetId: incident.id,
      },
    }),
  ).toBe(0);
});

it("returns 404 for comments on nonexistent incidents (EP-11)", async () => {
  const incidentId = randomUUID();
  const { sessionCookie } = await signInAs("reviewer");

  const response = await postComment(
    incidentId,
    { body: "Comment on a nonexistent incident." },
    sessionCookie,
  );

  expect(response.status).toBe(404);

  // No comment or audit record should be created.
  expect(
    await db.comment.count({
      where: { incidentId },
    }),
  ).toBe(0);

  expect(
    await db.auditLog.count({
      where: {
        action: "comment.create",
        targetId: incidentId,
      },
    }),
  ).toBe(0);
});

it("allows reviewers to comment on under-review incidents (EP-11)", async () => {
  const created = await postIncident({
    title: "Under-review incident comment",
    description: "Verify reviewers can comment during review.",
    categoryId,
  });

  expect(created.status).toBe(201);

  const { incident } = await created.json();

  // Arrange the status directly until EP-21 is implemented.
  await db.incident.update({
    where: { id: incident.id },
    data: { status: "under_review" },
  });

  const { user, sessionCookie } = await signInAs("reviewer");

  const response = await postComment(
    incident.id,
    { body: "Review is currently in progress." },
    sessionCookie,
  );

  expect(response.status).toBe(201);

  const { comment } = await response.json();

  expect(comment.incidentId).toBe(incident.id);
  expect(comment.authorId).toBe(user.id);

  const stored = await db.comment.findUnique({
    where: { id: comment.id },
  });

  expect(stored).not.toBeNull();
  expect(stored?.body).toBe("Review is currently in progress.");

  const audit = await db.auditLog.findFirst({
    where: {
      action: "comment.create",
      targetId: incident.id,
      userId: user.id,
    },
  });

  expect(audit).not.toBeNull();
});

it("allows reviewers to advance open incidents to under-review (EP-10)", async () => {
  const created = await postIncident({
    title: "Status transition integration test",
    description: "Verify status changes and audit logging.",
    categoryId,
  });

  expect(created.status).toBe(201);

  const { incident } = await created.json();
  const { user, sessionCookie } = await signInAs("reviewer");

  const response = await patchStatus(
    incident.id,
    { status: "under_review" },
    sessionCookie,
  );

  expect(response.status).toBe(200);

  const body = await response.json();

  expect(body.incident.id).toBe(incident.id);
  expect(body.incident.status).toBe("under_review");

  const stored = await db.incident.findUnique({
    where: { id: incident.id },
  });

  expect(stored?.status).toBe("under_review");

  const audit = await db.auditLog.findFirst({
    where: {
      action: "incident.status",
      targetId: incident.id,
      userId: user.id,
    },
  });

  expect(audit).not.toBeNull();
});

it("allows reviewers to close under-review incidents (EP-10)", async () => {
  const created = await postIncident({
    title: "Incident closure integration test",
    description: "Verify the second permitted status transition.",
    categoryId,
  });

  expect(created.status).toBe(201);

  const { incident } = await created.json();
  const { user, sessionCookie } = await signInAs("reviewer");

  // First transition: open -> under_review.
  const reviewing = await patchStatus(
    incident.id,
    { status: "under_review" },
    sessionCookie,
  );

  expect(reviewing.status).toBe(200);

  // Second transition: under_review -> closed.
  const response = await patchStatus(
    incident.id,
    { status: "closed" },
    sessionCookie,
  );

  expect(response.status).toBe(200);

  const { incident: updated } = await response.json();

  expect(updated.id).toBe(incident.id);
  expect(updated.status).toBe("closed");

  const stored = await db.incident.findUnique({
    where: { id: incident.id },
  });

  expect(stored?.status).toBe("closed");

  // Each successful transition must generate an audit event.
  const audits = await db.auditLog.findMany({
    where: {
      action: "incident.status",
      targetId: incident.id,
      userId: user.id,
    },
  });

  expect(audits).toHaveLength(2);
});

it("rejects skipping directly from open to closed (EP-10)", async () => {
  const created = await postIncident({
    title: "Skipped status transition test",
    description: "Verify incidents cannot skip the review stage.",
    categoryId,
  });

  expect(created.status).toBe(201);

  const { incident } = await created.json();
  const { sessionCookie } = await signInAs("reviewer");

  const response = await patchStatus(
    incident.id,
    { status: "closed" },
    sessionCookie,
  );

  expect(response.status).toBe(409);

  // The incident must remain open.
  const stored = await db.incident.findUnique({
    where: { id: incident.id },
  });

  expect(stored?.status).toBe("open");

  // Rejected transitions must not generate audit events.
  const audits = await db.auditLog.count({
    where: {
      action: "incident.status",
      targetId: incident.id,
    },
  });

  expect(audits).toBe(0);
});

it("rejects reversing incident status to open (EP-10)", async () => {
  const created = await postIncident({
    title: "Reversed status transition test",
    description: "Verify incidents cannot return to open.",
    categoryId,
  });

  expect(created.status).toBe(201);

  const { incident } = await created.json();
  const { sessionCookie } = await signInAs("reviewer");

  // First, advance the incident to under_review.
  const reviewing = await patchStatus(
    incident.id,
    { status: "under_review" },
    sessionCookie,
  );

  expect(reviewing.status).toBe(200);

  // Attempt to reverse the transition.
  const response = await patchStatus(
    incident.id,
    { status: "open" },
    sessionCookie,
  );

  expect(response.status).toBe(400);

  // The incident must remain under_review.
  const stored = await db.incident.findUnique({
    where: { id: incident.id },
  });

  expect(stored?.status).toBe("under_review");

  // Only the successful initial transition should be audited.
  const audits = await db.auditLog.count({
    where: {
      action: "incident.status",
      targetId: incident.id,
    },
  });

  expect(audits).toBe(1);
});

it("rejects repeated incident status transitions (EP-10)", async () => {
  const created = await postIncident({
    title: "Repeated status transition test",
    description: "Verify duplicate transitions are rejected.",
    categoryId,
  });

  expect(created.status).toBe(201);

  const { incident } = await created.json();
  const { sessionCookie } = await signInAs("reviewer");

  // First request succeeds.
  const first = await patchStatus(
    incident.id,
    { status: "under_review" },
    sessionCookie,
  );

  expect(first.status).toBe(200);

  // Repeating the same transition must fail.
  const second = await patchStatus(
    incident.id,
    { status: "under_review" },
    sessionCookie,
  );

  expect(second.status).toBe(409);

  const stored = await db.incident.findUnique({
    where: { id: incident.id },
  });

  expect(stored?.status).toBe("under_review");

  // Only the successful transition should be audited.
  const audits = await db.auditLog.count({
    where: {
      action: "incident.status",
      targetId: incident.id,
    },
  });

  expect(audits).toBe(1);
});

it("rejects administrator status changes (EP-10)", async () => {
  const created = await postIncident({
    title: "Administrator status restriction",
    description: "Verify administrators cannot change incident status.",
    categoryId,
  });

  expect(created.status).toBe(201);

  const { incident } = await created.json();
  const { sessionCookie } = await signInAs("admin");

  const response = await patchStatus(
    incident.id,
    { status: "under_review" },
    sessionCookie,
  );

  expect(response.status).toBe(403);

  // The incident must remain open.
  const stored = await db.incident.findUnique({
    where: { id: incident.id },
  });

  expect(stored?.status).toBe("open");

  // Rejected operations must not generate audit events.
  const audits = await db.auditLog.count({
    where: {
      action: "incident.status",
      targetId: incident.id,
    },
  });

  expect(audits).toBe(0);
});

it("rejects reporter status changes (EP-10)", async () => {
  const created = await postIncident({
    title: "Reporter status restriction",
    description: "Verify reporters cannot change incident status.",
    categoryId,
  });

  expect(created.status).toBe(201);

  const { incident } = await created.json();

  // Use the existing reporter session.
  const response = await patchStatus(
    incident.id,
    { status: "under_review" },
    cookie,
  );

  expect(response.status).toBe(403);

  // The incident must remain open.
  const stored = await db.incident.findUnique({
    where: { id: incident.id },
  });

  expect(stored?.status).toBe("open");

  // No status transition audit event should exist.
  const audits = await db.auditLog.count({
    where: {
      action: "incident.status",
      targetId: incident.id,
    },
  });

  expect(audits).toBe(0);
});

it("rejects unauthenticated status changes (EP-10)", async () => {
  const created = await postIncident({
    title: "Unauthenticated status restriction",
    description: "Verify status changes require authentication.",
    categoryId,
  });

  expect(created.status).toBe(201);

  const { incident } = await created.json();

  // No session cookie.
  const response = await patchStatus(
    incident.id,
    { status: "under_review" },
    "",
  );

  expect(response.status).toBe(401);

  // The incident must remain open.
  const stored = await db.incident.findUnique({
    where: { id: incident.id },
  });

  expect(stored?.status).toBe("open");

  // No status transition audit event should exist.
  const audits = await db.auditLog.count({
    where: {
      action: "incident.status",
      targetId: incident.id,
    },
  });

  expect(audits).toBe(0);
});

it("returns 404 for status changes on nonexistent incidents (EP-10)", async () => {
  const incidentId = randomUUID();
  const { sessionCookie } = await signInAs("reviewer");

  const response = await patchStatus(
    incidentId,
    { status: "under_review" },
    sessionCookie,
  );

  expect(response.status).toBe(404);

  // No incident should have been created.
  const stored = await db.incident.findUnique({
    where: { id: incidentId },
  });

  expect(stored).toBeNull();

  // Rejected operations must not generate audit events.
  const audits = await db.auditLog.count({
    where: {
      action: "incident.status",
      targetId: incidentId,
    },
  });

  expect(audits).toBe(0);
});

it("prevents competing status transitions (EP-10)", async () => {
  const created = await postIncident({
    title: "Concurrent status transition test",
    description: "Verify competing updates cannot both succeed.",
    categoryId,
  });

  expect(created.status).toBe(201);

  const { incident } = await created.json();
  const { sessionCookie } = await signInAs("reviewer");

  // Submit two competing transitions concurrently.
  const responses = await Promise.all([
    patchStatus(
      incident.id,
      { status: "under_review" },
      sessionCookie,
    ),
    patchStatus(
      incident.id,
      { status: "under_review" },
      sessionCookie,
    ),
  ]);

  const statuses = responses.map((response) => response.status).sort();

  // Exactly one request should succeed.
  expect(statuses).toEqual([200, 409]);

  const stored = await db.incident.findUnique({
    where: { id: incident.id },
  });

  expect(stored?.status).toBe("under_review");

  // Only one successful transition should be audited.
  const audits = await db.auditLog.count({
    where: {
      action: "incident.status",
      targetId: incident.id,
    },
  });

  expect(audits).toBe(1);
});

it("rejects invalid status request bodies (EP-10)", async () => {
  const created = await postIncident({
    title: "Status input validation test",
    description: "Verify malformed status requests are rejected.",
    categoryId,
  });

  expect(created.status).toBe(201);

  const { incident } = await created.json();
  const { sessionCookie } = await signInAs("reviewer");

  const invalidBodies = [
    {},
    { status: "invalid" },
    { status: 123 },
    { status: null },
    { status: "under_review", reporterId },
  ];

  for (const invalidBody of invalidBodies) {
    const response = await patchStatus(
      incident.id,
      invalidBody,
      sessionCookie,
    );

    expect(response.status).toBe(400);
  }

  // None of the invalid requests should change the incident.
  const stored = await db.incident.findUnique({
    where: { id: incident.id },
  });

  expect(stored?.status).toBe("open");

  // Rejected requests must not produce status audit events.
  const audits = await db.auditLog.count({
    where: {
      action: "incident.status",
      targetId: incident.id,
    },
  });

  expect(audits).toBe(0);
});

it("allows reviewers to assign an active category (EP-21)", async () => {
  const created = await postIncident({
    title: "Incident classification test",
    description: "Verify reviewer category assignment.",
    categoryId,
  });

  expect(created.status).toBe(201);

  const { incident } = await created.json();
  const { sessionCookie } = await signInAs("reviewer");

  // Create a second active category for reassignment.
  const destination = await db.category.create({
    data: {
      name: `classification-${randomUUID().slice(0, 8)}`,
      active: true,
    },
  });

  const response = await updateCategory(
    incident.id,
    { categoryId: destination.id },
    sessionCookie,
  );

  expect(response.status).toBe(200);

  const { incident: updated } = await response.json();

  expect(updated.id).toBe(incident.id);
  expect(updated.categoryId).toBe(destination.id);

  // Verify the database was updated.
  const stored = await db.incident.findUnique({
    where: { id: incident.id },
  });

  expect(stored?.categoryId).toBe(destination.id);

  // Verify the classification was audited.
  const audits = await db.auditLog.findMany({
    where: {
      action: "incident.classify",
      targetId: incident.id,
    },
  });

  expect(audits).toHaveLength(1);
});

it("rejects inactive category assignments (EP-21)", async () => {
  const created = await postIncident({
    title: "Inactive category restriction",
    description: "Verify inactive categories cannot be assigned.",
    categoryId,
  });

  expect(created.status).toBe(201);

  const { incident } = await created.json();
  const { sessionCookie } = await signInAs("reviewer");

  // Create a category that exists but is inactive.
  const inactiveCategory = await db.category.create({
    data: {
      name: `inactive-${randomUUID().slice(0, 8)}`,
      active: false,
    },
  });

  const response = await updateCategory(
    incident.id,
    { categoryId: inactiveCategory.id },
    sessionCookie,
  );

  expect(response.status).toBe(400);

  // The incident must retain its original category.
  const stored = await db.incident.findUnique({
    where: { id: incident.id },
  });

  expect(stored?.categoryId).toBe(categoryId);

  // No classification audit event should be created.
  const audits = await db.auditLog.count({
    where: {
      action: "incident.classify",
      targetId: incident.id,
    },
  });

  expect(audits).toBe(0);
});

it("rejects nonexistent category assignments (EP-21)", async () => {
  const created = await postIncident({
    title: "Nonexistent category restriction",
    description: "Verify unknown categories cannot be assigned.",
    categoryId,
  });

  expect(created.status).toBe(201);

  const { incident } = await created.json();
  const { sessionCookie } = await signInAs("reviewer");

  // Valid UUID format, but no matching category record.
  const nonexistentCategoryId = randomUUID();

  const response = await updateCategory(
    incident.id,
    { categoryId: nonexistentCategoryId },
    sessionCookie,
  );

  expect(response.status).toBe(400);

  // The original category must remain unchanged.
  const stored = await db.incident.findUnique({
    where: { id: incident.id },
  });

  expect(stored?.categoryId).toBe(categoryId);

  // Rejected assignments must not generate audit events.
  const audits = await db.auditLog.count({
    where: {
      action: "incident.classify",
      targetId: incident.id,
    },
  });

  expect(audits).toBe(0);
});

it("rejects category changes on closed incidents (EP-21)", async () => {
  const created = await postIncident({
    title: "Closed incident classification restriction",
    description: "Verify reviewers cannot reclassify closed incidents.",
    categoryId,
  });

  expect(created.status).toBe(201);

  const { incident } = await created.json();
  const { sessionCookie } = await signInAs("reviewer");

  // Create an active destination category.
  const destination = await db.category.create({
    data: {
      name: `closed-classification-${randomUUID().slice(0, 8)}`,
      active: true,
    },
  });

  // Arrange a closed incident using the EP-10 workflow.
  const reviewing = await patchStatus(
    incident.id,
    { status: "under_review" },
    sessionCookie,
  );
  expect(reviewing.status).toBe(200);

  const closing = await patchStatus(
    incident.id,
    { status: "closed" },
    sessionCookie,
  );
  expect(closing.status).toBe(200);

  // A reviewer must not be able to reclassify a closed incident.
  const response = await updateCategory(
    incident.id,
    { categoryId: destination.id },
    sessionCookie,
  );

  expect(response.status).toBe(404);

  // The original category must remain unchanged.
  const stored = await db.incident.findUnique({
    where: { id: incident.id },
  });

  expect(stored?.status).toBe("closed");
  expect(stored?.categoryId).toBe(categoryId);

  // No classification audit event should be created.
  const audits = await db.auditLog.count({
    where: {
      action: "incident.classify",
      targetId: incident.id,
    },
  });

  expect(audits).toBe(0);
});

it("rejects administrator category changes (EP-21)", async () => {
  const created = await postIncident({
    title: "Administrator classification restriction",
    description: "Verify administrators cannot reclassify incidents.",
    categoryId,
  });

  expect(created.status).toBe(201);

  const { incident } = await created.json();
  const { sessionCookie } = await signInAs("admin");

  const destination = await db.category.create({
    data: {
      name: `admin-classification-${randomUUID().slice(0, 8)}`,
      active: true,
    },
  });

  const response = await updateCategory(
    incident.id,
    { categoryId: destination.id },
    sessionCookie,
  );

  expect(response.status).toBe(403);

  // The incident must retain its original category.
  const stored = await db.incident.findUnique({
    where: { id: incident.id },
  });

  expect(stored?.categoryId).toBe(categoryId);

  // Rejected operations must not generate classification audit events.
  const audits = await db.auditLog.count({
    where: {
      action: "incident.classify",
      targetId: incident.id,
    },
  });

  expect(audits).toBe(0);
});

it("rejects reporter category changes (EP-21)", async () => {
  const created = await postIncident({
    title: "Reporter classification restriction",
    description: "Verify reporters cannot reclassify incidents.",
    categoryId,
  });

  expect(created.status).toBe(201);

  const { incident } = await created.json();

  // The existing reporter session is used by default.
  const destination = await db.category.create({
    data: {
      name: `reporter-classification-${randomUUID().slice(0, 8)}`,
      active: true,
    },
  });

  const response = await updateCategory(
    incident.id,
    { categoryId: destination.id },
  );

  expect(response.status).toBe(403);

  // Verify the original category remains unchanged.
  const stored = await db.incident.findUnique({
    where: { id: incident.id },
  });

  expect(stored?.categoryId).toBe(categoryId);

  // No classification audit event should be generated.
  const audits = await db.auditLog.count({
    where: {
      action: "incident.classify",
      targetId: incident.id,
    },
  });

  expect(audits).toBe(0);
});

it("rejects unauthenticated category changes (EP-21)", async () => {
  const created = await postIncident({
    title: "Unauthenticated classification restriction",
    description: "Verify authentication is required for classification.",
    categoryId,
  });

  expect(created.status).toBe(201);

  const { incident } = await created.json();

  const destination = await db.category.create({
    data: {
      name: `unauth-classification-${randomUUID().slice(0, 8)}`,
      active: true,
    },
  });

  // Supply no session cookie.
  const response = await updateCategory(
    incident.id,
    { categoryId: destination.id },
    "",
  );

  expect(response.status).toBe(401);

  // The incident must remain unchanged.
  const stored = await db.incident.findUnique({
    where: { id: incident.id },
  });

  expect(stored?.categoryId).toBe(categoryId);

  // No classification audit event should be generated.
  const audits = await db.auditLog.count({
    where: {
      action: "incident.classify",
      targetId: incident.id,
    },
  });

  expect(audits).toBe(0);
});

it("rejects malformed category IDs (EP-21)", async () => {
  const created = await postIncident({
    title: "Malformed category validation",
    description: "Verify category IDs must be valid UUIDs.",
    categoryId,
  });

  expect(created.status).toBe(201);

  const { incident } = await created.json();
  const { sessionCookie } = await signInAs("reviewer");

  // Invalid UUID format should fail Zod validation.
  const response = await updateCategory(
    incident.id,
    { categoryId: "not-a-valid-uuid" },
    sessionCookie,
  );

  expect(response.status).toBe(400);

  // Verify the original category remains unchanged.
  const stored = await db.incident.findUnique({
    where: { id: incident.id },
  });

  expect(stored?.categoryId).toBe(categoryId);

  // Rejected requests must not generate classification audit events.
  const audits = await db.auditLog.count({
    where: {
      action: "incident.classify",
      targetId: incident.id,
    },
  });

  expect(audits).toBe(0);
});

it("rejects classification of nonexistent incidents (EP-21)", async () => {
  const { sessionCookie } = await signInAs("reviewer");

  // Generate a valid UUID that does not identify an incident.
  const nonexistentIncidentId = randomUUID();

  const response = await updateCategory(
    nonexistentIncidentId,
    { categoryId },
    sessionCookie,
  );

  expect(response.status).toBe(404);

  // No classification audit event should be generated.
  const audits = await db.auditLog.count({
    where: {
      action: "incident.classify",
      targetId: nonexistentIncidentId,
    },
  });

  expect(audits).toBe(0);
});

it("rejects unexpected fields in category updates (EP-21)", async () => {
  const created = await postIncident({
    title: "Category mass-assignment restriction",
    description: "Verify unexpected fields are rejected.",
    categoryId,
  });

  expect(created.status).toBe(201);

  const { incident } = await created.json();
  const { sessionCookie } = await signInAs("reviewer");

  const destination = await db.category.create({
    data: {
      name: `mass-assignment-${randomUUID().slice(0, 8)}`,
      active: true,
    },
  });

  // Attempt to modify both category and status.
  const response = await updateCategory(
    incident.id,
    {
      categoryId: destination.id,
      status: "closed",
    },
    sessionCookie,
  );

  expect(response.status).toBe(400);

  // Neither field should have changed.
  const stored = await db.incident.findUnique({
    where: { id: incident.id },
  });

  expect(stored?.categoryId).toBe(categoryId);
  expect(stored?.status).toBe("open");

  // Rejected requests must not generate classification audit events.
  const audits = await db.auditLog.count({
    where: {
      action: "incident.classify",
      targetId: incident.id,
    },
  });

  expect(audits).toBe(0);
});

it("allows administrators to create active categories (EP-22)", async () => {
  const {sessionCookie } = await signInAs("admin");

  const name = `Admin category ${randomUUID().slice(0, 8)}`;

  const response = await createAdminCategory(
    { name },
    sessionCookie,
  );

  expect(response.status).toBe(201);

  const { category } = await response.json();

  expect(category.name).toBe(name);
  expect(category.active).toBe(true);

  // Verify persistence.
  const stored = await db.category.findUnique({
    where: { id: category.id },
  });

  expect(stored?.name).toBe(name);
  expect(stored?.active).toBe(true);

  // Verify transactional audit logging.
  const audits = await db.auditLog.findMany({
    where: {
      action: "category.create",
      targetId: category.id,
    },
  });

  expect(audits).toHaveLength(1);
});

it("rejects duplicate category names regardless of case (EP-22)", async () => {
  const { sessionCookie } = await signInAs("admin");

  const name = `Duplicate Category ${randomUUID().slice(0, 8)}`;

  // Create the original category.
  const first = await createAdminCategory(
    { name },
    sessionCookie,
  );

  expect(first.status).toBe(201);

  const { category } = await first.json();

  // Attempt to create the same category using different capitalization.
  const duplicate = await createAdminCategory(
    { name: name.toLowerCase() },
    sessionCookie,
  );

  expect(duplicate.status).toBe(409);

  // Only one category with this name should exist.
  const matches = await db.category.findMany({
    where: {
      name: {
        equals: name,
        mode: "insensitive",
      },
    },
  });

  expect(matches).toHaveLength(1);

  // The rejected request must not create another audit event.
  const audits = await db.auditLog.count({
    where: {
      action: "category.create",
      targetId: category.id,
    },
  });

  expect(audits).toBe(1);
});

it("rejects empty or whitespace-only category names (EP-22)", async () => {
  const { sessionCookie } = await signInAs("admin");

  const response = await createAdminCategory(
    { name: "   " },
    sessionCookie,
  );

  expect(response.status).toBe(400);
});

it("rejects category names exceeding 100 characters (EP-22)", async () => {
  const { sessionCookie } = await signInAs("admin");

  const response = await createAdminCategory(
    { name: "A".repeat(101) },
    sessionCookie,
  );

  expect(response.status).toBe(400);
});

it("rejects unexpected fields during category creation (EP-22)", async () => {
  const { sessionCookie } = await signInAs("admin");

  const name = `Mass Assignment ${randomUUID().slice(0, 8)}`;

  // Attempt to override the category's default active state.
  const response = await createAdminCategory(
    {
      name,
      active: false,
    },
    sessionCookie,
  );

  expect(response.status).toBe(400);

  // Verify the rejected request did not create a category.
  const stored = await db.category.findFirst({
    where: { name },
  });

  expect(stored).toBeNull();
});

it("allows administrators to list active and inactive categories (EP-22)", async () => {
  const { sessionCookie } = await signInAs("admin");

  const suffix = randomUUID().slice(0, 8);

  const activeCategory = await db.category.create({
    data: {
      name: `Active List ${suffix}`,
      active: true,
    },
  });

  const inactiveCategory = await db.category.create({
    data: {
      name: `Inactive List ${suffix}`,
      active: false,
    },
  });

  const response = await getAdminCategories(
    new Request("https://app.test/api/admin/categories", {
      method: "GET",
      headers: {
        cookie: sessionCookie,
      },
    }),
  );

  expect(response.status).toBe(200);

  const { categories } = await response.json();

  const active = categories.find(
    (category: { id: string }) => category.id === activeCategory.id,
  );

  const inactive = categories.find(
    (category: { id: string }) => category.id === inactiveCategory.id,
  );

  expect(active).toMatchObject({
    id: activeCategory.id,
    name: activeCategory.name,
    active: true,
  });

  expect(inactive).toMatchObject({
    id: inactiveCategory.id,
    name: inactiveCategory.name,
    active: false,
  });
});

it("rejects reporter access to category management (EP-22)", async () => {
  // Use the existing reporter session.
  const getResponse = await getAdminCategories(
    new Request("https://app.test/api/admin/categories", {
      method: "GET",
      headers: {
        cookie,
      },
    }),
  );

  expect(getResponse.status).toBe(403);

  const name = `Reporter Category ${randomUUID().slice(0, 8)}`;

  const postResponse = await createAdminCategory(
    { name },
    cookie,
  );

  expect(postResponse.status).toBe(403);

  // Verify the rejected POST did not create a category.
  const stored = await db.category.findFirst({
    where: { name },
  });

  expect(stored).toBeNull();
});

it("rejects reviewer access to category management (EP-22)", async () => {
  const { sessionCookie } = await signInAs("reviewer");

  const getResponse = await getAdminCategories(
    new Request("https://app.test/api/admin/categories", {
      method: "GET",
      headers: {
        cookie: sessionCookie,
      },
    }),
  );

  expect(getResponse.status).toBe(403);

  const name = `Reviewer Category ${randomUUID().slice(0, 8)}`;

  const postResponse = await createAdminCategory(
    { name },
    sessionCookie,
  );

  expect(postResponse.status).toBe(403);

  // Rejected creation must not modify the database.
  const stored = await db.category.findFirst({
    where: { name },
  });

  expect(stored).toBeNull();
});

it("rejects unauthenticated category management requests (EP-22)", async () => {
  // GET without a session cookie.
  const getResponse = await getAdminCategories(
    new Request("https://app.test/api/admin/categories", {
      method: "GET",
    }),
  );

  expect(getResponse.status).toBe(401);

  const name = `Unauth Category ${randomUUID().slice(0, 8)}`;

  // POST without a session cookie.
  const postResponse = await createAdminCategory(
    { name },
    "",
  );

  expect(postResponse.status).toBe(401);

  // Verify the rejected POST did not create a category.
  const stored = await db.category.findFirst({
    where: { name },
  });

  expect(stored).toBeNull();
});

it("trims category names before creation (EP-22)", async () => {
  const { sessionCookie } = await signInAs("admin");

  const name = `Trimmed Category ${randomUUID().slice(0, 8)}`;

  const response = await createAdminCategory(
    { name: `   ${name}   ` },
    sessionCookie,
  );

  expect(response.status).toBe(201);

  const { category } = await response.json();

  // The API should return the normalized name.
  expect(category.name).toBe(name);
  expect(category.active).toBe(true);

  // The database should store the normalized name.
  const stored = await db.category.findUnique({
    where: { id: category.id },
  });

  expect(stored?.name).toBe(name);

  // Successful creation must be audited.
  const audits = await db.auditLog.count({
    where: {
      action: "category.create",
      targetId: category.id,
    },
  });

  expect(audits).toBe(1);
});

it("accepts category names exactly 100 characters long (EP-22)", async () => {
  const { sessionCookie } = await signInAs("admin");

  // Unique name with exactly 100 characters.
  const name = `Boundary-${randomUUID()}-`.padEnd(100, "A");

  expect(name).toHaveLength(100);

  const response = await createAdminCategory(
    { name },
    sessionCookie,
  );

  expect(response.status).toBe(201);

  const { category } = await response.json();

  expect(category.name).toBe(name);
  expect(category.active).toBe(true);

  // Verify the full name was persisted.
  const stored = await db.category.findUnique({
    where: { id: category.id },
  });

  expect(stored?.name).toBe(name);
});

it("allows administrators to rename categories (EP-23)", async () => {
  const { sessionCookie } = await signInAs("admin");
  const suffix = randomUUID().slice(0, 8);

  const category = await db.category.create({
    data: {
      name: `Original Category ${suffix}`,
      active: true,
    },
  });

  const newName = `Renamed Category ${suffix}`;

  const response = await updateAdminCategory(
    category.id,
    { name: newName },
    sessionCookie,
  );

  expect(response.status).toBe(200);

  const { category: updated } = await response.json();

  expect(updated.id).toBe(category.id);
  expect(updated.name).toBe(newName);
  expect(updated.active).toBe(true);

  // Verify the updated name was persisted.
  const stored = await db.category.findUnique({
    where: { id: category.id },
  });

  expect(stored?.name).toBe(newName);
  expect(stored?.active).toBe(true);

  // Verify transactional audit logging.
  const audits = await db.auditLog.count({
    where: {
      action: "category.update",
      targetId: category.id,
    },
  });

  expect(audits).toBe(1);
});

it("preserves incident assignments when a category is deactivated (EP-23)", async () => {
  const { sessionCookie } = await signInAs("admin");

  const category = await db.category.create({
    data: {
      name: `Deactivation ${randomUUID().slice(0, 8)}`,
      active: true,
    },
  });

  // Create an incident assigned to this category.
  const created = await postIncident({
    title: "Historical category preservation",
    description: "Verify category relationships survive deactivation.",
    categoryId: category.id,
  });

  expect(created.status).toBe(201);

  const { incident } = await created.json();

  // Administrator deactivates the category.
  const response = await updateAdminCategory(
    category.id,
    { active: false },
    sessionCookie,
  );

  expect(response.status).toBe(200);

  const { category: updated } = await response.json();

  expect(updated.active).toBe(false);

  // Category still exists but is inactive.
  const storedCategory = await db.category.findUnique({
    where: { id: category.id },
  });

  expect(storedCategory?.active).toBe(false);

  // Existing incident retains its category assignment.
  const storedIncident = await db.incident.findUnique({
    where: { id: incident.id },
  });

  expect(storedIncident?.categoryId).toBe(category.id);

  // Verify the deactivation was audited.
  const audits = await db.auditLog.count({
    where: {
      action: "category.update",
      targetId: category.id,
    },
  });

  expect(audits).toBe(1);
});

it("allows administrators to reactivate categories (EP-23)", async () => {
  const { sessionCookie } = await signInAs("admin");

  const category = await db.category.create({
    data: {
      name: `Reactivation ${randomUUID().slice(0, 8)}`,
      active: false,
    },
  });

  // Administrator reactivates the category.
  const response = await updateAdminCategory(
    category.id,
    { active: true },
    sessionCookie,
  );

  expect(response.status).toBe(200);

  const { category: updated } = await response.json();

  expect(updated.id).toBe(category.id);
  expect(updated.active).toBe(true);
  expect(updated.name).toBe(category.name);

  // Verify the category was reactivated in the database.
  const stored = await db.category.findUnique({
    where: { id: category.id },
  });

  expect(stored?.active).toBe(true);

  // Verify the update was audited.
  const audits = await db.auditLog.count({
    where: {
      action: "category.update",
      targetId: category.id,
    },
  });

  expect(audits).toBe(1);
});

it("rejects duplicate category names during renaming (EP-23)", async () => {
  const { sessionCookie } = await signInAs("admin");
  const suffix = randomUUID().slice(0, 8);

  const original = await db.category.create({
    data: {
      name: `Original Name ${suffix}`,
      active: true,
    },
  });

  const existing = await db.category.create({
    data: {
      name: `Existing Name ${suffix}`,
      active: true,
    },
  });

  // Attempt to rename using an existing name with different capitalization.
  const response = await updateAdminCategory(
    original.id,
    { name: existing.name.toLowerCase() },
    sessionCookie,
  );

  expect(response.status).toBe(409);

  // Neither category should be modified.
  const storedOriginal = await db.category.findUnique({
    where: { id: original.id },
  });

  const storedExisting = await db.category.findUnique({
    where: { id: existing.id },
  });

  expect(storedOriginal?.name).toBe(original.name);
  expect(storedExisting?.name).toBe(existing.name);

  // Failed renaming must not generate a successful update audit.
  const audits = await db.auditLog.count({
    where: {
      action: "category.update",
      targetId: original.id,
    },
  });

  expect(audits).toBe(0);
});

it("rejects reporter category updates (EP-23)", async () => {
  const category = await db.category.create({
    data: {
      name: `Reporter Update ${randomUUID().slice(0, 8)}`,
      active: true,
    },
  });

  // Use the existing reporter session.
  const response = await updateAdminCategory(
    category.id,
    { active: false },
    cookie,
  );

  expect(response.status).toBe(403);

  // The category must remain active.
  const stored = await db.category.findUnique({
    where: { id: category.id },
  });

  expect(stored?.active).toBe(true);

  // Rejected updates must not generate a successful audit event.
  const audits = await db.auditLog.count({
    where: {
      action: "category.update",
      targetId: category.id,
    },
  });

  expect(audits).toBe(0);
});

it("rejects reviewer category updates (EP-23)", async () => {
  const { sessionCookie } = await signInAs("reviewer");

  const category = await db.category.create({
    data: {
      name: `Reviewer Update ${randomUUID().slice(0, 8)}`,
      active: true,
    },
  });

  // Reviewers cannot modify category definitions.
  const response = await updateAdminCategory(
    category.id,
    { active: false },
    sessionCookie,
  );

  expect(response.status).toBe(403);

  // The category must remain active.
  const stored = await db.category.findUnique({
    where: { id: category.id },
  });

  expect(stored?.active).toBe(true);

  // No successful update audit event should be created.
  const audits = await db.auditLog.count({
    where: {
      action: "category.update",
      targetId: category.id,
    },
  });

  expect(audits).toBe(0);
});

it("rejects unauthenticated category updates (EP-23)", async () => {
  const category = await db.category.create({
    data: {
      name: `Unauthenticated Update ${randomUUID().slice(0, 8)}`,
      active: true,
    },
  });

  // Send the PATCH request without a session cookie.
  const response = await updateAdminCategory(
    category.id,
    { active: false },
    "",
  );

  expect(response.status).toBe(401);

  // The category must remain unchanged.
  const stored = await db.category.findUnique({
    where: { id: category.id },
  });

  expect(stored?.active).toBe(true);
  expect(stored?.name).toBe(category.name);

  // No successful category.update audit event should exist.
  const audits = await db.auditLog.count({
    where: {
      action: "category.update",
      targetId: category.id,
    },
  });

  expect(audits).toBe(0);
});

it("rejects updates to nonexistent categories (EP-23)", async () => {
  const { sessionCookie } = await signInAs("admin");

  // Valid UUID, but no matching category record.
  const nonexistentCategoryId = randomUUID();

  const response = await updateAdminCategory(
    nonexistentCategoryId,
    { active: false },
    sessionCookie,
  );

  expect(response.status).toBe(404);

  // No successful update audit event should be created.
  const audits = await db.auditLog.count({
    where: {
      action: "category.update",
      targetId: nonexistentCategoryId,
    },
  });

  expect(audits).toBe(0);
});

it("rejects empty category update requests (EP-23)", async () => {
  const { sessionCookie } = await signInAs("admin");

  const category = await db.category.create({
    data: {
      name: `Empty Update ${randomUUID().slice(0, 8)}`,
      active: true,
    },
  });

  // No fields supplied for the update.
  const response = await updateAdminCategory(
    category.id,
    {},
    sessionCookie,
  );

  expect(response.status).toBe(400);

  // Verify the category remains unchanged.
  const stored = await db.category.findUnique({
    where: { id: category.id },
  });

  expect(stored?.name).toBe(category.name);
  expect(stored?.active).toBe(true);

  // Rejected updates must not generate a successful audit event.
  const audits = await db.auditLog.count({
    where: {
      action: "category.update",
      targetId: category.id,
    },
  });

  expect(audits).toBe(0);
});

it("rejects unexpected fields in category updates (EP-23)", async () => {
  const { sessionCookie } = await signInAs("admin");

  const category = await db.category.create({
    data: {
      name: `Mass Assignment ${randomUUID().slice(0, 8)}`,
      active: true,
    },
  });

  // Attempt to modify an unauthorized field.
  const response = await updateAdminCategory(
    category.id,
    {
      active: false,
      id: randomUUID(),
    },
    sessionCookie,
  );

  expect(response.status).toBe(400);

  // Verify no fields were modified.
  const stored = await db.category.findUnique({
    where: { id: category.id },
  });

  expect(stored?.id).toBe(category.id);
  expect(stored?.name).toBe(category.name);
  expect(stored?.active).toBe(true);

  // No successful update audit event should be created.
  const audits = await db.auditLog.count({
    where: {
      action: "category.update",
      targetId: category.id,
    },
  });

  expect(audits).toBe(0);
});

});