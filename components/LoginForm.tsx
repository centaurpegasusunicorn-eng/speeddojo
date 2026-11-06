"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "@/components/ThemeToggle";
import EmailAuth from "@/components/EmailAuth";

type Mode = "signin" | "signup" | "forgot";

const COPY: Record<Mode, { sub: string; button: string }> = {
  signin: { sub: "Sign in to continue.", button: "Sign in" },
  signup: { sub: "Create your account.", button: "Create account" },
  forgot: {
    sub: "Enter your email and we'll send you a link to reset your password.",
    button: "Send reset link",
  },
};

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = safeNext(params.get("next"));

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // "Start free" links open straight on the sign-up form
  const initial = params.get("mode");
  const [mode, setMode] = useState<Mode>(
    initial === "signup" || initial === "forgot" ? initial : "signin"
  );
  const [error, setError] = useState<string | null>(params.get("error"));
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function switchMode(m: Mode) {
    setMode(m);
    setError(null);
    setNotice(null);
  }

  // No password (they signed up with just an email): send a sign-in link
  async function sendLink() {
    if (!email) return setError("Enter your email first, then we'll send the link.");
    setError(null);
    setNotice(null);
    setLoading(true);
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setLoading(false);
    if (error) return setError(error.message);
    setNotice("Check your email for a sign-in link.");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const origin = window.location.origin;
    setError(null);
    setNotice(null);
    setLoading(true);

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/reset-password`,
      });
      setLoading(false);
      if (error) return setError(error.message);
      setNotice("Check your email for a link to reset your password.");
      return;
    }

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
        },
      });
      setLoading(false);
      if (error) return setError(error.message);
      if (!data.session) {
        // Email confirmation is on: they need to click the link first
        setNotice(
          "Almost there. We've sent you an email: click the link in it to confirm your account."
        );
        return;
      }
      router.push(next);
      router.refresh();
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError(error.message);
    router.push(next);
    router.refresh();
  }

  if (mode !== "forgot") {
    return (
      <main className="max-w-sm w-full mx-auto px-4 py-20">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-lg font-medium">Enter the Dojo</h1>
          <ThemeToggle />
        </div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
          Enter your email and we&apos;ll send you a sign-in link and code. New here? The same box
          creates your free account.
        </p>
        {error && (
          <p role="alert" className="mb-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <EmailAuth next={next} cta="Email me a sign-in link" size="sm" autoFocus allowPassword hint="" />
      </main>
    );
  }

  // Password reset ("Forgot password?")
  return (
    <main className="max-w-sm w-full mx-auto px-4 py-20">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-lg font-medium">Reset your password</h1>
        <ThemeToggle />
      </div>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">{COPY.forgot.sub}</p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 rounded-md px-3 py-2 text-sm"
        />
        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="text-sm text-green-700 dark:text-green-400">
            {notice}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-md py-2 text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Please wait…" : COPY.forgot.button}
        </button>
      </form>

      <button onClick={() => switchMode("signin")} className="text-sm text-neutral-500 dark:text-neutral-400 underline mt-4">
        Back to sign in
      </button>
    </main>
  );
}

// Only allow redirects within this site
function safeNext(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}
