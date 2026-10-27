import "server-only";
import { createClient } from "@supabase/supabase-js";
import { STOREFRONT_REVALIDATE, STOREFRONT_TAG } from "../storefront-cache";

// Never reads a visitor's cookies or reuses an administrator's session.
// Cart verification deliberately bypasses the storefront cache.
export function createPublicClient({ fresh = false }: { fresh?: boolean } = {}) {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: {
        fetch: (input, init) => fetch(input, {
          ...init,
          ...(fresh ? { cache: "no-store" as const } : {
            cache: "force-cache" as const,
            next: { revalidate: STOREFRONT_REVALIDATE, tags: [STOREFRONT_TAG] },
          }),
        }),
      },
    },
  );
}
