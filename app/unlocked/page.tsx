import Link from "next/link";
import { PartyPopper } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { BRAND } from "@/lib/brand";
import { PRICING } from "@/lib/pricing";
import { getAccess, recordCheckout } from "@/lib/access";
import { paymentsOn, stripe } from "@/lib/stripe";
import { EXERCISES } from "@/lib/mockData";

/*
 * Where Stripe sends students after paying. Checks the payment with Stripe
 * directly, so access is instant even if the webhook is a few seconds behind.
 */
export default async function UnlockedPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { session_id } = await searchParams;
  const access = await getAccess();
  let confirmed = access.member && access.paywall;

  if (!confirmed && paymentsOn() && typeof session_id === "string" && access.userId) {
    try {
      const session = await stripe().checkout.sessions.retrieve(session_id);
      if (session.client_reference_id === access.userId && session.payment_status !== "unpaid") {
        await recordCheckout(session);
        confirmed = true;
      }
    } catch (err) {
      console.error("Couldn't confirm checkout:", err);
    }
  }

  const next = EXERCISES[Math.min(PRICING.FREE_EXERCISES, EXERCISES.length - 1)];

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

      <div className="max-w-xl mx-auto pt-16 text-center">
        {confirmed ? (
          <>
            <span className="mx-auto w-16 h-16 rounded-full bg-[#CC1010] text-white flex items-center justify-center">
              <PartyPopper size={30} aria-hidden />
            </span>
            <h1 className="mt-6 text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              {PRICING.unlockedHeadline}
            </h1>
            <p className="mt-3 text-lg text-neutral-600 dark:text-neutral-400">
              {PRICING.unlockedBody}
            </p>
            <Link
              href={`/practice/${next.id}`}
              className="mt-8 inline-flex items-center justify-center rounded-lg px-7 py-3.5 text-lg font-semibold bg-[#CC1010] text-white hover:bg-[#B00D0D] active:scale-[0.98] transition"
            >
              {PRICING.unlockedCta}
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Confirming your payment…
            </h1>
            <p className="mt-3 text-lg text-neutral-600 dark:text-neutral-400">
              This usually takes a few seconds. Refresh the page in a moment. If
              it still hasn&apos;t come through, get in touch and we&apos;ll sort it out.
            </p>
            <Link href="/unlock" className="mt-6 inline-block text-[15px] text-neutral-500 dark:text-neutral-400 underline">
              Back
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
