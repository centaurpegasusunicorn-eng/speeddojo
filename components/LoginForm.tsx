"use client";

import { useSearchParams } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import EmailAuth from "@/components/EmailAuth";

/*
 * The sign-in page. There are no passwords: everyone enters their email and
 * gets a sign-in link (new people get an account the same way). Students
 * land here after signing out, or if a sign-in link has expired.
 */
export default function LoginForm() {
  const params = useSearchParams();
  const next = safeNext(params.get("next"));
  const error = params.get("error");
  const signedOut = params.has("signedout");

  return (
    <main className="max-w-sm w-full mx-auto px-4 py-20">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-lg font-medium">{signedOut ? "You're signed out" : "Enter the Dojo"}</h1>
        <ThemeToggle />
      </div>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
        {signedOut
          ? "To come back in, enter your email and we'll send you a link to sign in. Your progress is saved."
          : "Enter your email and we'll send you a link to sign in. New here? The same box creates your free account."}
      </p>
      {error && (
        <p role="alert" className="mb-4 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      <EmailAuth next={next} cta="Email me a sign-in link" size="sm" autoFocus hint="" />
    </main>
  );
}

// Only allow redirects within this site
function safeNext(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}
