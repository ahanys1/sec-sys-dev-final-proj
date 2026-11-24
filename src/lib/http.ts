import { randomUUID } from "node:crypto";
import { logger, scrubError } from "./logger";

// design §3, NFR-2, SR-12, SR-13 (ASVS V16.5.1): one error shape, fixed generic messages,
// details only in server logs.
const STATUS = {
  invalid_request: { status: 400, message: "The request is not valid." },
  unauthenticated: { status: 401, message: "Authentication is required." },
  invalid_credentials: { status: 401, message: "Invalid username or password." },
  forbidden: { status: 403, message: "You do not have access to this." },
  password_change_required: { status: 403, message: "You must change your password first." },
  origin_forbidden: { status: 403, message: "The request origin is not allowed." },
  not_found: { status: 404, message: "Not found." },
  method_not_allowed: { status: 405, message: "Method not allowed." },
  conflict: { status: 409, message: "The request conflicts with the current state." },
  payload_too_large: { status: 413, message: "The request is too large." },
  unsupported_media_type: { status: 415, message: "Content-Type must be application/json." },
  rate_limited: { status: 429, message: "Too many requests. Try again later." },
  internal: { status: 500, message: "Something went wrong." },
  unavailable: { status: 503, message: "The service is busy. Try again later." },
} as const;

export type ErrorCode = keyof typeof STATUS;

/** Throw from a handler to send a safe error. `fields` may hold only fixed, safe validation messages. */
export class ApiError extends Error {
  constructor(
    readonly code: ErrorCode,
    readonly fields?: Record<string, string>,
    readonly headers?: Record<string, string>,
    /** The authenticated caller, when known, for the denial log (V16.3.2). Never sent to the client. */
    readonly userId?: string,
  ) {
    super(code);
    this.name = "ApiError";
  }
}

export function errorResponse(code: ErrorCode, requestId: string, fields?: Record<string, string>, headers?: Record<string, string>) {
  const { status, message } = STATUS[code];
  return Response.json(
    { error: { code, message, ...(fields ? { fields } : {}), requestId } },
    { status, headers: { "Cache-Control": "no-store", "X-Request-Id": requestId, ...headers } },
  );
}

export function jsonResponse(body: unknown, init: { status?: number } = {}) {
  return Response.json(body, { status: init.status ?? 200, headers: { "Cache-Control": "no-store" } });
}

export function methodNotAllowed(allow: string[]) {
  return errorResponse("method_not_allowed", randomUUID(), undefined, { Allow: allow.join(", ") });
}

/** Wrap a Route Handler: request IDs, safe errors, and logging of anything unexpected. */
export function route<Args extends unknown[]>(
  name: string,
  handler: (requestId: string, request: Request, ...args: Args) => Promise<Response>,
) {
  return async (request: Request, ...args: Args): Promise<Response> => {
    const requestId = randomUUID();
    try {
      return await handler(requestId, request, ...args);
    } catch (err) {
      if (err instanceof ApiError) {
        // SR-16, ASVS V16.3.2: failed authorization is logged. not_found also covers missing records, by design (T-25).
        if (err.code === "forbidden" || err.code === "not_found") {
          logger.warn("access.denied", {
            requestId,
            route: name,
            method: request.method,
            status: STATUS[err.code].status,
            reason: err.code,
            userId: err.userId,
          });
        }
        return errorResponse(err.code, requestId, err.fields, err.headers);
      }
      logger.error("request.unhandled", { requestId, route: name, method: request.method, ...scrubError(err) });
      return errorResponse("internal", requestId);
    }
  };
}
