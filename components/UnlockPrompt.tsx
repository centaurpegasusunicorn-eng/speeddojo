"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { PRICING } from "@/lib/pricing";

/* Shown once the free belt is earned: an invitation to the full dojo.
   Copy lives in lib/pricing.ts. */
export default function UnlockPrompt({ onClose }: { onClose: () => void }) {
  const ctaRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    ctaRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={PRICING.promptHeadline}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white dark:bg-neutral-900 p-7 text-center shadow-2xl"
      >
        <span className="mx-auto w-14 h-14 rounded-full bg-[#CC1010] text-white flex items-center justify-center">
          <Lock size={24} aria-hidden />
        </span>
        <h2 className="mt-5 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          {PRICING.promptHeadline}
        </h2>
        <p className="mt-2 text-[17px] text-neutral-600 dark:text-neutral-400">{PRICING.promptBody}</p>
        <Link
          ref={ctaRef}
          href="/unlock"
          className="mt-6 inline-flex w-full items-center justify-center rounded-lg px-6 py-3.5 text-lg font-semibold bg-[#CC1010] text-white hover:bg-[#B00D0D] transition"
        >
          {PRICING.promptCta}
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 text-[15px] text-neutral-500 dark:text-neutral-400 hover:underline"
        >
          {PRICING.promptDismiss}
        </button>
      </div>
    </div>
  );
}
