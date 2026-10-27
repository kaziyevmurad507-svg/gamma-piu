import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Membership is separate from MFA so an administrator can enroll a factor.
export async function requireAdminMember() {
  const db = await createClient();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) redirect("/admin/login");
  const { data: ok, error: accessError } = await db.rpc("is_admin_member");
  if (accessError || !ok) redirect("/admin/login?e=denied");
  return { db, user };
}

// Every protected page and mutation checks the second factor; RLS checks it too.
export async function requireAdmin() {
  const admin = await requireAdminMember();
  const { data, error } = await admin.db.auth.mfa.getAuthenticatorAssuranceLevel();
  if (error || data?.currentLevel !== "aal2") redirect("/admin/mfa");
  const { data: allowed, error: accessError } = await admin.db.rpc("is_admin");
  if (accessError || !allowed) redirect("/admin/login?e=denied");
  return admin;
}
