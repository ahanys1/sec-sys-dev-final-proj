
import { z } from "zod";
import { AUDIT_ACTIONS } from "../audit";
import { ApiError } from "../http";

const positiveInteger = z.string().regex(/^[1-9]\d*$/).transform(Number).pipe(z.number().safe().int());

export const auditQuerySchema = z.strictObject({
  page: positiveInteger.prefault("1"),
  limit: positiveInteger.pipe(z.number().max(100)).prefault("25"),
  action: z.enum(AUDIT_ACTIONS).optional(),
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
})
.refine(
  ({ from, to }) =>
    !from || !to || Date.parse(from) <= Date.parse(to),
  {
    message: "Start date must be before or equal to end date.",
    path: ["to"],
  }
);

export type AuditQuery = z.infer<typeof auditQuerySchema>;

export function parseAuditQuery(url: string): AuditQuery {
  const params = new URL(url).searchParams;
  const values: Record<string, string> = {};

  for (const [key, value] of params) {
    if (Object.hasOwn(values, key)) {
      throw new ApiError("invalid_request");
    }
    values[key] = value;
  }

  const result = auditQuerySchema.safeParse(values);

  if (!result.success) {
    throw new ApiError("invalid_request");
  }

  return result.data;
}