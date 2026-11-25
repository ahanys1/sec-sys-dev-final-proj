import { requireAdmin } from "@/src/lib/admin/guard";
import { createUserSchema } from "@/src/lib/admin/schemas";
import { createUser, listUsers } from "@/src/lib/admin/users";
import { getDb } from "@/src/lib/db";
import { jsonResponse, methodNotAllowed, route } from "@/src/lib/http";
import { logger } from "@/src/lib/logger";
import { parseWrite } from "@/src/lib/request";

// EP-12 (list) and EP-13 (create): FR-1 to FR-3, FR-11, SR-4, T-28 (ASVS V6.4.1, V8.2.1, V15.3.1).
export const GET = route("admin.users.list", async (_requestId, request) => {
  await requireAdmin(request, { write: false });
  return jsonResponse({ users: await listUsers(getDb()) });
});

export const POST = route("admin.users.create", async (requestId, request) => {
  const { user: admin } = await requireAdmin(request, { write: true });
  const body = await parseWrite(request, createUserSchema);
  const { user, temporaryPassword } = await createUser(getDb(), admin.id, body);
  logger.info("admin.user.created", { requestId, userId: admin.id, targetId: user.id });
  // Shown once; the response is no-store and the value is never logged or stored in plaintext.
  return jsonResponse({ user, temporaryPassword }, { status: 201 });
});

export const OPTIONS = () => methodNotAllowed(["GET", "HEAD", "POST"]);

export const PUT = () => methodNotAllowed(["GET", "HEAD", "POST"]);

export const PATCH = () => methodNotAllowed(["GET", "HEAD", "POST"]);

export const DELETE = () => methodNotAllowed(["GET", "HEAD", "POST"]);
