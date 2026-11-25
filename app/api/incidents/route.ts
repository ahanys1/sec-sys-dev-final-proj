import { incidentPage, parseIncidentPage } from "@/src/lib/incidents/pagination";
import { authenticate } from "@/src/lib/auth/guard";
import { getDb } from "@/src/lib/db";
import { jsonResponse, methodNotAllowed, route } from "@/src/lib/http";
import { createIncident, listReporterIncidents } from "@/src/lib/incidents/incidents";
import { createIncidentSchema } from "@/src/lib/incidents/schemas";
import { parseWrite } from "@/src/lib/request";

// EP-19: A reporter can view their own incident list.
export const GET = route("incident.list", async (_requestId, request) => {
  const { user } = await authenticate(request, { roles: ["user"] });

  const page = parseIncidentPage(new URL(request.url).searchParams);
  const { incidents, pagination } = incidentPage(await listReporterIncidents(getDb(), user.id, page), page);

  return jsonResponse({
    pagination,
    incidents: incidents.map((incident) => ({
      ...incident,
      createdAt: incident.createdAt.toISOString(),
      updatedAt: incident.updatedAt.toISOString(),
    })),
  });
});

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

export const PUT = () => methodNotAllowed(["GET", "HEAD", "POST"]);
export const PATCH = () => methodNotAllowed(["GET", "HEAD", "POST"]);
export const DELETE = () => methodNotAllowed(["GET", "HEAD", "POST"]);
export const OPTIONS = () => methodNotAllowed(["GET", "HEAD", "POST"]);
