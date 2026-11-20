import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ApiError } from "@/src/lib/http";
import { checkNewPassword, hashPassword, verifyAgainstDummy, verifyPassword, withHashSlot } from "@/src/lib/auth/password";

describe("password hashing (SR-2; V11.4.2)", () => {
  it("uses argon2id with the approved parameters", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(hash).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
  });

  it("verifies the right password, rejects others, and treats a bad hash as a failure", async () => {
    const hash = await hashPassword("correct horse battery staple");
    expect(await verifyPassword(hash, "correct horse battery staple")).toBe(true);
    expect(await verifyPassword(hash, "wrong horse battery staple")).toBe(false);
    expect(await verifyPassword("not-a-hash", "anything")).toBe(false);
  });

  it("does comparable hashing work for unknown users (T-02)", async () => {
    expect(await verifyAgainstDummy("whatever")).toBe(false);
  });

  it("caps concurrent hashing at four and answers a generic 503 beyond that (T-04)", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const held = Array.from({ length: 4 }, () => withHashSlot(() => gate));
    await expect(withHashSlot(async () => 1)).rejects.toMatchObject({ code: "unavailable" });
    release();
    await Promise.all(held);
    expect(await withHashSlot(async () => 1)).toBe(1);
    expect(new ApiError("unavailable").code).toBe("unavailable");
  });
});

describe("password policy (V6.2.1 to V6.2.12)", () => {
  it("requires 15 to 128 characters, counting characters not bytes", () => {
    expect(checkNewPassword("a".repeat(14) + "!")).toBe(null);
    expect(checkNewPassword("short")).toBe("length");
    expect(checkNewPassword("x9Qv7mLp2Zt4Kd8".slice(0, 14))).toBe("length");
    expect(checkNewPassword("x".repeat(129))).toBe("length");
    expect(checkNewPassword("é".repeat(15))).toBe(null); // 15 characters, 30 bytes
    expect(checkNewPassword("Zk3-".repeat(16))).toBe(null); // 64 characters are allowed (V6.2.9)
    expect(checkNewPassword("Zk3-".repeat(32))).toBe(null); // and 128 is the maximum
  });

  it("has no composition rules", () => {
    expect(checkNewPassword("alllowercaseandlongenoughtobefine")).toBe(null);
  });

  it("rejects common passwords from the offline list, case-insensitively", () => {
    const common = readFileSync("src/data/common-passwords.txt", "utf8").split("\n").find((w) => w.length >= 15 && /^[a-z]+$/.test(w));
    expect(common).toBeTruthy();
    expect(checkNewPassword(common!)).toBe("common");
    expect(checkNewPassword(common!.toUpperCase())).toBe("common");
    expect(checkNewPassword(`${common!}123`)).toBe("common"); // trailing digits don't rescue it
  });

  it("rejects passwords containing the username or application terms", () => {
    expect(checkNewPassword("my-name-is-alice-wonder-ok", "alice")).toBe("username");
    expect(checkNewPassword("totally-unrelated-incident-text")).toBe("common");
  });

  it("matches the committed checksum of the common-password list", () => {
    const data = readFileSync("src/data/common-passwords.txt");
    const expected = readFileSync("src/data/common-passwords.txt.sha256", "utf8").split(" ")[0];
    expect(createHash("sha256").update(data).digest("hex")).toBe(expected);
  });
});
