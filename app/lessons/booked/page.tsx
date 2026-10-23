import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { LESSON } from "@/lib/lessons";
import { BRAND } from "@/lib/brand";
import { paymentsOn, stripe } from "@/lib/stripe";

/*
 * Where Stripe sends students after they pay for a lesson. Copy lives in
 * lib/lessons.ts.
 *
 * Once Stripe is set up, the booking button only appears after a real,
 * paid lesson checkout. For that, the lesson Payment Link's confirmation
 * page must redirect to:
 *   https://<your site>/lessons/booked?session_id={CHECKOUT_SESSION_ID}
 */
export default async function LessonBookedPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { session_id } = await searchParams;
  const paid = await lessonPaid(session_id);
  const ready = LESSON.BOOKING_URL !== "" && paid;

  return (
    <main className="w-full px-4 sm:px-8 pb-16">
      <header className="h-20 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-xl tracking-[0.3em] text-neutral-800 dark:text-neutral-200 font-light"
        >
          {BRAND.name.toUpperCase()}
        </Link>
        <ThemeToggle />
      </header>

      <div className="max-w-xl mx-auto pt-16 text-center">
        <span className="mx-auto w-16 h-16 rounded-full bg-[#CC1010] text-white flex items-center justify-center">
          <CalendarCheck size={30} aria-hidden />
        </span>
        <h1 className="mt-6 text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          {LESSON.bookedHeadline}
        </h1>
        <p className="mt-3 text-lg text-neutral-600 dark:text-neutral-400">
          {LESSON.bookedBody}
        </p>

        {ready ? (
          <a
            href={LESSON.BOOKING_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center justify-center rounded-lg px-7 py-3.5 text-lg font-semibold bg-[#CC1010] text-white hover:bg-[#B00D0D] active:scale-[0.98] transition"
          >
            {LESSON.bookedCta}
          </a>
        ) : (
          <span
            aria-disabled="true"
            title="Add your booking link in lib/lessons.ts"
            className="mt-8 inline-flex items-center justify-center rounded-lg px-7 py-3.5 text-lg font-semibold bg-[#CC1010] text-white opacity-50 cursor-not-allowed"
          >
            {LESSON.bookedCta}
          </span>
        )}

        {!paid && (
          <p className="mt-3 text-[15px] text-neutral-500 dark:text-neutral-400">
            We couldn&apos;t find your lesson payment. If you&apos;ve just paid,
            use the link from your Stripe receipt email or get in touch.
          </p>
        )}

        <p className="mt-6">
          <Link
            href="/dashboard"
            className="text-[15px] text-neutral-500 dark:text-neutral-400 underline"
          >
            Back to the dojo
          </Link>
        </p>
      </div>
    </main>
  );
}

// A paid checkout from a Payment Link (lessons), made in the last 30 days
async function lessonPaid(sessionId: string | string[] | undefined) {
  if (!paymentsOn()) return true; // not set up yet: don't block the page
  if (typeof sessionId !== "string" || !sessionId.startsWith("cs_")) return false;
  try {
    const s = await stripe().checkout.sessions.retrieve(sessionId);
    const recent = Date.now() / 1000 - s.created < 30 * 86_400;
    return s.payment_status === "paid" && !!s.payment_link && recent;
  } catch {
    return false;
  }
}
