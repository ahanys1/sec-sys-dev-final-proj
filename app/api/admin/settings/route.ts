
import { requireAdmin } from "@/src/lib/admin/guard";
import { updateSettingsSchema } from "@/src/lib/admin/settings-schemas";
import { readAdminSettings, updateAdminSettings } from "@/src/lib/admin/settings";
import { getDb } from "@/src/lib/db";
import { jsonResponse, methodNotAllowed, route } from "@/src/lib/http";
import { parseWrite } from "@/src/lib/request";

// Admin-only settings management.
// GET is read-only; PATCH validates and audits configuration changes.

export const GET = route("admin.settings.read", async (_requestId, request) => {
  await requireAdmin(request, { write: false });

  const settings = await readAdminSettings(getDb());
  return jsonResponse({ settings });
});

export const PATCH = route("admin.settings.update", async (_requestId, request) => {
  const { user: admin } = await requireAdmin(request, { write: true });

  const changes = await parseWrite(request, updateSettingsSchema);
  const settings = await updateAdminSettings(getDb(), admin.id, changes);

  return jsonResponse({ settings });
});

export const POST = () => methodNotAllowed(["GET", "HEAD", "PATCH"]);
export const PUT = () => methodNotAllowed(["GET", "HEAD", "PATCH"]);
export const DELETE = () => methodNotAllowed(["GET", "HEAD", "PATCH"]);

export const OPTIONS = () => methodNotAllowed(["GET", "HEAD", "PATCH"]);
