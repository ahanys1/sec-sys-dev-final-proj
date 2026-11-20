import { describe, expect, it } from "vitest";
import { findPublishedDbPorts, findServerActions, run } from "../scripts/ci-guards.mjs";

describe("ci guards", () => {
  it("flags a Server Action directive (FW-3, A-5)", () => {
    expect(findServerActions("'use server'\nexport async function a() {}")).toBe(true);
    expect(findServerActions("export const x = 1;")).toBe(false);
  });

  it("flags a published PostgreSQL port (T-52)", () => {
    const bad = "services:\n  db:\n    image: postgres:18-alpine\n    ports:\n      - '5432:5432'\n  app:\n    image: app\n    ports:\n      - '3000:3000'\n";
    expect(findPublishedDbPorts(bad)).toEqual(["db:"]);
    const ok = "services:\n  db:\n    image: postgres:18-alpine\n  app:\n    image: app\n    ports:\n      - '3000:3000'\n";
    expect(findPublishedDbPorts(ok)).toEqual([]);
  });

  it("passes on the current repo", () => {
    expect(run(".")).toEqual([]);
  });
});
