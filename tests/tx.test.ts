import { describe, it, expect, vi } from "vitest";
import type { PrismaClient } from "@/src/generated/prisma/client";
import { serializable } from "@/src/lib/tx";

describe("transaction conflict recovery (NFR-5/6)", () => {
  it.each([
    { code: "P2034" },
    { name: "DriverAdapterError", cause: { kind: "TransactionWriteConflict" } },
  ])("retries a recognized conflict and returns the successful transaction", async (failure) => {
    const transaction = vi.fn().mockRejectedValueOnce(failure).mockResolvedValueOnce("committed");
    expect(await serializable({ $transaction: transaction } as unknown as PrismaClient, async () => "committed")).toBe("committed");
    expect(transaction).toHaveBeenCalledTimes(2);
  });
  it("bounds retries and converts exhausted conflicts to a safe response", async () => {
    const transaction = vi.fn().mockRejectedValue({ name: "DriverAdapterError", cause: { kind: "TransactionWriteConflict" } });
    await expect(serializable({ $transaction: transaction } as unknown as PrismaClient, async () => null)).rejects.toMatchObject({ code: "conflict" });
    expect(transaction).toHaveBeenCalledTimes(4);
  });
  it.each([null, {name:"DriverAdapterError",cause:{kind:"AuthenticationFailed"}},new Error("TransactionWriteConflict")])("does not retry unrelated or message-only errors", async failure => {
    const transaction=vi.fn().mockRejectedValue(failure);
    await expect(serializable({$transaction:transaction} as unknown as PrismaClient,async()=>null)).rejects.toBe(failure);
    expect(transaction).toHaveBeenCalledTimes(1);
  });
});
