import { describe, expect, it } from "vitest";
import * as health from "@/app/api/health/route";
import * as login from "@/app/api/auth/login/route";

describe("API method errors (NFR-2, SR-12; ASVS V16.5.1)", () => {
  it("returns consistent JSON and Allow for every unsupported health/login method", async () => {
    for (const [handlers, allowed] of [[health, "GET, HEAD"], [login, "POST"]] as const) {
      for (const method of ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"] as const) {
        if (allowed.split(", ").includes(method)) continue;
        const exports: Record<string, unknown> = handlers;
        const response = await (exports[method] as () => Response)();
        expect(response.status).toBe(405);
        expect(response.headers.get("allow")).toBe(allowed);
        expect(response.headers.get("cache-control")).toBe("no-store");
        const { error } = await response.json();
        expect(error.code).toBe("method_not_allowed");
        expect(error.requestId).toBe(response.headers.get("x-request-id"));
      }
    }
  });
});
