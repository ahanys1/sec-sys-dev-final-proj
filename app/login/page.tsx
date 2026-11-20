import { redirect } from "next/navigation";
import { currentUser } from "@/src/lib/auth/page";
import { getDb } from "@/src/lib/db";
import { getSettings } from "@/src/lib/auth/settings";
import { LoginForm } from "./LoginForm";

// EP-01: public. The admin status message is rendered as plain text only (T-22, V3.2.2).
export default async function LoginPage() {
  if (await currentUser()) redirect("/");
  const statusMessage = (await getSettings(getDb()).catch(() => null))?.statusMessage ?? "";
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-semibold">Incident Reporting</h1>
      {statusMessage ? <p role="status">{statusMessage}</p> : null}
      <LoginForm />
    </main>
  );
}
