"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { PRICING } from "@/lib/pricing";

/*
 * Fills the video space on a locked belt: the offer and a buy button that
 * goes straight to Stripe. Copy lives in lib/pricing.ts.
 */
export default function UnlockPanel({
  price,
}: {
  price: { text: string; recurring: boolean } | null;
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-neutral-100 dark:bg-neutral-900 px-5 text-center cursor-default">
      <span className="hidden sm:flex w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-[#CC1010] text-white items-center justify-center">
        <Lock size={22} aria-hidden />
      </span>
      <p className="sm:mt-4 text-xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
        {PRICING.panelHeadline}
      </p>
      <p className="hidden sm:block mt-2 max-w-lg text-[16px] lg:text-lg text-neutral-600 dark:text-neutral-400">
        {PRICING.panelBody}
      </p>

      {price ? (
        <form action="/api/checkout" method="post" className="mt-3 sm:mt-6">
          <button className="rounded-lg px-6 py-2.5 sm:px-7 sm:py-3.5 text-[16px] sm:text-lg font-semibold bg-[#CC1010] text-white hover:bg-[#B00D0D] active:scale-[0.98] transition">
            {PRICING.cta} · {price.text}
          </button>
        </form>
      ) : (
        <Link
          href="/unlock"
          className="mt-3 sm:mt-6 rounded-lg px-6 py-2.5 sm:px-7 sm:py-3.5 text-[16px] sm:text-lg font-semibold bg-[#CC1010] text-white"
        >
          {PRICING.cta}
        </Link>
      )}

      <p className="mt-2 sm:mt-3 text-[13px] sm:text-sm text-neutral-500 dark:text-neutral-400">
        {price && (price.recurring ? PRICING.recurringNote : PRICING.oneOffNote)}{" "}
        <Link href="/unlock" className="underline whitespace-nowrap">
          {PRICING.panelMore}
        </Link>
      </p>
    </div>
  );
}
