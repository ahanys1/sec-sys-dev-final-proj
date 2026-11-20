import { readFileSync } from "node:fs";
import { join } from "node:path";
import { randomBytes } from "node:crypto";
import argon2 from "argon2";
import { ApiError } from "../http";

// SR-2, ASVS V11.4.2, V6.2.1 to V6.2.12: argon2id with the approved parameters (design §6),
// a 15 to 128 character policy with no composition rules, and an offline common-password check.
const OPTIONS = { type: argon2.argon2id, memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;
export const PASSWORD_MIN = 15;
export const PASSWORD_MAX = 128;

// T-04: at most four hashes at once; beyond that answer a generic 503 instead of exhausting CPU and memory.
const MAX_CONCURRENT_HASHES = 4;
let running = 0;

export async function withHashSlot<T>(work: () => Promise<T>): Promise<T> {
  if (running >= MAX_CONCURRENT_HASHES) throw new ApiError("unavailable");
  running++;
  try {
    return await work();
  } finally {
    running--;
  }
}

export const hashPassword = (password: string) => withHashSlot(() => argon2.hash(password, OPTIONS));

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return withHashSlot(async () => {
    try {
      return await argon2.verify(hash, password);
    } catch {
      return false; // a malformed stored hash is a failed check, not a server error
    }
  });
}

// T-02: unknown users get the same hashing work, so timing doesn't reveal which usernames exist.
let dummyHash: Promise<string> | undefined;
export async function verifyAgainstDummy(password: string): Promise<false> {
  dummyHash ??= hashPassword(randomBytes(16).toString("hex"));
  await verifyPassword(await dummyHash, password);
  return false;
}

let common: Set<string> | undefined;
function commonPasswords(): Set<string> {
  common ??= new Set(readFileSync(join(process.cwd(), "src/data/common-passwords.txt"), "utf8").split("\n").filter(Boolean));
  return common;
}

const APPLICATION_TERMS = ["incident"];

export type PasswordProblem = "length" | "common" | "username";
export const PASSWORD_MESSAGES: Record<PasswordProblem, string> = {
  length: `Must be ${PASSWORD_MIN} to ${PASSWORD_MAX} characters.`,
  common: "Too common or easily guessed.",
  username: "Must not contain your username.",
};

/** Returns the first problem with a new password, or null when it is acceptable. */
export function checkNewPassword(password: string, username?: string): PasswordProblem | null {
  const length = [...password].length; // count characters, not UTF-16 units (V6.2.9)
  if (length < PASSWORD_MIN || length > PASSWORD_MAX) return "length";
  const lower = password.toLowerCase();
  const stripped = lower.replace(/[0-9!@#$%^&*._-]+$/, "");
  if (commonPasswords().has(lower) || commonPasswords().has(stripped)) return "common";
  if (APPLICATION_TERMS.some((term) => lower.includes(term))) return "common";
  if (username && username.length >= 3 && lower.includes(username.toLowerCase())) return "username";
  return null;
}
