import { AppHeader } from "@/components/AppHeader";
import { listUsers } from "@/src/lib/admin/users";
import { requirePageUser } from "@/src/lib/auth/page";
import { getDb } from "@/src/lib/db";
import { UsersAdmin } from "./UsersAdmin";

// EP-12: admin only (SR-4, C-1, C-2). Any other role gets the same 404 as a missing page. Never renders hashes or session data.
export default async function UsersPage() {
  const me = await requirePageUser({ roles: ["admin"] });
  const users = (await listUsers(getDb())).map((u) => ({
    id: u.id,
    username: u.username,
    role: u.role,
    active: u.active,
    mustChangePassword: u.mustChangePassword,
    tempPasswordExpiresAt: u.tempPasswordExpiresAt?.toISOString() ?? null,
  }));
  return (
    <>
      <AppHeader username={me.username} role={me.role} />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
        <h1 className="text-2xl font-semibold">Users</h1>
        <UsersAdmin users={users} currentUserId={me.id} />
      </main>
    </>
  );
}
