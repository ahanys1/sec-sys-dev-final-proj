
import { authenticate } from "@/src/lib/auth/guard";
import { createCategory, listCategories } from "@/src/lib/categories/categories";
import { createCategorySchema } from "@/src/lib/categories/schemas";
import { getDb } from "@/src/lib/db";
import { jsonResponse, methodNotAllowed, route } from "@/src/lib/http";
import { parseWrite } from "@/src/lib/request";

// EP-22: Administrators can list all categories.
export const GET = route("category.list", async (_requestId, request) => {
  const { user } = await authenticate(request, {
    roles: ["admin"],
  });

  const categories = await listCategories(getDb(), user);

  return jsonResponse({ categories });
});

// EP-22: Only administrators can create categories.
export const POST = route("category.create", async (_requestId, request) => {
  const { user } = await authenticate(request, {
    roles: ["admin"],
  });

  const input = await parseWrite(request, createCategorySchema);
  const category = await createCategory(getDb(), user, input);

  return jsonResponse({ category }, { status: 201 });
});

export const PATCH = () => methodNotAllowed(["GET", "HEAD", "POST"]);
export const PUT = () => methodNotAllowed(["GET", "HEAD", "POST"]);
export const DELETE = () => methodNotAllowed(["GET", "HEAD", "POST"]);
export const OPTIONS = () => methodNotAllowed(["GET", "HEAD", "POST"]);
