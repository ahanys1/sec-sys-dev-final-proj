import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, errorResponse, route } from "@/src/lib/http";
import { GET, OPTIONS } from "@/app/api/health/route";

afterEach(() => vi.restoreAllMocks());

function captureLogs() {
  const lines: string[] = [];
  vi.spyOn(process.stdout, "write").mockImplementation((chunk: string | Uint8Array) => {
    lines.push(String(chunk));
    return true;
  });
  return lines;
}

describe("error handling (NFR-2, SR-12, SR-13; V16.5.1)", () => {
  it("returns the standard error shape with a request ID", async () => {
    const res = errorResponse("not_found", "req-1");
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: { code: "not_found", message: "Not found.", requestId: "req-1" } });
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("maps thrown ApiErrors to their status", async () => {
    const handler = route("test", async () => {
      throw new ApiError("forbidden");
    });
    const res = await handler(new Request("https://x.test/"));
    expect(res.status).toBe(403);
  });

  it("hides internals from the client but logs them (SR-12, SR-13)", async () => {
    const lines = captureLogs();
    const handler = route("test", async () => {
      throw new Error("SELECT * FROM users WHERE password = 'hunter2'");
    });
    const res = await handler(new Request("https://x.test/"));
    const body = JSON.stringify(await res.json());
    expect(res.status).toBe(500);
    expect(body).not.toMatch(/SELECT|hunter2/);
    expect(lines.join("")).toContain('"event":"request.unhandled"');
    expect(lines.join("")).toContain('"route":"test"');
  });

  it("keeps Prisma error messages (which embed query arguments) out of logs", async () => {
    const lines = captureLogs();
    class PrismaClientKnownRequestError extends Error {
      name = "PrismaClientKnownRequestError";
      code = "P2002";
    }
    class WrappedDbError extends Error {
      code = "22P02"; // Postgres: invalid input syntax, whose message quotes the input
    }
    for (const err of [
      new PrismaClientKnownRequestError("Invalid invocation: data { description: 'secret text' }"),
      new WrappedDbError('invalid input syntax for type uuid: "secret text"'),
    ]) {
      lines.length = 0;
      await route("test", async () => {
        throw err;
      })(new Request("https://x.test/"));
      expect(lines.join("")).toContain(err instanceof WrappedDbError ? "22P02" : "P2002");
      expect(lines.join("")).not.toContain("secret text");
    }
  });
});

describe("EP-03 /api/health (V13.4.5, T-48)", () => {
  it("returns only {status:ok} with no-store", async () => {
    const res = GET();
    expect(await res.json()).toEqual({ status: "ok" });
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("refuses OPTIONS with 405", () => {
    const res = OPTIONS();
    expect(res.status).toBe(405);
    expect(res.headers.get("allow")).toBe("GET");
  });
});
