"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/*
 * ONE way in, for everyone: type your email, we send a sign-in email.
 * New people get an account, returning students are signed in. The email has
 * a link AND a 6-digit code, so it works even when the email is opened on a
 * different device (type the code here instead of clicking).
 * Students who've set a password can use it instead ("Use a password").
 *
 * For the code to appear, the Supabase email templates ("Magic Link" and
 * "Confirm signup") need {{ .Token }} in them. See the build notes.
 */

type Step = "email" | "code" | "password";

// true once the sign-in emails include the 6-digit code ({{ .Token }})
const SHOW_CODE = false;

export default function EmailAuth({
  next = "/dashboard",
  cta = "Start free",
  row = false,
  autoFocus = false,
  dark = false,
  size = "lg",
  allowPassword = false,
  placeholder = "Your email",
  hint,
}: {
  next?: string;
  cta?: string;
  /** email and button side by side on wider screens */
  row?: boolean;
  autoFocus?: boolean;
  /** white-on-dark styling */
  dark?: boolean;
  size?: "lg" | "sm";
  /** offer "Use a password instead" */
  allowPassword?: boolean;
  placeholder?: string;
  /** small line under the form (default: works for new and returning) */
  hint?: React.ReactNode;
}) {
  const router = useRouter();
  const uid = useId();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // The code box only shows when asked for, until the sign-in emails include
  // a code (needs custom email templates). Set SHOW_CODE true once they do.
  const [codeOpen, setCodeOpen] = useState(SHOW_CODE);
  const codeRef = useRef<HTMLInputElement>(null);
  const passRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (step === "code" && codeOpen) codeRef.current?.focus();
    if (step === "password") passRef.current?.focus();
  }, [step, codeOpen]);

  const go = () => {
    router.push(next);
    router.refresh();
  };

  async function sendEmail(e?: React.FormEvent) {
    e?.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await createClient().auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    setLoading(false);
    if (error) return setError(error.message);
    setStep("code");
  }

  async function checkCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await createClient().auth.verifyOtp({ email, token: code.trim(), type: "email" });
    setLoading(false);
    if (error) return setError("That code didn't work. Check it, or use the link in the email.");
    go();
  }

  async function usePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await createClient().auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError(error.message);
    go();
  }

  const sm = size === "sm";
  const field = `w-full rounded-xl ${sm ? "px-3.5 py-2.5 text-[15px]" : "px-4 py-3.5 text-[16px]"} outline-none border focus-visible:ring-2 focus-visible:ring-[#CC1010] ${
    dark
      ? "bg-white/10 border-white/20 text-white placeholder:text-white/50"
      : "bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700 placeholder:text-neutral-400"
  }`;
  const button = `shrink-0 rounded-xl ${sm ? "px-4 py-2.5 text-[15px]" : "px-7 py-3.5 text-lg"} font-bold bg-[#CC1010] text-white hover:bg-[#B00D0D] active:scale-[0.98] transition disabled:opacity-60`;
  const muted = dark ? "text-white/60" : "text-neutral-500 dark:text-neutral-400";
  const link = "underline hover:no-underline";
  const layout = row ? "flex flex-col sm:flex-row gap-2.5" : "flex flex-col gap-2.5";

  if (step === "code") {
    return (
      <form onSubmit={checkCode} className="w-full text-left" style={{ animation: "buRise 0.3s ease-out both" }}>
        <p className={`${sm ? "text-[15px]" : "text-lg"} font-semibold`}>Check your email</p>
        <p className={`mt-1 ${sm ? "text-[14px]" : "text-[15px]"} ${dark ? "text-white/70" : "text-neutral-600 dark:text-neutral-400"}`}>
          {codeOpen
            ? <>We&apos;ve sent an email to {email}. Click the link in it, or type the code from it here:</>
            : <>We&apos;ve sent a sign-in link to {email}. Open it on this device and you&apos;ll go straight in.</>}
        </p>
        {codeOpen && (
        <div className={`mt-3 ${layout}`}>
          <label className="sr-only" htmlFor={`${uid}-code`}>Code from the email</label>
          <input
            ref={codeRef}
            id={`${uid}-code`}
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={10}
            required
            placeholder="6-digit code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className={`${field} tracking-[0.3em]`}
          />
          <button type="submit" disabled={loading} className={button}>
            {loading ? "Checking…" : "Sign in"}
          </button>
        </div>
        )}
        {error && <p className="mt-2 text-[14px] text-[#E5484D]">{error}</p>}
        <p className={`mt-3 text-[14px] ${muted} flex flex-wrap gap-x-4 gap-y-1`}>
          {!codeOpen && (
            <button type="button" className={link} onClick={() => setCodeOpen(true)}>
              Got a code?
            </button>
          )}
          <button type="button" className={link} onClick={() => sendEmail()}>
            Send it again
          </button>
          <button type="button" className={link} onClick={() => { setStep("email"); setCode(""); setError(null); }}>
            Use a different email
          </button>
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={step === "password" ? usePassword : sendEmail} className="w-full text-left">
      <div className={layout}>
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
        {step === "password" && (
          <>
            <label className="sr-only" htmlFor={`${uid}-pass`}>Password</label>
            <input
              ref={passRef}
              id={`${uid}-pass`}
              type="password"
              required
              autoComplete="current-password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={field}
            />
          </>
        )}
        <button type="submit" disabled={loading} className={button}>
          {loading ? "Sending…" : step === "password" ? "Sign in" : cta}
        </button>
      </div>
      {error && <p className="mt-2 text-[14px] text-[#E5484D]">{error}</p>}
      <p className={`mt-3 text-[14px] ${muted} flex flex-wrap gap-x-4 gap-y-1`}>
        {step === "password" ? (
          <>
            <button type="button" className={link} onClick={() => { setStep("email"); setError(null); }}>
              Email me a sign-in link instead
            </button>
            <Link href="/login?mode=forgot" className={link}>
              Forgot password?
            </Link>
          </>
        ) : (
          <>
            {(hint ?? "New or returning, we'll email you a sign-in link.") && (
              <span>{hint ?? "New or returning, we'll email you a sign-in link."}</span>
            )}
            {allowPassword && (
              <button type="button" className={link} onClick={() => { setStep("password"); setError(null); }}>
                Use a password instead
              </button>
            )}
          </>
        )}
      </p>
    </form>
  );
}
