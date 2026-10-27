import { redirect } from "next/navigation";
import { requireAdminMember } from "@/lib/admin";
import { MfaForm } from "./MfaForm";

export default async function MfaPage() {
  const { db } = await requireAdminMember();
  const { data, error } = await db.auth.mfa.getAuthenticatorAssuranceLevel();
  if (!error && data?.currentLevel === "aal2") redirect("/admin");
  return (
    <main className="grid min-h-screen place-items-center p-5">
      <div className="flex w-full max-w-[460px] flex-col gap-6 rounded-bento border border-line p-6 sm:p-8">
        <h1 className="text-2xl font-medium">Защита входа</h1>
        <MfaForm />
      </div>
    </main>
  );
}
