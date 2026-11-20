import { describe, expect, it } from "vitest";
import { clientIp } from "@/src/lib/ip";
import { clearedCookie, hashToken, newToken, sessionCookie, tokenFromCookieHeader } from "@/src/lib/auth/session";

describe("session cookie (SR-3; V3.3.1, V3.3.2, V3.3.4)", () => {
  it("is __Host- prefixed, HttpOnly, Secure, SameSite=Strict, Path=/ and has no Domain", () => {
    const cookie = sessionCookie("abc");
    expect(cookie.startsWith("__Host-session=abc;")).toBe(true);
    for (const attribute of ["Path=/", "HttpOnly", "Secure", "SameSite=Strict"]) expect(cookie).toContain(attribute);
    expect(cookie).not.toMatch(/Domain=/i);
  });

  it("clears with Max-Age=0 and the same attributes", () => {
    const cookie = clearedCookie();
    expect(cookie).toContain("Max-Age=0");
    expect(cookie).toContain("HttpOnly");
  });

  it("reads the token from a cookie header", () => {
    expect(tokenFromCookieHeader("a=1; __Host-session=tok123; b=2")).toBe("tok123");
    expect(tokenFromCookieHeader("a=1")).toBe(null);
    expect(tokenFromCookieHeader(null)).toBe(null);
  });
});

describe("session tokens (V7.2.3)", () => {
  it("has at least 128 bits of entropy and is unique", () => {
    const token = newToken();
    expect(Buffer.from(token, "base64url").length).toBeGreaterThanOrEqual(32);
    expect(newToken()).not.toBe(token);
  });

  it("stores a SHA-256 hash, not the token", () => {
    expect(hashToken("abc")).toMatch(/^[0-9a-f]{64}$/);
    expect(hashToken("abc")).not.toContain("abc");
  });
});

describe("client IP (T-50; V15.3.4)", () => {
  const headers = (value?: string) => new Headers(value ? { "x-forwarded-for": value } : {});
  it("takes the rightmost value for one trusted hop, ignoring a forged left side", () => {
    expect(clientIp(headers("6.6.6.6, 203.0.113.9"), 1)).toBe("203.0.113.9");
    expect(clientIp(headers("203.0.113.9"), 1)).toBe("203.0.113.9");
  });
  it("is unknown when the header is missing or no proxy is trusted", () => {
    expect(clientIp(headers(), 1)).toBe("unknown");
    expect(clientIp(headers("1.2.3.4"), 0)).toBe("unknown");
  });
});
