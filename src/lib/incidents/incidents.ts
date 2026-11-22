import type { PrismaClient } from "../../generated/prisma/client";
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