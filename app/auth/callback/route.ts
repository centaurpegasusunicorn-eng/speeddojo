import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/*
 * Where the links in Supabase's emails land: "confirm your email" after
 * sign-up, and "reset your password". Signs the student in, then sends them
 * on to `next` (the dashboard by default, /reset-password for resets).
 *
 * Handles both link styles Supabase can send:
 *  - ?code=...                     (the default)
 *  - ?token_hash=...&type=...      (if you customise the email templates)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(searchParams.get("next"));

  const supabase = await createClient();
  let error: { message: string } | null = null;

  if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else if (tokenHash && type) {
    ({ error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type }));
  } else {
    error = { message: "This link is missing its sign-in code." };
  }

  if (error) {
    const url = new URL("/login", origin);
    url.searchParams.set(
      "error",
      "That link has expired or was already used. Please try again."
    );
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(new URL(next, origin));
}

// Only allow redirects within this site
function safeNext(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}
