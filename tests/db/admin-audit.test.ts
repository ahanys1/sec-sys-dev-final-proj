
import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { getDb } from "@/src/lib/db";
import { listAuditRecords } from "@/src/lib/admin/audit";

const appUrl = process.env.TEST_DATABASE_APP_URL;

describe.skipIf(!appUrl)("admin audit retrieval (EP-18)", () => {
  // Use the isolated database supplied by scripts/test-db.sh.
  process.env.DATABASE_URL = appUrl;

  afterAll(async () => {
    await getDb().$disconnect();
  });

  it("filters audit records by action", async () => {
    const db = getDb();
    const marker = randomUUID();

    // Use a unique marker to identify records from this test.
    await db.auditLog.createMany({
      data: [
        {
          actorType: "system",
          action: "user.create",
          targetId: marker,
        },
        {
          actorType: "system",
          action: "category.create",
          targetId: marker,
        },
      ],
    });

    const result = await listAuditRecords({
      page: 1,
      limit: 100,
      action: "user.create",
    });

    expect(
      result.records.some(
        (record) =>
          record.action === "user.create" &&
          record.targetId === marker,
      ),
    ).toBe(true);

    expect(
      result.records.every(
        (record) => record.action === "user.create",
      ),
    ).toBe(true);
  });

it("paginates audit records in stable descending order", async () => {
  const db = getDb();
  const marker = `pagination-${randomUUID()}`;

  // Insert three records with identical timestamps.
  // This tests the secondary ordering by ID.
  const timestamp = new Date("2026-11-20T12:00:00.000Z");

  const inserted = [];

  for (let i = 0; i < 3; i++) {
    const record = await db.auditLog.create({
      data: {
        actorType: "system",
        action: "category.create",
        targetId: `${marker}-${i}`,
        createdAt: timestamp,
      },
    });

    inserted.push(record);
  }

  const page1 = await listAuditRecords({
    page: 1,
    limit: 1,
    action: "category.create",
    from: timestamp.toISOString(),
    to: timestamp.toISOString(),
  });

  const page2 = await listAuditRecords({
    page: 2,
    limit: 1,
    action: "category.create",
    from: timestamp.toISOString(),
    to: timestamp.toISOString(),
  });

  expect(page1.records).toHaveLength(1);
  expect(page2.records).toHaveLength(1);

  expect(page1.records[0].id).toBe(inserted[2].id.toString());
  expect(page2.records[0].id).toBe(inserted[1].id.toString());

  expect(page1.pagination.total).toBe(3);
  expect(page1.pagination.totalPages).toBe(3);
  expect(page2.pagination.page).toBe(2);
});

it("combines action and date filters and handles empty pages", async () => {
  const db = getDb();
  const marker = `filter-${randomUUID()}`;

  const earlier = new Date("2026-11-19T10:00:00.000Z");
  const later = new Date("2026-11-20T10:00:00.000Z");

  await db.auditLog.createMany({
    data: [
      {
        actorType: "system",
        action: "category.create",
        targetId: `${marker}-earlier`,
        createdAt: earlier,
      },
      {
        actorType: "system",
        action: "category.create",
        targetId: `${marker}-later`,
        createdAt: later,
      },
    ],
  });

  // Include only the later record.
  const query = {
    page: 1,
    limit: 25,
    action: "category.create" as const,
    from: "2026-11-20T00:00:00.000Z",
    to: "2026-11-20T23:59:59.999Z",
  };

  const result = await listAuditRecords(query);

  expect(
    result.records.some(
      (record) => record.targetId === `${marker}-later`,
    ),
  ).toBe(true);

  expect(
    result.records.some(
      (record) => record.targetId === `${marker}-earlier`,
    ),
  ).toBe(false);

  // Request a page beyond the available results.
  const beyondLastPage = await listAuditRecords({
    ...query,
    page: 100,
  });

  expect(beyondLastPage.records).toEqual([]);
  expect(beyondLastPage.pagination.page).toBe(100);
  expect(beyondLastPage.pagination.total).toBe(result.pagination.total);
  expect(beyondLastPage.pagination.totalPages).toBe(
    result.pagination.totalPages,
  );

  // A date range containing no matching records.
  const empty = await listAuditRecords({
    ...query,
    from: "2026-11-18T00:00:00.000Z",
    to: "2026-11-18T23:59:59.999Z",
  });

  expect(empty.records).toEqual([]);
  expect(empty.pagination.total).toBe(0);
  expect(empty.pagination.totalPages).toBe(0);
});

});
