import Link from "next/link";
import type { IncidentPage } from "@/src/lib/incidents/pagination";

export function IncidentPagination({ path, page, hasNext }: { path: string; page: IncidentPage; hasNext: boolean }) {
  const href = (number: number) => `${path}?${new URLSearchParams({ page: String(number), limit: String(page.limit) })}`;
  return (
    <nav aria-label="Incident pages" className="flex items-center gap-4">
      {page.page > 1 ? <Link href={href(page.page - 1)} className="underline">Previous</Link> : null}
      <span>Page {page.page}</span>
      {hasNext && page.page < 10_000 ? <Link href={href(page.page + 1)} className="underline">Next</Link> : null}
    </nav>
  );
}
