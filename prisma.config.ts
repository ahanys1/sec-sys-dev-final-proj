import { defineConfig } from "prisma/config";

// The migration job supplies the owner-role URL; the running app uses the restricted app role (T-42).
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: process.env.DATABASE_URL ?? "postgresql://invalid@localhost:5432/invalid" },
});
