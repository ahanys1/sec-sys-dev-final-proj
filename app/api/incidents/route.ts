import { authenticate } from "@/src/lib/auth/guard";
import { getDb } from "@/src/lib/db";
import { jsonResponse, methodNotAllowed, route } from "@/src/lib/http";
import { createIncident } from "@/src/lib/incidents/incidents";
import { createIncidentSchema } from "@/src/lib/incidents/schemas";
import { parseWrite } from "@/src/lib/request";

export const POST = route("incident.create", async (_requestId, request) => {
  const { user } = await authenticate(request, { roles: ["user"] });

  const input = await parseWrite(request, createIncidentSchema);

  const incident = await createIncident(getDb(), user.id, input);

  return jsonResponse(
    {
      incident: {
        id: incident.id,
        title: incident.title,
        status: incident.status,
        categoryId: incident.categoryId,
        createdAt: incident.createdAt.toISOString(),
      },
    },
    { status: 201 },
  );
});

export const PUT = () => methodNotAllowed(["GET", "POST"]);
export const PATCH = () => methodNotAllowed(["GET", "POST"]);
export const DELETE = () => methodNotAllowed(["GET", "POST"]);