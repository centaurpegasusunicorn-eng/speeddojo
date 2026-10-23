"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "@/components/ThemeToggle";

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
  const [mode, setMode] = useState<Mode>("signin");
  const [error, setError] = useState<string | null>(params.get("error"));
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function switchMode(m: Mode) {
    setMode(m);
    setError(null);
    setNotice(null);
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

  return (
    <main className="max-w-sm w-full mx-auto px-4 py-20">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-lg font-medium">
          {mode === "forgot" ? "Reset your password" : "Enter the Dojo"}
        </h1>
        <ThemeToggle />
      </div>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
        {COPY[mode].sub}
      </p>

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
        {mode !== "forgot" && (
          <input
            type="password"
            placeholder="Password"
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 rounded-md px-3 py-2 text-sm"
          />
        )}

        {mode === "signin" && (
          <button
            type="button"
            onClick={() => switchMode("forgot")}
            className="text-sm text-neutral-500 dark:text-neutral-400 underline"
          >
            Forgot password?
          </button>
        )}

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
          {loading ? "Please wait…" : COPY[mode].button}
        </button>
      </form>

      <button
        onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
        className="text-sm text-neutral-500 dark:text-neutral-400 underline mt-4"
      >
        {mode === "signin"
          ? "Need an account? Sign up"
          : "Already have an account? Sign in"}
      </button>
    </main>
  );
}

// Only allow redirects within this site
function safeNext(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return "/dashboard";
  return next;
}
