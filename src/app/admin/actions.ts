"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Returns an error text (shown under the form) or goes to the dashboard
export async function signIn(_prev: string | null, form: FormData) {
  const db = await createClient();
  const { error } = await db.auth.signInWithPassword({ email: String(form.get("email") ?? "").trim(), password: String(form.get("password") ?? "") });
  if (error) return "Неверный email или пароль";
  redirect("/admin");
}

export async function signOut() {
  const db = await createClient();
  await db.auth.signOut();
  redirect("/admin/login");
}
