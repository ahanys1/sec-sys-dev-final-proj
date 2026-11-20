import { AppHeader } from "@/components/AppHeader";
import { requirePageUser } from "@/src/lib/auth/page";

// Signed-in landing page. Incident features arrive in later slices.
export default async function Home() {
  const user = await requirePageUser();
  return (
    <>
      <AppHeader username={user.username} role={user.role} />
      <main className="flex flex-1 items-center justify-center">
        <h1 className="text-3xl font-semibold">Incident Reporting</h1>
      </main>
    </>
  );
}
