import type { Prisma, PrismaClient, Role } from "@/src/generated/prisma/client";
import { runAudited } from "../audit";
import { ApiError } from "../http";
import type { CreateIncidentInput, CreateCommentInput, UpdateIncidentStatusInput, UpdateIncidentCategoryInput } from "./schemas";

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

// EP-19: Reporters can list only incidents they submitted.
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

// EP-08: Reviewers can list open and under-review incidents
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
// EP-08: Administrators may view incidents in all statuses.
// List responses exclude descriptions and other sensitive details.
export async function listAdminIncidents(db: PrismaClient) {
  return db.incident.findMany({
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

 // EP-10: Reviewers advance incidents through the allowed workflow.
 // Conditional updates prevent skipped, reversed, or competing transitions.
export async function updateIncidentStatus(
  db: PrismaClient,
  incidentId: string,
  reviewer: { id: string; role: Role },
  input: UpdateIncidentStatusInput,
) {
  if (reviewer.role !== "reviewer") {
    throw new ApiError("forbidden");
  }

  const expectedStatus =
    input.status === "under_review" ? "open" : "under_review";

  return runAudited(
    db,
    async (tx) => {
      const result = await tx.incident.updateMany({
        where: {
          id: incidentId,
          status: expectedStatus,
        },
        data: {
          status: input.status,
        },
      });

      if (result.count !== 1) {
        const incident = await tx.incident.findUnique({
          where: { id: incidentId },
          select: { id: true },
        });

        if (!incident) {
          throw new ApiError("not_found");
        }

        throw new ApiError("conflict");
      }

      return tx.incident.findUniqueOrThrow({
        where: { id: incidentId },
        select: {
          id: true,
          status: true,
          updatedAt: true,
        },
      });
    },
    (incident) => ({
      actor: { type: "user", userId: reviewer.id },
      action: "incident.status",
      targetId: incident.id,
    }),
  );
}

 // EP-21: Only reviewers may classify accessible incidents.
 // Category assignment and audit logging are atomic.
export async function updateIncidentCategory(
  db: PrismaClient,
  incidentId: string,
  reviewer: { id: string; role: Role },
  input: UpdateIncidentCategoryInput,
) {
  if (reviewer.role !== "reviewer") {
    throw new ApiError("forbidden");
  }

  return runAudited(
    db,
    async (tx) => {
      // Reviewers cannot modify closed or nonexistent incidents.
      const incident = await tx.incident.findFirst({
        where: {
          id: incidentId,
          status: { in: ["open", "under_review"] },
        },
        select: { id: true },
      });

      if (!incident) {
        throw new ApiError("not_found");
      }

      // The destination category must exist and be active.
      const category = await tx.category.findFirst({
        where: {
          id: input.categoryId,
          active: true,
        },
        select: { id: true },
      });

      if (!category) {
        throw new ApiError("invalid_request");
      }

      const result = await tx.incident.updateMany({
        where: {
          id: incident.id,
          status: { in: ["open", "under_review"] },
        },
        data: {
          categoryId: category.id,
        },
      });

      if (result.count !== 1) {
        throw new ApiError("not_found");
      }

      return tx.incident.findUniqueOrThrow({
        where: { id: incident.id },
        select: {
          id: true,
          categoryId: true,
          updatedAt: true,
        },
      });
    },
    (updated) => ({
      actor: { type: "user", userId: reviewer.id },
      action: "incident.classify",
      targetId: updated.id,
    }),
  );
}