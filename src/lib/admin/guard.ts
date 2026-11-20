import { ApiError } from "../http";
import { assertWriteRequest } from "../request";
import { authenticate, type Authenticated } from "../auth/guard";
import { idSchema } from "./schemas";

// SR-1, SR-4, SR-5, C-1, C-2, C-4 (ASVS V8.2.1, V8.3.1): every admin handler calls this itself.
// Anonymous callers learn nothing about the request schema: the origin check is cheap and body-free,
// then authentication and the admin role are checked before any body is read.
export async function requireAdmin(request: Request, options: { write: boolean }): Promise<Authenticated> {
  if (options.write) assertWriteRequest(request);
  return authenticate(request, { roles: ["admin"] });
}

/** A malformed ID looks the same as a missing account. */
export async function targetId(context: { params: Promise<{ id: string }> }): Promise<string> {
  const parsed = idSchema.safeParse((await context.params).id);
  if (!parsed.success) throw new ApiError("not_found");
  return parsed.data;
}
