import { AppHeader } from "@/components/AppHeader";
import { requirePageUser } from "@/src/lib/auth/page";
import { PasswordForm } from "./PasswordForm";

// EP-06: reachable while a temporary password is pending (C-11).
export default async function PasswordPage() {
  const user = await requirePageUser({ allowPasswordChange: true });
  return (
    <>
      <AppHeader username={user.username} role={user.role} />
      <main className="mx-auto flex w-96 flex-1 flex-col justify-center gap-4">
        <h1 className="text-2xl font-semibold">Change password</h1>
        {user.mustChangePassword ? <p role="status">You must choose a new password before continuing.</p> : null}
        <PasswordForm />
      </main>
    </>
  );
}
