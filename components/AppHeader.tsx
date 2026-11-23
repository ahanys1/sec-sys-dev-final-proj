import Link from "next/link";
import { LogoutButton } from "./LogoutButton";

export function AppHeader({ username, role }: { username: string; role: string }) {
  return (
    <header className="flex items-center justify-between border-b px-6 py-3">
      <Link href="/" className="font-semibold">
        Incident Reporting
      </Link>
      <div className="flex items-center gap-4 text-sm">
        <span>
          {username} ({role})
        </span>
        {role === "user" && (
          <>
            <Link href="/incidents" className="underline">
              My Incidents
            </Link>
            <Link href="/incidents/new" className="underline">
              Report Incident
            </Link>
          </>
        )}
        {role === "reviewer" && (
          <Link href="/reviewer/incidents" className="underline">
            Reviewer Queue
          </Link>
        )}
        {role === "admin" ? (
          <>
            <Link href="/admin/users" className="underline">
              Users
            </Link>
            <Link href="/admin/incidents" className="underline">
              Incidents
            </Link>
            <Link href="/admin/categories" className="underline">
              Categories
            </Link>
            <Link href="/admin/audit" className="underline">
              Audit history
            </Link>
            <Link href="/admin/settings" className="underline">
              Settings
            </Link>
          </>
        ) : null}
        <Link href="/account/password" className="underline">
          Change password
        </Link>
        <LogoutButton />
      </div>
    </header>
  );
}
