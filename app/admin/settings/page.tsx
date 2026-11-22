
import { AppHeader } from "@/components/AppHeader";
import { SettingsAdmin } from "@/components/SettingsAdmin";
import { readAdminSettings } from "@/src/lib/admin/settings";
import { requirePageUser } from "@/src/lib/auth/page";
import { getDb } from "@/src/lib/db";

export default async function SettingsPage() {
  const me = await requirePageUser({ roles: ["admin"] });
  const settings = await readAdminSettings(getDb());

  return (
    <>
      <AppHeader username={me.username} role={me.role} />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
        <h1 className="text-2xl font-semibold">Application Settings</h1>
        <SettingsAdmin initialSettings={settings} />
      </main>
    </>
  );
}
