"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Role = "user" | "reviewer" | "admin";
type Row = {
  id: string;
  username: string;
  role: Role;
  active: boolean;
  mustChangePassword: boolean;
  tempPasswordExpiresAt: string | null;
};
type Issued = { username: string; password: string };

const ROLES: Role[] = ["user", "reviewer", "admin"];

export function UsersAdmin({ users, currentUserId }: { users: Row[]; currentUserId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [issued, setIssued] = useState<Issued | null>(null); // held in memory only; shown once (V6.4.1)
  const [busy, setBusy] = useState(false);

  async function call(path: string, method: "POST" | "PATCH", body: unknown) {
    setBusy(true);
    setMessage("");
    const response = await fetch(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const json = (await response.json().catch(() => null)) as {
      temporaryPassword?: string;
      error?: { message?: string; fields?: Record<string, string> };
    } | null;
    setBusy(false);
    if (!response.ok) {
      const fields = json?.error?.fields ? Object.values(json.error.fields).join(" ") : "";
      setMessage(fields || json?.error?.message || "Something went wrong.");
      return null;
    }
    router.refresh();
    return json;
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const username = String(data.get("username") ?? "");
    const result = await call("/api/admin/users", "POST", { username, role: data.get("role") });
    if (result?.temporaryPassword) {
      setIssued({ username, password: result.temporaryPassword });
      form.reset();
    }
  }

  async function reset(user: Row) {
    if (!confirm(`Reset the password for ${user.username}? Their sessions will end.`)) return;
    const result = await call(`/api/admin/users/${user.id}/password-reset`, "POST", {});
    if (result?.temporaryPassword) setIssued({ username: user.username, password: result.temporaryPassword });
  }

  async function rename(user: Row) {
    const username = prompt("New username (3 to 32 characters: a-z, 0-9, dot, underscore, hyphen)", user.username);
    if (username && username !== user.username) await call(`/api/admin/users/${user.id}`, "PATCH", { username });
  }

  return (
    <div className="flex flex-col gap-6">
      {issued ? (
        <section role="status" className="rounded border p-4">
          <p className="text-sm">
            Temporary password for <strong>{issued.username}</strong>. Copy it now: it is shown once and expires. The user must change it at
            first sign-in.
          </p>
          <code className="my-2 block select-all break-all text-lg">{issued.password}</code>
          <button className="rounded border px-3 py-1 text-sm" onClick={() => setIssued(null)}>
            I have copied it
          </button>
        </section>
      ) : null}
      {message ? (
        <p role="alert" className="text-sm text-red-700">
          {message}
        </p>
      ) : null}

      <form onSubmit={create} className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Username
          <input name="username" required minLength={3} maxLength={32} autoComplete="off" className="rounded border px-2 py-1" />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Role
          <select name="role" defaultValue="user" className="rounded border px-2 py-1">
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <button type="submit" disabled={busy} className="rounded border px-3 py-1">
          Create user
        </button>
      </form>

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b">
            <th className="py-2">Username</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => {
            const self = u.id === currentUserId;
            return (
              <tr key={u.id} className="border-b">
                <td className="py-2">
                  {u.username}
                  {self ? " (you)" : ""}
                  {u.mustChangePassword ? " · temporary password" : ""}
                </td>
                <td>
                  <select
                    aria-label={`Role for ${u.username}`}
                    value={u.role}
                    disabled={self || busy}
                    onChange={(e) => call(`/api/admin/users/${u.id}/role`, "PATCH", { role: e.target.value })}
                    className="rounded border px-1 py-0.5"
                  >
                    {ROLES.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </td>
                <td>{u.active ? "Active" : "Deactivated"}</td>
                <td className="flex flex-wrap gap-2 py-2">
                  <button className="rounded border px-2 py-0.5" disabled={busy} onClick={() => rename(u)}>
                    Rename
                  </button>
                  <button className="rounded border px-2 py-0.5" disabled={self || busy} onClick={() => reset(u)}>
                    Reset password
                  </button>
                  <button
                    className="rounded border px-2 py-0.5"
                    disabled={self || busy}
                    onClick={() => call(`/api/admin/users/${u.id}/status`, "PATCH", { active: !u.active })}
                  >
                    {u.active ? "Deactivate" : "Reactivate"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
