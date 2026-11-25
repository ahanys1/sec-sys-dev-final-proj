import { IncidentPagination } from "@/components/IncidentPagination";
import { incidentPage, type PageParams } from "@/src/lib/incidents/pagination";
import { incidentPageQuery } from "@/src/lib/incidents/page";

import { AppHeader } from "@/components/AppHeader";
import { requirePageUser } from "@/src/lib/auth/page";
import { getDb } from "@/src/lib/db";
import { listReviewerIncidents } from "@/src/lib/incidents/incidents";
import Link from "next/link";

// EP-08: Reviewers see only open and under-review incidents.
// Descriptions are excluded from the queue.
export default async function ReviewerIncidentsPage({ searchParams }: { searchParams: Promise<PageParams> }) {
  const user = await requirePageUser({ roles: ["reviewer"] });
  const page = incidentPageQuery(await searchParams);
  const { incidents, pagination } = incidentPage(await listReviewerIncidents(getDb(), page), page);

  return (
    <>
      <AppHeader username={user.username} role={user.role} />

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
        <h1 className="text-2xl font-semibold">Reviewer Queue</h1>

        {incidents.length === 0 ? (
          <p className="text-sm text-gray-400">
            No incidents currently require review.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {incidents.map((incident) => (
              <li key={incident.id} className="rounded border p-4">
                <h2 className="font-semibold">
                  <Link
                      href={`/reviewer/incidents/${incident.id}`}
                      className="underline hover:text-blue-400"
                  >
                      {incident.title}
                  </Link>
                </h2>
                <p className="text-sm text-gray-400">
                  Status: {incident.status.replaceAll("_", " ")}
                </p>
                <p className="text-sm text-gray-400">
                  Submitted: {incident.createdAt.toISOString().slice(0, 10)}
                </p>
              </li>
            ))}
          </ul>
        )}
        <IncidentPagination path="/reviewer/incidents" page={page} hasNext={pagination.hasNext} />
      </main>
    </>
  );
}