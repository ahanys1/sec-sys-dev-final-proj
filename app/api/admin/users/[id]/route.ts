import { requireAdmin, targetId } from "@/src/lib/admin/guard";
import { updateUsernameSchema } from "@/src/lib/admin/schemas";
import { updateUsername } from "@/src/lib/admin/users";
import { getDb } from "@/src/lib/db";
import { jsonResponse, methodNotAllowed, route } from "@/src/lib/http";
import { logger } from "@/src/lib/logger";
import { parseWrite } from "@/src/lib/request";

type Context = { params: Promise<{ id: string }> };

// EP-16: FR-3, SR-6. The strict schema allows only `username`; role, active, and password are rejected (V15.3.3, V8.2.3).
export const PATCH = route("admin.users.update", async (requestId, request, context: Context) => {
  const { user: admin } = await requireAdmin(request, { write: true });
  const id = await targetId(context);
  const body = await parseWrite(request, updateUsernameSchema);
  const user = await updateUsername(getDb(), admin.id, id, body.username);
  logger.info("admin.user.updated", { requestId, userId: admin.id, targetId: id });
  return jsonResponse({ user });
});

export const OPTIONS = () => methodNotAllowed(["PATCH"]);

export const GET = () => methodNotAllowed(["PATCH"]);

export const HEAD = () => methodNotAllowed(["PATCH"]);

export const POST = () => methodNotAllowed(["PATCH"]);

export const PUT = () => methodNotAllowed(["PATCH"]);

export const DELETE = () => methodNotAllowed(["PATCH"]);
