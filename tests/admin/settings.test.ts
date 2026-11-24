
import { describe, expect, it } from "vitest";
import { updateSettingsSchema } from "@/src/lib/admin/settings-schemas";

describe("admin settings validation", () => {
  it("accepts valid partial updates", () => {
    expect(
      updateSettingsSchema.safeParse({
        sessionIdleMinutes: 20,
        lockoutThreshold: 4,
      }).success,
    ).toBe(true);
  });

  it("rejects out-of-range values", () => {
    expect(
      updateSettingsSchema.safeParse({
        lockoutThreshold: 100,
      }).success,
    ).toBe(false);
  });

  it("rejects fractional values", () => {
    expect(
      updateSettingsSchema.safeParse({
        sessionIdleMinutes: 2.5,
      }).success,
    ).toBe(false);
  });

  it("rejects unknown fields", () => {
    expect(
      updateSettingsSchema.safeParse({
        admin: true,
      }).success,
    ).toBe(false);
  });

  it("rejects empty updates", () => {
    expect(updateSettingsSchema.safeParse({}).success).toBe(false);
  });
});
