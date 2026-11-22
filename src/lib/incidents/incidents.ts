import type { Prisma, PrismaClient, Role } from "@/src/generated/prisma/client";
import { runAudited } from "../audit";
import { ApiError } from "../http";
import type { CreateIncidentInput } from "./schemas";

export async function createIncident(
  db: PrismaClient,
  reporterId: string,
  input: CreateIncidentInput,
) {
  return runAudited(
    db,
    async (tx) => {
      const category = await tx.category.findUnique({
        where: { id: input.categoryId },
        select: { active: true },
      });

      if (!category?.active) {
        throw new ApiError("invalid_request");
      }

      return tx.incident.create({
        data: {
          reporterId,
          title: input.title,
          description: input.description,
          categoryId: input.categoryId,
          status: "open",
        },
      });
    },
    (incident) => ({
      actor: { type: "user", userId: reporterId },
      action: "incident.create",
      targetId: incident.id,
    }),
  );
}

// EP-08: Reporters can list only incidents they submitted.
// List responses deliberately exclude incident descriptions.
export async function listReporterIncidents(
  db: PrismaClient,
  reporterId: string,
) {
  return db.incident.findMany({
    where: { reporterId },
    select: {
      id: true,
      title: true,
      status: true,
      categoryId: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: [
      { createdAt: "desc" },
      { id: "desc" },
    ],
  });
}

// EP-09: Return incident details only when the caller is authorized.
// Missing and forbidden incidents produce the same 404.
export async function getIncidentDetail(
  db: PrismaClient,
  incidentId: string,
  user: { id: string; role: Role },
) {
  const access: Prisma.IncidentWhereInput =
    user.role === "admin"
      ? {}
      : user.role === "reviewer"
        ? { status: { in: ["open", "under_review"]} }
        : { reporterId: user.id };

  const incident = await db.incident.findFirst({
    where: {
      id: incidentId,
      ...access,
    },
    select: {
      id: true,
      title: true,
      description: true,
      status: true,
      categoryId: true,
      reporterId: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!incident) {
    throw new ApiError("not_found");
  }

  return incident;
}