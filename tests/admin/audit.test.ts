
import { describe, expect, it } from "vitest";
import { auditQuerySchema, parseAuditQuery } from "@/src/lib/admin/audit-schemas";

describe("audit query validation (EP-18)", () => {
  it("applies default pagination", () => {
    const result = auditQuerySchema.parse({});

    expect(result.page).toBe(1);
    expect(result.limit).toBe(25);
  });

  it("accepts valid pagination parameters", () => {
    const result = auditQuerySchema.parse({
      page: "2",
      limit: "10",
    });

    expect(result.page).toBe(2);
    expect(result.limit).toBe(10);
  });

  it("rejects invalid pagination parameters", () => {
    for (const value of ["0", "-1", "1.5", "abc", "1e3"]) {
      expect(
        auditQuerySchema.safeParse({ page: value }).success
      ).toBe(false);
    }

    expect(
      auditQuerySchema.safeParse({ limit: "101" }).success
    ).toBe(false);
  });

  it("rejects unknown audit actions", () => {
    expect(
      auditQuerySchema.safeParse({
        action: "user.delete",
      }).success
    ).toBe(false);
  });

  it("rejects reversed date ranges", () => {
    expect(
      auditQuerySchema.safeParse({
        from: "2026-11-22T00:00:00Z",
        to: "2026-11-21T00:00:00Z",
      }).success
    ).toBe(false);
  });

  it("rejects unknown and duplicate query parameters", () => {
    expect(() =>
      parseAuditQuery("http://localhost/api/admin/audit?unknown=1")
    ).toThrow();

    expect(() =>
      parseAuditQuery("http://localhost/api/admin/audit?page=1&page=2")
    ).toThrow();
  });
});
