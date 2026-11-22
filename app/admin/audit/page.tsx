
import { AppHeader } from "@/components/AppHeader";
import { requirePageUser } from "@/src/lib/auth/page";
import { AuditHistory } from "./AuditHistory";
import { AUDIT_ACTIONS } from "@/src/lib/audit";

export default async function AuditPage() {
  const me = await requirePageUser({ roles: ["admin"] });

  return (
    <>
      <AppHeader username={me.username} role={me.role} />

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 p-6">
        <h1 className="text-2xl font-semibold">Audit History</h1>
        <AuditHistory actions={[...AUDIT_ACTIONS]} />
      </main>
    </>
  );
}
