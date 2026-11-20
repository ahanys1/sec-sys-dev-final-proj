import { randomInt } from "node:crypto";
import { Prisma, type PrismaClient } from "../generated/prisma/client";
import { ApiError } from "./http";

/** Prisma client or an open transaction. */
export type Db = PrismaClient | Prisma.TransactionClient;

// design §5, NFR-5, ASVS V2.3.4: guarded changes run Serializable and retry the whole transaction
// at most three times on a serialization failure (P2034), with jitter, then answer a generic 409.
export async function serializable<T>(db: PrismaClient, work: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  for (let retry = 0; ; retry++) {
    try {
      return await db.$transaction(work, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (err) {
      if ((err as { code?: unknown }).code !== "P2034") throw err;
      if (retry >= 3) throw new ApiError("conflict");
      await new Promise((resolve) => setTimeout(resolve, randomInt(10, 50)));
    }
  }
}
