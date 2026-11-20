import { describe, expect, it } from "vitest";
import { z } from "zod";
import { ApiError } from "@/src/lib/http";
import { assertWriteRequest, parseWrite } from "@/src/lib/request";

const base = { origin: "https://app.test", host: "app.test", "content-type": "application/json" };
const post = (body: string, headers: Record<string, string> = base, method = "POST") =>
  new Request("https://app.test/api/x", { method, headers, body });
const schema = z.strictObject({ title: z.string().min(1).max(200) });

async function code(fn: () => unknown) {
  try {
    await fn();
  } catch (e) {
    return e instanceof ApiError ? e.code : "other";
  }
  return "none";
}

describe("write request checks (C-4, T-09; V3.5.1, V3.5.3)", () => {
  it("accepts a same-origin JSON POST and PATCH", () => {
    expect(() => assertWriteRequest(post("{}"))).not.toThrow();
    expect(() => assertWriteRequest(post("{}", base, "PATCH"))).not.toThrow();
  });

  it("rejects a missing, foreign, or malformed Origin", async () => {
    const { origin: _omit, ...noOrigin } = base;
    void _omit;
    expect(await code(() => assertWriteRequest(post("{}", noOrigin)))).toBe("origin_forbidden");
    expect(await code(() => assertWriteRequest(post("{}", { ...base, origin: "https://evil.test" })))).toBe("origin_forbidden");
    expect(await code(() => assertWriteRequest(post("{}", { ...base, origin: "not a url" })))).toBe("origin_forbidden");
  });

  it("rejects non-JSON content types and other methods", async () => {
    expect(await code(() => assertWriteRequest(post("{}", { ...base, "content-type": "text/plain" })))).toBe("unsupported_media_type");
    expect(await code(() => assertWriteRequest(post("{}", base, "PUT")))).toBe("method_not_allowed");
  });

  it("rejects x-middleware-subrequest in code (T-43)", async () => {
    expect(await code(() => assertWriteRequest(post("{}", { ...base, "x-middleware-subrequest": "x" })))).toBe("invalid_request");
  });
});

describe("JSON parsing (SR-7; V2.2.1, V2.2.2)", () => {
  it("returns typed data for a valid body", async () => {
    expect(await parseWrite(post('{"title":"ok"}'), schema)).toEqual({ title: "ok" });
  });

  it("rejects unknown fields without echoing them (mass assignment, T-17)", async () => {
    try {
      await parseWrite(post('{"title":"ok","role":"admin"}'), schema);
      expect.unreachable();
    } catch (e) {
      expect((e as ApiError).code).toBe("invalid_request");
      expect(JSON.stringify((e as ApiError).fields)).not.toContain("role");
    }
  });

  it("rejects invalid JSON, wrong types, and over-long values", async () => {
    expect(await code(() => parseWrite(post("{nope"), schema))).toBe("invalid_request");
    expect(await code(() => parseWrite(post('{"title":5}'), schema))).toBe("invalid_request");
    expect(await code(() => parseWrite(post(JSON.stringify({ title: "x".repeat(201) })), schema))).toBe("invalid_request");
  });

  it("caps the body at 64 KB even without a Content-Length (T-32)", async () => {
    const big = JSON.stringify({ title: "x".repeat(70_000) });
    expect(await code(() => parseWrite(post(big), schema))).toBe("payload_too_large");
    const declared = post("{}", { ...base, "content-length": "70000" });
    expect(await code(() => parseWrite(declared, schema))).toBe("payload_too_large");
  });
});
