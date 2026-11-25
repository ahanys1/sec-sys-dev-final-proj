import { authenticate } from "@/src/lib/auth/guard";
import { getDb } from "@/src/lib/db";
import { jsonResponse, methodNotAllowed, route } from "@/src/lib/http";
import { getIncidentDetail } from "@/src/lib/incidents/incidents";
import { idSchema } from "@/src/lib/admin/schemas";
import { ApiError } from "@/src/lib/http";

type Context = {
  params: Promise<{ id: string }>;
};

// EP-09: Role-aware incident detail; unauthorized and missing IDs return 404.
export const GET = route(
  "incident.detail",
  async (_requestId, request, context: Context) => {
    const { user } = await authenticate(request);

    const { id } = await context.params;
    const parsed = idSchema.safeParse(id);

    if (!parsed.success) {
      throw new ApiError("not_found");
    }

    const incident = await getIncidentDetail(getDb(), parsed.data, user);

    return jsonResponse({ incident });
  },
);

export const POST = () => methodNotAllowed(["GET", "HEAD"]);
export const PUT = () => methodNotAllowed(["GET", "HEAD"]);
export const PATCH = () => methodNotAllowed(["GET", "HEAD"]);
export const DELETE = () => methodNotAllowed(["GET", "HEAD"]);
export const OPTIONS = () => methodNotAllowed(["GET", "HEAD"]);
