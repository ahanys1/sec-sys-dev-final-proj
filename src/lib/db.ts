import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

// Design §1, §7 (T-42): the running app connects as the restricted app role. The owner
// credential is only given to the migration job, never to this process.
// Pool of 10 per design §7.2. Created lazily so builds don't need a database.
const globalForDb = globalThis as unknown as { db?: PrismaClient };

export function getDb(): PrismaClient {
  if (!globalForDb.db) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("DATABASE_URL is not set");
    globalForDb.db = new PrismaClient({ adapter: new PrismaPg({ connectionString, max: 10 }) });
  }
  return globalForDb.db;
}
