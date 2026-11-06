"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import EmailAuth from "@/components/EmailAuth";

/*
 * "Sign in" in the homepage top bar: opens a small panel right under it with
 * the same email sign-in as everywhere else (link or code, or a password if
 * they've set one). No trip to another page.
 */
export default function NavSignIn({ label = "Sign in" }: { label?: string }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div ref={panelRef} className="sm:relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="px-2 text-[15px] font-medium hover:underline"
      >
        {label}
      </button>
      {open && (
        <div
          role="dialog"
          aria-label="Sign in"
          className="absolute z-40 left-0 right-0 top-20 sm:top-full sm:left-auto sm:right-0 sm:mt-3 sm:w-[380px] px-4 py-5 sm:p-5 bg-white dark:bg-neutral-950 border-y sm:border sm:rounded-2xl border-neutral-200 dark:border-neutral-800 shadow-xl text-neutral-900 dark:text-neutral-100"
          style={{ animation: "buRise 0.2s ease-out both" }}
        >
          <div className="flex items-center justify-between mb-3">
            <p className="text-lg font-bold">Sign in</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-500 hover:bg-neutral-100 dark:hover:bg-neutral-900"
            >
              <X size={18} />
            </button>
          </div>
          <EmailAuth size="sm" cta="Email me a sign-in link" autoFocus allowPassword hint="We'll email you a link and a code." />
        </div>
      )}
    </div>
  );
}
