import type { Prisma, PrismaClient, Role } from "@/src/generated/prisma/client";
import { runAudited } from "../audit";
import { ApiError } from "../http";
import type { CreateIncidentInput, CreateCommentInput } from "./schemas";

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

// EP-10: Reviewers can list open and under-review incidents
// from all reporters. Descriptions are excluded from list results.
export async function listReviewerIncidents(db: PrismaClient) {
  return db.incident.findMany({
    where: {
      status: {
        in: ["open", "under_review"],
      },
    },
    select: {
      id: true,
      title: true,
      status: true,
      categoryId: true,
      reporterId: true,
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
// EP-11: Only reviewers and admins may comment on accessible incidents.
// The comment and audit record are committed atomically.
export async function createIncidentComment(
  db: PrismaClient,
  incidentId: string,
  author: { id: string; role: Role },
  input: CreateCommentInput,
) {
  if (author.role === "user") {
    throw new ApiError("forbidden");
  }

  return runAudited(
    db,
    async (tx) => {
      const access: Prisma.IncidentWhereInput =
        author.role === "admin"
          ? {}
          : { status: { in: ["open", "under_review"] } };

      const incident = await tx.incident.findFirst({
        where: {
          id: incidentId,
          ...access,
        },
        select: { id: true },
      });

      if (!incident) {
        throw new ApiError("not_found");
      }

      return tx.comment.create({
        data: {
          incidentId: incident.id,
          authorId: author.id,
          body: input.body,
        },
        select: {
          id: true,
          incidentId: true,
          authorId: true,
          body: true,
          createdAt: true,
        },
      });
    },
    (comment) => ({
  actor: { type: "user", userId: author.id },
  action: "comment.create",
  targetId: comment.incidentId,
}),
  );
}