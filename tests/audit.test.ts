import { describe, expect, it } from "vitest";
import type { Prisma } from "@/src/generated/prisma/client";
import { recordAudit, type AuditEntry } from "@/src/lib/audit";

function fakeTx() {
  const calls: { data: Record<string, unknown> }[] = [];
  const tx = { auditLog: { create: async (args: { data: Record<string, unknown> }) => calls.push(args) } };
  return { tx: tx as unknown as Prisma.TransactionClient, calls };
}

describe("audit entries (FR-11, SR-10; V16.2.1)", () => {
  it("records a user actor with a user ID", async () => {
    const { tx, calls } = fakeTx();
    await recordAudit(tx, { actor: { type: "user", userId: "u1" }, action: "incident.create", targetId: "i1" });
    expect(calls[0].data).toMatchObject({ actorType: "user", userId: "u1", action: "incident.create", targetId: "i1" });
  });

  it("records the system actor with no user ID (DC-3, NH-4)", async () => {
    const { tx, calls } = fakeTx();
    await recordAudit(tx, { actor: { type: "system" }, action: "user.create" });
    expect(calls[0].data).toMatchObject({ actorType: "system", userId: null });
  });

  it("allows details only for settings.update, with known keys", async () => {
    const { tx, calls } = fakeTx();
    await recordAudit(tx, {
      actor: { type: "user", userId: "u1" },
      action: "settings.update",
      details: { lockoutThreshold: { old: 5, new: 4 } },
    });
    expect(calls[0].data.details).toEqual({ lockoutThreshold: { old: 5, new: 4 } });

    const bad = { actor: { type: "user", userId: "u1" }, action: "incident.create", details: { lockoutThreshold: { old: 1, new: 2 } } };
    await expect(recordAudit(tx, bad as AuditEntry)).rejects.toThrow(/only allowed for settings.update/);
    const unknownKey = { actor: { type: "user", userId: "u1" }, action: "settings.update", details: { password: { old: "a", new: "b" } } };
    await expect(recordAudit(tx, unknownKey as unknown as AuditEntry)).rejects.toThrow(/Unknown settings key/);
  });

  it("rejects unknown actions", async () => {
    const { tx } = fakeTx();
    await expect(recordAudit(tx, { actor: { type: "system" }, action: "user.delete" } as unknown as AuditEntry)).rejects.toThrow(/Unknown audit action/);
  });
});
