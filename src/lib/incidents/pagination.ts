import { z } from "zod";
import { ApiError } from "../http";

// SR-7, NFR-3/4, ASVS V2.2.1/V15.2.2: cap both result size and offset work (T-32).
const integer = z.string().regex(/^[1-9]\d*$/).transform(Number).pipe(z.number().safe().int());
const schema = z.strictObject({
  page: integer.pipe(z.number().max(10_000)).prefault("1"),
  limit: integer.pipe(z.number().max(100)).prefault("25"),
});
export type IncidentPage = z.infer<typeof schema>;
export const DEFAULT_INCIDENT_PAGE: IncidentPage = { page: 1, limit: 25 };
export type PageParams = Record<string, string | string[] | undefined>;

export function parseIncidentPage(params: URLSearchParams | PageParams): IncidentPage {
  const values: PageParams = Object.create(null);
  for (const [key, value] of params instanceof URLSearchParams ? params.entries() : Object.entries(params)) {
    if (Object.hasOwn(values, key)) throw new ApiError("invalid_request");
    values[key] = value;
  }
  const parsed = schema.safeParse(values);
  if (!parsed.success) throw new ApiError("invalid_request");
  return parsed.data;
}

export function pageWindow(page: IncidentPage) {
  const checked = schema.safeParse({ page: String(page.page), limit: String(page.limit) });
  if (!checked.success) throw new ApiError("invalid_request");
  return { skip: (page.page - 1) * page.limit, take: page.limit + 1 };
}

export function incidentPage<T>(rows: T[], page: IncidentPage) {
  return {
    incidents: rows.slice(0, page.limit),
    pagination: { ...page, hasNext: rows.length > page.limit },
  };
}
