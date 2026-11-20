"use client";

import { useRouter } from "next/navigation";

// V7.4.4: logout is reachable from every authenticated page.
export function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    router.replace("/login");
    router.refresh();
  }
  return (
    <button className="rounded border px-3 py-1 text-sm" onClick={logout}>
      Log out
    </button>
  );
}
