
import { Prisma, type PrismaClient, type Role } from "@/src/generated/prisma/client";
import { runAudited } from "../audit";
import { ApiError } from "../http";
import type { CreateCategoryInput, UpdateCategoryInput} from "./schemas";


// EP-22: Only administrators may create incident categories.
// Category creation and audit logging are atomic.
export async function createCategory(
  db: PrismaClient,
  admin: { id: string; role: Role },
  input: CreateCategoryInput,
) {
  if (admin.role !== "admin") {
    throw new ApiError("forbidden");
  }

  
  try {
    return await runAudited(
      db,
      async (tx) => {
        return tx.category.create({
          data: {
            name: input.name,
          },
          select: {
            id: true,
            name: true,
            active: true,
          },
        });
      },
      (category) => ({
        actor: { type: "user", userId: admin.id },
        action: "category.create",
        targetId: category.id,
      }),
    );
  } catch (error) {
    // EP-22: Convert duplicate category names to HTTP 409.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ApiError("conflict");
    }

    throw error;
  }
}

// EP-22: Administrators can list all incident categories,
// including inactive categories needed for management.
export async function listCategories(
  db: PrismaClient,
  admin: { id: string; role: Role },
) {
  if (admin.role !== "admin") {
    throw new ApiError("forbidden");
  }

  return db.category.findMany({
    select: {
      id: true,
      name: true,
      active: true,
    },
    orderBy: {
      name: "asc",
    },
  });
}

 // EP-23: Only administrators may rename or activate/deactivate categories.
 // Category updates and audit logging are atomic.
export async function updateCategory(
  db: PrismaClient,
  categoryId: string,
  admin: { id: string; role: Role },
  input: UpdateCategoryInput,
) {
  if (admin.role !== "admin") {
    throw new ApiError("forbidden");
  }

  try {
    return await runAudited(
      db,
      async (tx) => {
        const existing = await tx.category.findUnique({
          where: { id: categoryId },
          select: { id: true },
        });

        if (!existing) {
          throw new ApiError("not_found");
        }

        return tx.category.update({
          where: { id: categoryId },
          data: {
            ...(input.name !== undefined && { name: input.name }),
            ...(input.active !== undefined && { active: input.active }),
          },
          select: {
            id: true,
            name: true,
            active: true,
          },
        });
      },
      (category) => ({
        actor: { type: "user", userId: admin.id },
        action: "category.update",
        targetId: category.id,
      }),
    );
  } catch (error) {
    // EP-23: Reject case-insensitive duplicate category names.
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      throw new ApiError("conflict");
    }

    throw error;
  }
}