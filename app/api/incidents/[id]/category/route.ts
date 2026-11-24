
import { authenticate } from "@/src/lib/auth/guard";
import { getDb } from "@/src/lib/db";
import { jsonResponse, methodNotAllowed, route } from "@/src/lib/http";
import { updateIncidentCategory } from "@/src/lib/incidents/incidents";
import { updateIncidentCategorySchema } from "@/src/lib/incidents/schemas";
import { parseWrite } from "@/src/lib/request";

type Context = { params: Promise<{ id: string }> };

// EP-21: Only reviewers may classify accessible incidents.
export const PATCH = route("incident.classify", async (_requestId, request, context: Context) => {
  const { user } = await authenticate(request, { roles: ["reviewer"] });
  const { id } = await context.params;
  const input = await parseWrite(request, updateIncidentCategorySchema);

  const incident = await updateIncidentCategory(getDb(), id, user, input);

  return jsonResponse({
    incident: {
      id: incident.id,
      categoryId: incident.categoryId,
      updatedAt: incident.updatedAt.toISOString(),
    },
  });
});

export const GET = () => methodNotAllowed(["PATCH"]);
export const POST = () => methodNotAllowed(["PATCH"]);
export const PUT = () => methodNotAllowed(["PATCH"]);
export const DELETE = () => methodNotAllowed(["PATCH"]);