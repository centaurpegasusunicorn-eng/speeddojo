"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

/*
 * Sign-up on the homepage: just an email. We send a link that signs them
 * straight in (no password needed; they can set one later in My Dojo).
 *   next: where the link takes them (default /dashboard, which sends new
 *         students to the welcome)
 *   row:  email and button side by side on wider screens
 */
export default function SignUpForm({
  next = "/dashboard",
  row = false,
  cta = "Start free",
  autoFocus = false,
  dark = false,
  placeholder = "Your email",
}: {
  next?: string;
  row?: boolean;
  cta?: string;
  autoFocus?: boolean;
  /** white-on-dark styling, for dark sections */
  dark?: boolean;
  placeholder?: string;
}) {
  const uid = useId(); // unique field ids, so several forms can share a page
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const origin = window.location.origin;
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setLoading(false);
    if (error) return setError(error.message);
    setSent(true);
  }

  if (sent) {
    return (
      <div className={`rounded-xl px-5 py-4 text-left ${dark ? "bg-white/10" : "bg-neutral-100 dark:bg-neutral-900"}`} role="status">
        <p className="text-lg font-semibold">Check your email</p>
        <p className={`mt-1 text-[15px] ${dark ? "text-white/70" : "text-neutral-600 dark:text-neutral-400"}`}>
          We&apos;ve sent a link to {email}. Open it on this device and you&apos;ll go straight in.
        </p>
      </div>
    );
  }

  const field = `w-full rounded-xl px-4 py-3.5 text-[16px] outline-none border focus-visible:ring-2 focus-visible:ring-[#CC1010] ${
    dark
      ? "bg-white/10 border-white/20 text-white placeholder:text-white/50"
      : "bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 placeholder:text-neutral-400"
  }`;

  return (
    <form onSubmit={submit} className="w-full">
      <div className={row ? "flex flex-col sm:flex-row gap-2.5" : "flex flex-col gap-2.5"}>
        <label className="sr-only" htmlFor={`${uid}-email`}>Email</label>
        <input
          id={`${uid}-email`}
          type="email"
          required
          autoComplete="email"
          placeholder={placeholder}
          autoFocus={autoFocus}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={field}
        />
        <button
          type="submit"
          disabled={loading}
          className="shrink-0 rounded-xl px-7 py-3.5 text-lg font-bold bg-[#CC1010] text-white hover:bg-[#B00D0D] active:scale-[0.98] transition disabled:opacity-60"
        >
          {loading ? "Sending…" : cta}
        </button>
      </div>
      {error && <p className="mt-2 text-[15px] text-[#E5484D] text-left">{error}</p>}
      <p className={`mt-3 text-[14px] ${dark ? "text-white/60" : "text-neutral-500 dark:text-neutral-400"}`}>
        Already have an account?{" "}
        <Link href="/login" className="underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
