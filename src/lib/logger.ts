// SR-9, SR-13, T-54, T-55 (ASVS V16.2.4, V16.2.5, V16.3.4): JSON logs on stdout, field allowlist,
// length caps, control characters encoded. Never pass request bodies, passwords, tokens, or descriptions.

const ALLOWED_FIELDS = new Set([
  "requestId",
  "route",
  "method",
  "status",
  "userId",
  "action",
  "targetId",
  "reason",
  "ip",
  "durationMs",
  "errorName",
  "errorCode",
  "errorMessage",
]);
const MAX_STRING = 200;
const LINE_SEPARATORS = new RegExp(`[${String.fromCharCode(0x2028)}${String.fromCharCode(0x2029)}]`, "g");

type Level = "info" | "warn" | "error";
export type LogFields = Record<string, string | number | boolean | null | undefined>;

// JSON.stringify escapes control characters; U+2028/2029 are valid JSON but split lines in some tools.
function clean(value: string): string {
  const capped = value.length > MAX_STRING ? `${value.slice(0, MAX_STRING)}...` : value;
  return capped.replace(LINE_SEPARATORS, (c) => "\\u" + c.charCodeAt(0).toString(16));
}

export function formatLog(level: Level, event: string, fields: LogFields = {}): string {
  const entry: Record<string, unknown> = { time: new Date().toISOString(), level, event: clean(event) };
  for (const [key, value] of Object.entries(fields)) {
    if (!ALLOWED_FIELDS.has(key) || value === undefined) continue;
    entry[key] = typeof value === "string" ? clean(value) : value;
  }
  return JSON.stringify(entry);
}

function write(level: Level, event: string, fields?: LogFields) {
  try {
    process.stdout.write(`${formatLog(level, event, fields)}\n`);
  } catch {
    // A logging failure must not fail the request (design §6).
  }
}

export const logger = {
  info: (event: string, fields?: LogFields) => write("info", event, fields),
  warn: (event: string, fields?: LogFields) => write("warn", event, fields),
  error: (event: string, fields?: LogFields) => write("error", event, fields),
};

/**
 * Safe fields for an unexpected error. Errors with a string `code` (Prisma P-codes, Postgres SQLSTATEs,
 * system errors) keep only name and code, because their messages can embed query arguments or input values.
 */
export function scrubError(err: unknown): LogFields {
  if (!(err instanceof Error)) return { errorName: "NonError" };
  const code = (err as { code?: unknown }).code;
  const fields: LogFields = { errorName: err.name, errorCode: typeof code === "string" ? code : undefined };
  if (typeof code !== "string" && !err.name.startsWith("Prisma")) fields.errorMessage = err.message;
  return fields;
}
