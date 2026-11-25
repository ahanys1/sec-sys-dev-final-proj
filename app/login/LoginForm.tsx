"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: form.get("username"), password: form.get("password") }),
    });
    if (response.ok) {
      const body = (await response.json()) as { mustChangePassword: boolean };
      router.replace(body.mustChangePassword ? "/account/password" : "/");
      router.refresh();
      return;
    }
    // One generic message for every failure (T-02); never show server details.
    setError(response.status === 429 ? "Too many attempts. Try again later." : "Invalid username or password.");
    setBusy(false);
  }

  return (
    <form method="post" onSubmit={submit} className="flex w-80 flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm">
        Username
        <input name="username" autoComplete="username" required maxLength={128} className="rounded border px-2 py-1" />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Password
        <input name="password" type="password" autoComplete="current-password" required maxLength={128} className="rounded border px-2 py-1" />
      </label>
      {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
      <button type="submit" disabled={busy} className="rounded border px-3 py-2">
        Sign in
      </button>
    </form>
  );
}
