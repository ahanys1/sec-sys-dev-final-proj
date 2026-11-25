import { requireAdmin, targetId } from "@/src/lib/admin/guard";
import { emptySchema } from "@/src/lib/admin/schemas";
import { resetPassword } from "@/src/lib/admin/users";
import { getDb } from "@/src/lib/db";
import { jsonResponse, methodNotAllowed, route } from "@/src/lib/http";
import { logger } from "@/src/lib/logger";
import { parseWrite } from "@/src/lib/request";

type Context = { params: Promise<{ id: string }> };

// EP-17: FR-3, FR-11 (ASVS V6.4.1, V7.4.2). A new one-time temporary password; the target's sessions end.
export const POST = route("admin.users.password-reset", async (requestId, request, context: Context) => {
  const { user: admin } = await requireAdmin(request, { write: true });
  const id = await targetId(context);
  await parseWrite(request, emptySchema);
  const { user, temporaryPassword } = await resetPassword(getDb(), admin.id, id);
  logger.info("admin.user.password-reset", { requestId, userId: admin.id, targetId: id });
  return jsonResponse({ user, temporaryPassword });
});

export const OPTIONS = () => methodNotAllowed(["POST"]);

export const GET = () => methodNotAllowed(["POST"]);

export const HEAD = () => methodNotAllowed(["POST"]);

export const PUT = () => methodNotAllowed(["POST"]);

export const PATCH = () => methodNotAllowed(["POST"]);

export const DELETE = () => methodNotAllowed(["POST"]);
