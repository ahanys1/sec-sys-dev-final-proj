import { incidentPage, parseIncidentPage } from "@/src/lib/incidents/pagination";
import { authenticate } from "@/src/lib/auth/guard";
import { getDb } from "@/src/lib/db";
import { jsonResponse, methodNotAllowed, route } from "@/src/lib/http";
import { listReviewerIncidents } from "@/src/lib/incidents/incidents";

// EP-08: Reviewers can list open and under-review incidents.
export const GET = route("incident.review.queue", async (_requestId, request) => {
  await authenticate(request, { roles: ["reviewer"] });

  const page = parseIncidentPage(new URL(request.url).searchParams);
  const { incidents, pagination } = incidentPage(await listReviewerIncidents(getDb(), page), page);

  return jsonResponse({
    pagination,
    incidents: incidents.map((incident) => ({
      id: incident.id,
      title: incident.title,
      status: incident.status,
      categoryId: incident.categoryId,
      reporterId: incident.reporterId,
      createdAt: incident.createdAt.toISOString(),
      updatedAt: incident.updatedAt.toISOString(),
    })),
  });
});

export const POST = () => methodNotAllowed(["GET", "HEAD"]);
export const PUT = () => methodNotAllowed(["GET", "HEAD"]);
export const PATCH = () => methodNotAllowed(["GET", "HEAD"]);
export const DELETE = () => methodNotAllowed(["GET", "HEAD"]);
export const OPTIONS = () => methodNotAllowed(["GET", "HEAD"]);
