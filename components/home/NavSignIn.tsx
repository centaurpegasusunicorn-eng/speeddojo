"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/*
 * "Sign in" in the homepage top bar. Clicking it slides the email and
 * password fields open right in the bar (on phones, a panel just under it),
 * so returning students sign in without leaving the page.
 */
export default function NavSignIn({ label = "Sign in" }: { label?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    emailRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError(error.message);
    router.push("/dashboard");
    router.refresh();
  }

  const field =
    "w-full rounded-lg px-3.5 py-2.5 text-[15px] outline-none border bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 placeholder:text-neutral-400 focus-visible:ring-2 focus-visible:ring-[#CC1010]";

  return (
    <>
      {!open && (
        <button type="button" onClick={() => setOpen(true)} className="px-2 text-[15px] font-medium hover:underline">
          {label}
        </button>
      )}

      {open && (
        <form
          onSubmit={submit}
          aria-label="Sign in"
          // phones: a panel under the bar; wider screens: inline in the bar
          className="absolute lg:static left-0 right-0 top-20 lg:top-auto z-40 px-4 lg:px-0 py-4 lg:py-0 bg-white dark:bg-black lg:bg-transparent lg:dark:bg-transparent border-b lg:border-0 border-neutral-200 dark:border-neutral-800 shadow-lg lg:shadow-none"
          style={{ animation: "navSignIn 0.25s ease-out both" }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center gap-2">
            <input
              ref={emailRef}
              type="email"
              required
              autoComplete="email"
              placeholder="Email"
              aria-label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`${field} lg:w-52`}
            />
            <input
              type="password"
              required
              autoComplete="current-password"
              placeholder="Password"
              aria-label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${field} lg:w-40`}
            />
            <div className="flex items-center gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 lg:flex-none rounded-lg px-4 py-2.5 text-[15px] font-semibold bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:opacity-90 disabled:opacity-60 transition"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          <div className="mt-2 lg:mt-0 lg:absolute lg:translate-y-1.5 flex gap-4 text-[13px] text-neutral-500 dark:text-neutral-400">
            {error && <span className="text-[#E5484D]">{error}</span>}
            <Link href="/login?mode=forgot" className="hover:underline">
              Forgot password?
            </Link>
          </div>
        </form>
      )}
    </>
  );
}
