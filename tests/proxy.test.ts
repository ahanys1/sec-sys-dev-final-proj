import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { config, proxy } from "@/proxy";

const req = (path: string, headers: Record<string, string> = {}) =>
  new NextRequest(`https://localhost${path}`, { headers });

describe("proxy (FW-1, T-43, T-49)", () => {
  it("sets the CSP, no-store, and static headers on pages and API paths", () => {
    for (const path of ["/", "/login", "/api/health", "/does-not-exist"]) {
      const res = proxy(req(path));
      expect(res.headers.get("content-security-policy")).toMatch(/nonce-/);
      expect(res.headers.get("cache-control")).toBe("no-store");
      expect(res.headers.get("x-content-type-options")).toBe("nosniff");
      expect(res.headers.get("strict-transport-security")).toBeTruthy();
    }
  });

  it("uses a fresh nonce per request", () => {
    const nonce = (r: Response) => r.headers.get("content-security-policy")?.match(/nonce-([^']+)/)?.[1];
    expect(nonce(proxy(req("/")))).not.toBe(nonce(proxy(req("/"))));
  });

  it("rejects requests carrying x-middleware-subrequest (CVE-2025-29927)", () => {
    const res = proxy(req("/api/health", { "x-middleware-subrequest": "middleware:middleware:middleware" }));
    expect(res.status).toBe(400);
  });

  it("does not authenticate or redirect", () => {
    const res = proxy(req("/admin"));
    expect(res.status).toBe(200);
    expect(res.headers.get("location")).toBeNull();
  });

  it("matches API and error paths, and skips only build output", () => {
    const [pattern] = config.matcher;
    const re = new RegExp(`^${pattern}$`);
    expect(re.test("/api/health")).toBe(true);
    expect(re.test("/anything")).toBe(true);
    expect(re.test("/_next/static/chunk.js")).toBe(false);
  });
});
