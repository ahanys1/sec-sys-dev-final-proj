import { describe, expect, it } from "vitest";
import { incidentPage, pageWindow, parseIncidentPage } from "@/src/lib/incidents/pagination";

describe("bounded incident paging (SR-7, NFR-3/4; ASVS V2.2.1/V15.2.2)", () => {
  it("defaults to 25 and accepts the same query in pages and APIs", () => {
    expect(parseIncidentPage({})).toEqual({ page: 1, limit: 25 });
    const query = { page: "2", limit: "10" };
    expect(parseIncidentPage(query)).toEqual(parseIncidentPage(new URLSearchParams(query)));
    expect(pageWindow(parseIncidentPage(query))).toEqual({ skip: 10, take: 11 });
    expect(incidentPage([1, 2, 3], { page: 2, limit: 2 })).toEqual({
      incidents: [1, 2], pagination: { page: 2, limit: 2, hasNext: true },
    });
    expect(incidentPage([], { page: 1, limit: 2 }).pagination.hasNext).toBe(false);
  });

  it.each(["page=0", "page=-1", "page=10001", "page=1.5", "page=no", "limit=101", "limit=0", "page=1&page=2", "role=admin", "__proto__=polluted"])("rejects %s", (query) => {
    expect(() => parseIncidentPage(new URLSearchParams(query))).toThrow("invalid_request");
  });

  it("rejects repeated page fields and bounds callers of the data layer too", () => {
    expect(() => parseIncidentPage({ page: ["1", "2"] })).toThrow("invalid_request");
    expect(() => pageWindow({ page: 1, limit: 1000 })).toThrow("invalid_request");
  });
});
