import { authenticate } from "@/src/lib/auth/guard";
import { getDb } from "@/src/lib/db";
import { jsonResponse, methodNotAllowed, route } from "@/src/lib/http";
import { listReviewerIncidents } from "@/src/lib/incidents/incidents";

// EP-10: Reviewers can list open and under-review incidents.
export const GET = route("incident.review.queue", async (_requestId, request) => {
  await authenticate(request, { roles: ["reviewer"] });

  const incidents = await listReviewerIncidents(getDb());

  return jsonResponse({
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

export const POST = () => methodNotAllowed(["GET"]);
export const PUT = () => methodNotAllowed(["GET"]);
export const PATCH = () => methodNotAllowed(["GET"]);
export const DELETE = () => methodNotAllowed(["GET"]);