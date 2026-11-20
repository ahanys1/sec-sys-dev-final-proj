import { afterEach, describe, expect, it, vi } from "vitest";
import { formatLog, logger } from "@/src/lib/logger";

afterEach(() => vi.restoreAllMocks());

describe("logger (SR-9, T-54, T-55; V16.2.4, V16.2.5)", () => {
  it("drops fields that are not allowlisted", () => {
    const entry = JSON.parse(formatLog("info", "login.failed", { requestId: "r1", password: "hunter2", body: "{}" } as never));
    expect(entry.requestId).toBe("r1");
    expect(entry).not.toHaveProperty("password");
    expect(entry).not.toHaveProperty("body");
  });

  it("caps long strings", () => {
    const entry = JSON.parse(formatLog("info", "x", { reason: "a".repeat(500) }));
    expect(entry.reason.length).toBeLessThan(210);
  });

  it("cannot be used to forge extra log lines (log injection)", () => {
    const sep = String.fromCharCode(0x2028);
    const out = formatLog("info", "x", { reason: `ok\n{"level":"error","event":"forged"}\r\n${sep}` });
    expect(out).not.toContain("\n");
    expect(out).not.toContain("\r");
    expect(out).not.toContain(sep);
    expect(JSON.parse(out).event).toBe("x");
  });

  it("never throws when writing fails", () => {
    vi.spyOn(process.stdout, "write").mockImplementation(() => {
      throw new Error("disk full");
    });
    expect(() => logger.error("x")).not.toThrow();
  });
});
