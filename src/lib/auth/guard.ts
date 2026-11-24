import type { Role } from "../../generated/prisma/client";
import { ApiError } from "../http";
import { getDb } from "../db";
import { getSettings } from "./settings";
import { resolveSession, tokenFromCookieHeader, type SessionUser } from "./session";

// SR-1, SR-4, SR-5, C-1, C-2, C-11 (ASVS V8.2.1, V8.3.1, V6.4.1): every Route Handler calls this itself.
// The role comes from the database on each request, never from the cookie.
export type Authenticated = { sessionId: string; user: SessionUser };

type Options = {
  /** Allow a session that must still change its temporary password (logout and password change only). */
  allowPasswordChange?: boolean;
  roles?: Role[];
};

export async function authenticate(request: Request, options: Options = {}): Promise<Authenticated> {
  const db = getDb();
  const session = await resolveSession(db, tokenFromCookieHeader(request.headers.get("cookie")), await getSettings(db));
  if (!session) throw new ApiError("unauthenticated");
  if (session.user.mustChangePassword && !options.allowPasswordChange) throw new ApiError("password_change_required");
  if (options.roles && !options.roles.includes(session.user.role)) throw new ApiError("forbidden", undefined, undefined, session.user.id);
  return session;
}
