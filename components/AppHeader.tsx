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
        {role === "admin" ? (
          <>
            <Link href="/admin/users" className="underline">
              Users
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
