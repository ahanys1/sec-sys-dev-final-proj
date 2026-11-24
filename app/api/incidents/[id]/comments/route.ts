import { authenticate } from "@/src/lib/auth/guard";
import { getDb } from "@/src/lib/db";
import {
  jsonResponse,
  methodNotAllowed,
  route,
} from "@/src/lib/http";
import { createIncidentComment } from "@/src/lib/incidents/incidents";
import { createCommentSchema } from "@/src/lib/incidents/schemas";
import { parseWrite } from "@/src/lib/request";

type Context = {
  params: Promise<{ id: string }>;
};

// EP-11: Reviewers and admins can comment on accessible incidents.
export const POST = route(
  "comment.create",
  async (_requestId, request, context: Context) => {
    const { user } = await authenticate(request, {
      roles: ["reviewer", "admin"],
    });

    const { id } = await context.params;

    const commentInput = await parseWrite(request, createCommentSchema);

    const comment = await createIncidentComment(
      getDb(),
      id,
      user,
      commentInput,
    );

    return jsonResponse(
      {
        comment: {
          id: comment.id,
          incidentId: comment.incidentId,
          authorId: comment.authorId,
          body: comment.body,
          createdAt: comment.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  },
);

export const GET = () => methodNotAllowed(["POST"]);
export const PUT = () => methodNotAllowed(["POST"]);
export const PATCH = () => methodNotAllowed(["POST"]);
export const DELETE = () => methodNotAllowed(["POST"]);
export const HEAD = () => methodNotAllowed(["POST"]);

export const OPTIONS = () => methodNotAllowed(["POST"]);
