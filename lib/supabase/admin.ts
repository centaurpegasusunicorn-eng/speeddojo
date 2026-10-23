import "server-only";
import { createClient } from "@supabase/supabase-js";

/*
 * Supabase with full access, for the server only. Used to record payments,
 * which students themselves aren't allowed to write.
 * Needs SUPABASE_SERVICE_ROLE_KEY in Vercel (Supabase: Project Settings >
 * API Keys > service_role / secret). Never put this key in the browser.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
