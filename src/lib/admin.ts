import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Call at the top of every admin page/layout: sends visitors to the login page, lets only users from table admins in
export async function requireAdmin() {
  const db = await createClient();
  const { data: { user } } = await db.auth.getUser();
  if (!user) redirect("/admin/login");
  const { data: ok } = await db.rpc("is_admin");
  if (!ok) redirect("/admin/login?e=denied");
  return { db, user };
}
