
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { requirePageUser } from "@/src/lib/auth/page";
import { getDb } from "@/src/lib/db";
import { listReporterIncidents } from "@/src/lib/incidents/incidents";

// EP-19: Reporters can view only their own incidents.
// Descriptions are intentionally excluded from this list.
export default async function MyIncidentsPage() {
  const user = await requirePageUser({ roles: ["user"] });
  const incidents = await listReporterIncidents(getDb(), user.id);

  return (
    <>
      <AppHeader username={user.username} role={user.role} />

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">My Incidents</h1>
          <Link href="/incidents/new" className="underline">
            Report an Incident
          </Link>
        </div>

        {incidents.length === 0 ? (
          <p className="text-sm text-gray-400">
            You have not submitted any incidents.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {incidents.map((incident) => (
              <li key={incident.id} className="rounded border p-4">
                <h2 className="font-semibold">{incident.title}</h2>
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
      </main>
    </>
  );
}