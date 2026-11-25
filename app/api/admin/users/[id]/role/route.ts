import { requireAdmin, targetId } from "@/src/lib/admin/guard";
import { roleSchema } from "@/src/lib/admin/schemas";
import { changeRole } from "@/src/lib/admin/users";
import { getDb } from "@/src/lib/db";
import { jsonResponse, methodNotAllowed, route } from "@/src/lib/http";
import { logger } from "@/src/lib/logger";
import { parseWrite } from "@/src/lib/request";

type Context = { params: Promise<{ id: string }> };

// EP-14: FR-2, FR-11, SR-6, T-27. The target must differ from the caller; the last active admin stays.
export const PATCH = route("admin.users.role", async (requestId, request, context: Context) => {
  const { user: admin } = await requireAdmin(request, { write: true });
  const id = await targetId(context);
  const body = await parseWrite(request, roleSchema);
  const user = await changeRole(getDb(), admin.id, id, body.role);
  logger.info("admin.user.role", { requestId, userId: admin.id, targetId: id });
  return jsonResponse({ user });
});

export const OPTIONS = () => methodNotAllowed(["PATCH"]);

export const GET = () => methodNotAllowed(["PATCH"]);

export const HEAD = () => methodNotAllowed(["PATCH"]);

export const POST = () => methodNotAllowed(["PATCH"]);

export const PUT = () => methodNotAllowed(["PATCH"]);

export const DELETE = () => methodNotAllowed(["PATCH"]);
