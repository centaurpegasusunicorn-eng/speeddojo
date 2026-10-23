"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import ThemeToggle from "@/components/ThemeToggle";

/* Reached from the "reset your password" email (via /auth/callback, which
   has already signed the student in). They choose a new password here. */
export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) return setError("Those passwords don't match.");
    setError(null);
    setLoading(true);
    const { error } = await createClient().auth.updateUser({ password });
    setLoading(false);
    if (error) return setError(error.message);
    router.push("/dashboard");
    router.refresh();
  }

  const input =
    "w-full border border-neutral-300 dark:border-neutral-700 dark:bg-neutral-950 rounded-md px-3 py-2 text-sm";

  return (
    <main className="max-w-sm w-full mx-auto px-4 py-20">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-lg font-medium">Choose a new password</h1>
        <ThemeToggle />
      </div>
      <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
        At least 6 characters.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="password"
          placeholder="New password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          className={input}
        />
        <input
          type="password"
          placeholder="Confirm new password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={6}
          className={input}
        />
        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 rounded-md py-2 text-sm font-medium disabled:opacity-50"
        >
          {loading ? "Please wait…" : "Save password"}
        </button>
      </form>
    </main>
  );
}
