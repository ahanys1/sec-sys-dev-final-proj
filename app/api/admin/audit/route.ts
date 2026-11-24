
import { requireAdmin } from "@/src/lib/admin/guard";
import { parseAuditQuery } from "@/src/lib/admin/audit-schemas";
import { listAuditRecords } from "@/src/lib/admin/audit";
import { jsonResponse, methodNotAllowed, route } from "@/src/lib/http";

// EP-18: Admin-only, read-only audit history.
// FR-11, FR-12, SR-4, SR-5, SR-9 to SR-11.
export const GET = route("admin.audit.list", async (_requestId, request) => {
  await requireAdmin(request, { write: false });

  const query = parseAuditQuery(request.url);
  const result = await listAuditRecords(query);

  return jsonResponse(result);
});

export const POST = () => methodNotAllowed(["GET", "HEAD"]);
export const PATCH = () => methodNotAllowed(["GET", "HEAD"]);
export const PUT = () => methodNotAllowed(["GET", "HEAD"]);
export const DELETE = () => methodNotAllowed(["GET", "HEAD"]);

export const OPTIONS = () => methodNotAllowed(["GET", "HEAD"]);
