import { describe, expect, it } from "vitest";
import { checkNewPassword } from "@/src/lib/auth/password";
import { createUserSchema, emptySchema, idSchema, roleSchema, statusSchema, updateUsernameSchema } from "@/src/lib/admin/schemas";
import { generateTemporaryPassword, TEMP_PASSWORD_LENGTH } from "@/src/lib/admin/users";

describe("temporary passwords (V6.4.1, V11.5.1)", () => {
  it("are long, unambiguous, policy-compliant, and different every time", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) {
      const password = generateTemporaryPassword("someone");
      expect(password).toHaveLength(TEMP_PASSWORD_LENGTH);
      expect(password).toMatch(/^[A-HJ-NP-Z2-9]+$/);
      expect(checkNewPassword(password, "someone")).toBeNull();
      seen.add(password);
    }
    expect(seen.size).toBe(200);
  });
});

describe("admin schemas (SR-7, V2.2.1, V2.2.2, V15.3.3)", () => {
  it("normalizes usernames before validating them", () => {
    expect(createUserSchema.parse({ username: "  Alice.Smith ", role: "user" }).username).toBe("alice.smith");
    expect(createUserSchema.safeParse({ username: "ab", role: "user" }).success).toBe(false);
    expect(createUserSchema.safeParse({ username: "has space", role: "user" }).success).toBe(false);
    expect(createUserSchema.safeParse({ username: "a".repeat(33), role: "user" }).success).toBe(false);
    expect(createUserSchema.safeParse({ username: "../etc", role: "user" }).success).toBe(false);
  });

  it("accepts only the three roles", () => {
    expect(roleSchema.safeParse({ role: "superuser" }).success).toBe(false);
    expect(roleSchema.safeParse({ role: "reviewer" }).success).toBe(true);
  });

  it("rejects unknown fields, so profile edits cannot carry role, active, or password (EP-16)", () => {
    for (const extra of [{ role: "admin" }, { active: false }, { password: "x" }, { passwordHash: "x" }]) {
      expect(updateUsernameSchema.safeParse({ username: "valid.name", ...extra }).success).toBe(false);
    }
    expect(createUserSchema.safeParse({ username: "valid.name", role: "user", active: false }).success).toBe(false);
    expect(statusSchema.safeParse({ active: "yes" }).success).toBe(false);
    expect(emptySchema.safeParse({ anything: 1 }).success).toBe(false);
  });

  it("requires a UUID for the target", () => {
    expect(idSchema.safeParse("not-a-uuid").success).toBe(false);
    expect(idSchema.safeParse("1' OR '1'='1").success).toBe(false);
  });
});
