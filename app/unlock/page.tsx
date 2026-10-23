import Link from "next/link";
import { ArrowLeft, Check, Lock } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { BRAND } from "@/lib/brand";
import { PRICING } from "@/lib/pricing";
import { getAccess } from "@/lib/access";
import { priceLabel } from "@/lib/stripe";

/* The Full Dojo sales page, or membership details for students who've paid.
   Copy lives in lib/pricing.ts; the price comes from Stripe. */
export default async function UnlockPage() {
  const [access, price] = await Promise.all([getAccess(), priceLabel()]);
  const ready = access.paywall && !!price;
  const until = access.accessUntil
    ? new Date(access.accessUntil).toLocaleDateString("en-US", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <main className="w-full px-4 sm:px-8 pb-16">
      <header className="h-20 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-lg sm:text-xl tracking-[0.25em] sm:tracking-[0.3em] text-neutral-800 dark:text-neutral-200 font-light"
        >
          {BRAND.name.toUpperCase()}
        </Link>
        <ThemeToggle />
      </header>

      <div className="max-w-3xl mx-auto pt-6">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-[15px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          <ArrowLeft size={16} aria-hidden />
          Back to practice
        </Link>

        {access.paywall && access.member ? (
          <section className="mt-10">
            <p className="text-[15px] tracking-[0.2em] uppercase text-[#CC1010]">
              Your membership
            </p>
            <h1 className="mt-2 text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              All 12 belts are unlocked
            </h1>
            {until && (
              <p className="mt-3 text-lg text-neutral-600 dark:text-neutral-400">
                {access.recurring ? "Renews" : "Full access until"} {until}.
              </p>
            )}
            {access.customerId && (
              <form action="/api/billing-portal" method="post" className="mt-8">
                <button className="rounded-lg px-6 py-3 text-[17px] font-semibold border border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition">
                  Manage billing and receipts
                </button>
              </form>
            )}
          </section>
        ) : (
          <>
            <p className="mt-8 text-[15px] tracking-[0.2em] uppercase text-[#CC1010]">
              {PRICING.eyebrow}
            </p>
            <h1 className="mt-2 text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              {PRICING.headline}
            </h1>
            <p className="mt-4 text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl">
              {PRICING.intro}
            </p>

            <ul className="mt-10 space-y-5">
              {PRICING.benefits.map((b) => (
                <li key={b.title} className="flex gap-4">
                  <span className="mt-0.5 w-7 h-7 shrink-0 rounded-full bg-[#CC1010] text-white flex items-center justify-center">
                    <Check size={16} strokeWidth={3} aria-hidden />
                  </span>
                  <div>
                    <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">{b.title}</p>
                    <p className="text-[17px] text-neutral-600 dark:text-neutral-400">{b.body}</p>
                  </div>
                </li>
              ))}
            </ul>

            <section className="mt-10 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <p className="text-4xl font-bold text-neutral-900 dark:text-neutral-100">
                  {price?.text ?? PRICING.priceFallback}
                </p>
                {price && (
                  <p className="mt-1 text-[17px] text-neutral-600 dark:text-neutral-400">
                    {price.recurring ? PRICING.recurringNote : PRICING.oneOffNote}
                  </p>
                )}
              </div>
              <div className="md:text-right">
                {ready ? (
                  <form action="/api/checkout" method="post">
                    <button className="inline-flex items-center justify-center rounded-lg px-7 py-3.5 text-lg font-semibold bg-[#CC1010] text-white hover:bg-[#B00D0D] active:scale-[0.98] transition w-full md:w-auto">
                      {PRICING.cta}
                    </button>
                  </form>
                ) : (
                  <span
                    aria-disabled="true"
                    className="inline-flex items-center justify-center rounded-lg px-7 py-3.5 text-lg font-semibold bg-[#CC1010] text-white opacity-50 cursor-not-allowed w-full md:w-auto"
                  >
                    {PRICING.cta}
                  </span>
                )}
                <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400">
                  <Lock size={13} aria-hidden />
                  {ready ? PRICING.ctaNote : "Payments not set up yet"}
                </p>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
