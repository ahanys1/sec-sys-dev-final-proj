import { requireAdmin, targetId } from "@/src/lib/admin/guard";
import { statusSchema } from "@/src/lib/admin/schemas";
import { setActive } from "@/src/lib/admin/users";
import { getDb } from "@/src/lib/db";
import { jsonResponse, methodNotAllowed, route } from "@/src/lib/http";
import { logger } from "@/src/lib/logger";
import { parseWrite } from "@/src/lib/request";

type Context = { params: Promise<{ id: string }> };

// EP-15: FR-3, FR-11, SR-6, T-27 (ASVS V7.4.2, V7.4.5). Deactivation ends all of the target's sessions.
export const PATCH = route("admin.users.status", async (requestId, request, context: Context) => {
  const { user: admin } = await requireAdmin(request, { write: true });
  const id = await targetId(context);
  const body = await parseWrite(request, statusSchema);
  const user = await setActive(getDb(), admin.id, id, body.active);
  logger.info("admin.user.status", { requestId, userId: admin.id, targetId: id });
  return jsonResponse({ user });
});

export const OPTIONS = () => methodNotAllowed(["PATCH"]);
