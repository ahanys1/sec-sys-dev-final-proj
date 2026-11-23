import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { requirePageUser } from "@/src/lib/auth/page";
import { getDb } from "@/src/lib/db";
import { listAdminIncidents } from "@/src/lib/incidents/incidents";

// EP-08: Administrators can view incidents in all statuses.
export default async function AdminIncidentsPage() {
  const admin = await requirePageUser({ roles: ["admin"] });
  const incidents = await listAdminIncidents(getDb());

  return (
    <>
      <AppHeader username={admin.username} role={admin.role} />

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
        <h1 className="text-2xl font-semibold">All Incidents</h1>

        {incidents.length === 0 ? (
          <p className="text-sm text-gray-400">
            No incidents have been reported.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {incidents.map((incident) => (
              <div
                key={incident.id}
                className="rounded border p-4"
              >
                <Link
                  href={`/admin/incidents/${incident.id}`}
                  className="font-semibold underline"
                >
                  {incident.title}
                </Link>

                <p className="text-sm text-gray-400">
                  Status: {incident.status.replaceAll("_", " ")}
                </p>

                <p className="text-sm text-gray-400">
                  Submitted: {incident.createdAt.toISOString().slice(0, 10)}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}