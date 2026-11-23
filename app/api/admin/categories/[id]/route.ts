
import { authenticate } from "@/src/lib/auth/guard";
import { updateCategory } from "@/src/lib/categories/categories";
import { updateCategorySchema } from "@/src/lib/categories/schemas";
import { getDb } from "@/src/lib/db";
import { jsonResponse, methodNotAllowed, route } from "@/src/lib/http";
import { parseWrite } from "@/src/lib/request";

type Context = {
  params: Promise<{ id: string }>;
};

// EP-23: Only administrators may update categories.
export const PATCH = route(
  "category.update",
  async (_requestId, request, context: Context) => {
    const { user } = await authenticate(request, {
      roles: ["admin"],
    });

    const { id } = await context.params;
    const input = await parseWrite(request, updateCategorySchema);

    const category = await updateCategory(getDb(), id, user, input);

    return jsonResponse({ category });
  },
);

export const GET = () => methodNotAllowed(["PATCH"]);
export const POST = () => methodNotAllowed(["PATCH"]);
export const PUT = () => methodNotAllowed(["PATCH"]);
export const DELETE = () => methodNotAllowed(["PATCH"]);