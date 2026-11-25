"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function PasswordForm() {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setErrors({});
    setMessage("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/account/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: form.get("currentPassword"),
        newPassword: form.get("newPassword"),
        endOtherSessions: form.get("endOtherSessions") === "on",
      }),
    });
    if (response.ok) {
      router.replace("/");
      router.refresh();
      return;
    }
    const body = (await response.json().catch(() => null)) as { error?: { message?: string; fields?: Record<string, string> } } | null;
    setErrors(body?.error?.fields ?? {});
    setMessage(body?.error?.fields ? "" : (body?.error?.message ?? "Something went wrong."));
    setBusy(false);
  }

  return (
    <form method="post" onSubmit={submit} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Current password
        <input name="currentPassword" type="password" autoComplete="current-password" required maxLength={128} className="rounded border px-2 py-1" />
        {errors.currentPassword ? <span className="text-red-700">{errors.currentPassword}</span> : null}
      </label>
      <label className="flex flex-col gap-1 text-sm">
        New password (15 to 128 characters)
        <input name="newPassword" type="password" autoComplete="new-password" required minLength={15} maxLength={128} className="rounded border px-2 py-1" />
        {errors.newPassword ? <span className="text-red-700">{errors.newPassword}</span> : null}
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input name="endOtherSessions" type="checkbox" defaultChecked /> Sign out my other sessions
      </label>
      {message ? <p role="alert" className="text-sm text-red-700">{message}</p> : null}
      <button type="submit" disabled={busy} className="rounded border px-3 py-2">
        Change password
      </button>
    </form>
  );
}
