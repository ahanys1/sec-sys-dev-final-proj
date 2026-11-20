import { describe, expect, it } from "vitest";
import { sanitizeSettings } from "@/src/lib/auth/settings";

const defaults = {
  statusMessage: "",
  sessionIdleMinutes: 30,
  sessionMaxHours: 8,
  lockoutThreshold: 5,
  lockoutMinutes: 15,
  tempPasswordHours: 24,
};

describe("settings fall back safely (V16.5.3, threat-model §1.4.1)", () => {
  it("uses the defaults when the row is missing", () => {
    expect(sanitizeSettings(null)).toEqual(defaults);
  });

  it("keeps valid values", () => {
    expect(sanitizeSettings({ ...defaults, sessionIdleMinutes: 10, statusMessage: "Maintenance tonight" })).toMatchObject({
      sessionIdleMinutes: 10,
      statusMessage: "Maintenance tonight",
    });
  });

  it("replaces out-of-range or wrong-type values with the default, never with no limit", () => {
    const bad = sanitizeSettings({
      sessionIdleMinutes: 100000,
      sessionMaxHours: 0,
      lockoutThreshold: -1,
      lockoutMinutes: "forever",
      tempPasswordHours: 1.5,
      statusMessage: "x".repeat(281),
    });
    expect(bad).toEqual(defaults);
  });
});
