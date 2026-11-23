
import { AppHeader } from "@/components/AppHeader";
import { requirePageUser } from "@/src/lib/auth/page";
import { getDb } from "@/src/lib/db";
import { IncidentForm } from "./IncidentForm";

// EP-07: Only reporters may access the incident submission page.
// Unauthorized roles receive the same 404 as a nonexistent page.
export default async function NewIncidentPage() {
  const user = await requirePageUser({ roles: ["user"] });
  const categories = await getDb().category.findMany({
  where: { active: true },
  select: {
    id: true,
    name: true,
  },
  orderBy: {
    name: "asc",
  },
});
  return (
    <>
      <AppHeader username={user.username} role={user.role} />

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-6">
        <h1 className="text-2xl font-semibold">Report an Incident</h1>
        <p className="text-sm text-gray-600">
          Submit a new incident for review.
        </p>
        <IncidentForm categories={categories} />
      </main>
    </>
  );
}