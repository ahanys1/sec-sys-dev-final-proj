import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { Role } from "../../generated/prisma/client";
import { getDb } from "../db";
import { getSettings } from "./settings";
import { resolveSession, SESSION_COOKIE, type SessionUser } from "./session";

// Pages authenticate themselves too (C-1, C-2, C-11): the proxy never does. Wrong role looks like a missing page.
export async function requirePageUser(options: { allowPasswordChange?: boolean; roles?: Role[] } = {}): Promise<SessionUser> {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (user.mustChangePassword && !options.allowPasswordChange) redirect("/account/password");
  if (options.roles && !options.roles.includes(user.role)) notFound();
  return user;
}

export async function currentUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? null;
  const db = getDb();
  return (await resolveSession(db, token, await getSettings(db)))?.user ?? null;
}
