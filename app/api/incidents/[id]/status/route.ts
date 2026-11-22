
import { authenticate } from "@/src/lib/auth/guard";
import { getDb } from "@/src/lib/db";
import { jsonResponse, methodNotAllowed, route } from "@/src/lib/http";
import { updateIncidentStatus } from "@/src/lib/incidents/incidents";
import { updateIncidentStatusSchema } from "@/src/lib/incidents/schemas";
import { parseWrite } from "@/src/lib/request";

type Context = { params: Promise<{ id: string }> };

// EP-10: Only reviewers may advance incident status.
export const PATCH = route("incident.status", async (_requestId, request, context: Context) => {
  const { user } = await authenticate(request, { roles: ["reviewer"] });
  const { id } = await context.params;
  const input = await parseWrite(request, updateIncidentStatusSchema);

  const incident = await updateIncidentStatus(getDb(), id, user, input);

  return jsonResponse({
    incident: {
      id: incident.id,
      status: incident.status,
      updatedAt: incident.updatedAt.toISOString(),
    },
  });
});

export const GET = () => methodNotAllowed(["PATCH"]);
export const POST = () => methodNotAllowed(["PATCH"]);
export const PUT = () => methodNotAllowed(["PATCH"]);
export const DELETE = () => methodNotAllowed(["PATCH"]);
