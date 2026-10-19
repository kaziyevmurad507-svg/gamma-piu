import { createBrowserClient } from "@supabase/ssr";

// Supabase client for the browser (used for photo uploads, it reuses the admin's login)
export const createClient = () => createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
