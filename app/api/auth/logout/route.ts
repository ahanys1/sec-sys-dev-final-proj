import { z } from "zod";
import { getDb } from "@/src/lib/db";
import { jsonResponse, methodNotAllowed, route } from "@/src/lib/http";
import { logger } from "@/src/lib/logger";
import { parseWrite } from "@/src/lib/request";
import { authenticate } from "@/src/lib/auth/guard";
import { clearedCookie, destroySession } from "@/src/lib/auth/session";

// EP-05: FR-5 (ASVS V7.4.1, V14.3.1). Allowed even while a temporary password is pending.
export const POST = route("auth.logout", async (requestId, request) => {
  await parseWrite(request, z.strictObject({}));
  const { sessionId, user } = await authenticate(request, { allowPasswordChange: true });
  await destroySession(getDb(), sessionId);
  logger.info("auth.logout", { requestId, userId: user.id });
  const response = jsonResponse({ ok: true });
  response.headers.append("Set-Cookie", clearedCookie());
  response.headers.set("Clear-Site-Data", '"cache", "cookies", "storage"');
  return response;
});

export const OPTIONS = () => methodNotAllowed(["POST"]);

export const GET = () => methodNotAllowed(["POST"]);

export const HEAD = () => methodNotAllowed(["POST"]);

export const PUT = () => methodNotAllowed(["POST"]);

export const PATCH = () => methodNotAllowed(["POST"]);

export const DELETE = () => methodNotAllowed(["POST"]);
