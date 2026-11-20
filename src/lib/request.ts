import { z } from "zod";
import { ApiError } from "./http";

// C-3, C-4, SR-7 (ASVS V2.2.1, V2.2.2, V3.5.1, V3.5.3): write-request checks and strict JSON parsing.
const MAX_BODY_BYTES = 64 * 1024;

/** Same-origin, JSON, POST/PATCH only. A missing Origin is rejected (C-4, T-09). */
export function assertWriteRequest(request: Request): void {
  // T-43: also refused in code, not only at the edge and in the proxy.
  if (request.headers.has("x-middleware-subrequest")) throw new ApiError("invalid_request");
  if (request.method !== "POST" && request.method !== "PATCH") throw new ApiError("method_not_allowed");

  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) throw new ApiError("origin_forbidden");
  let parsed: URL;
  try {
    parsed = new URL(origin);
  } catch {
    throw new ApiError("origin_forbidden");
  }
  const secure = parsed.protocol === "https:" || (process.env.NODE_ENV !== "production" && parsed.protocol === "http:");
  if (!secure || parsed.host !== host) throw new ApiError("origin_forbidden");

  const type = request.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  if (type !== "application/json") throw new ApiError("unsupported_media_type");
}

// Fixed messages only: never echo submitted values or field names back (V16.5.1).
function safeFields(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_";
    fields[key] ??=
      issue.code === "unrecognized_keys"
        ? "Unknown field."
        : issue.code === "too_big"
          ? "Too long."
          : issue.code === "too_small"
            ? "Too short."
            : issue.code === "invalid_type"
              ? "Wrong type or missing."
              : "Invalid value.";
  }
  return fields;
}

async function readBounded(request: Request): Promise<string> {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) throw new ApiError("payload_too_large");
  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new ApiError("payload_too_large");
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

/** Origin and content checks, a 64 KB body cap, and a strict schema (rejects unknown fields). */
export async function parseWrite<S extends z.ZodType>(request: Request, schema: S): Promise<z.infer<S>> {
  assertWriteRequest(request);
  let json: unknown;
  try {
    json = JSON.parse(await readBounded(request));
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError("invalid_request");
  }
  const result = schema.safeParse(json);
  if (!result.success) throw new ApiError("invalid_request", safeFields(result.error));
  return result.data;
}
