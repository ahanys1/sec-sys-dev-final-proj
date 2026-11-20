import { describe, expect, it } from "vitest";
import { buildCsp, newNonce, STATIC_HEADERS } from "@/src/lib/security-headers";

describe("security headers (C-7, SR-16; V3.4.1 to V3.4.6)", () => {
  it("builds a nonce-based CSP that forbids framing and inline script", () => {
    const csp = buildCsp("abc", false);
    expect(csp).toContain("script-src 'self' 'nonce-abc' 'strict-dynamic'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("upgrade-insecure-requests");
    expect(csp).not.toContain("unsafe-inline");
    expect(csp).not.toContain("unsafe-eval");
  });

  it("allows unsafe-eval and websockets only in development", () => {
    const dev = buildCsp("abc", true);
    expect(dev).toContain("'unsafe-eval'");
    expect(dev).toContain("ws:");
    expect(dev).not.toContain("upgrade-insecure-requests");
    expect(buildCsp("abc", false)).not.toContain("ws:");
  });

  it("sets HSTS, nosniff, Referrer-Policy and no CORS headers", () => {
    expect(STATIC_HEADERS["Strict-Transport-Security"]).toMatch(/max-age=\d+/);
    expect(STATIC_HEADERS["X-Content-Type-Options"]).toBe("nosniff");
    expect(STATIC_HEADERS["Referrer-Policy"]).toBe("no-referrer");
    expect(Object.keys(STATIC_HEADERS).some((h) => h.toLowerCase().startsWith("access-control-"))).toBe(false);
  });

  it("generates a different nonce each time", () => {
    expect(newNonce()).not.toBe(newNonce());
  });
});
