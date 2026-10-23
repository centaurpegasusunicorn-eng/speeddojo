import Link from "next/link";
import { ArrowLeft, Check, Lock, Video } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { LESSON } from "@/lib/lessons";
import { getExercise } from "@/lib/mockData";
import { BRAND } from "@/lib/brand";

/* Sales page for a paid 1:1 lesson. Copy and links live in lib/lessons.ts. */
export default async function LessonsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { exercise: exerciseId } = await searchParams;
  const exercise =
    typeof exerciseId === "string" ? getExercise(exerciseId) : undefined;
  const intro = exercise
    ? LESSON.intro.replace("{exercise}", exercise.name)
    : LESSON.introNoExercise;
  const backHref = exercise ? `/practice/${exercise.id}` : "/dashboard";
  const ready = LESSON.STRIPE_PAYMENT_LINK !== "";

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

      <div className="max-w-3xl mx-auto pt-6">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-[15px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          <ArrowLeft size={16} aria-hidden />
          Back to practice
        </Link>

        <p className="mt-8 text-[15px] tracking-[0.2em] uppercase text-[#CC1010]">
          {LESSON.eyebrow}
        </p>
        <h1 className="mt-2 text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          {LESSON.headline}
        </h1>
        <p className="mt-4 text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl">
          {intro}
        </p>

        <ul className="mt-10 space-y-5">
          {LESSON.benefits.map((b) => (
            <li key={b.title} className="flex gap-4">
              <span className="mt-0.5 w-7 h-7 shrink-0 rounded-full bg-[#CC1010] text-white flex items-center justify-center">
                <Check size={16} strokeWidth={3} aria-hidden />
              </span>
              <div>
                <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {b.title}
                </p>
                <p className="text-[17px] text-neutral-600 dark:text-neutral-400">
                  {b.body}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <ol className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {LESSON.steps.map((s, i) => (
            <li
              key={s}
              className="rounded-xl bg-neutral-100 dark:bg-neutral-900 px-4 py-3"
            >
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                Step {i + 1}
              </span>
              <p className="text-[17px] font-medium text-neutral-900 dark:text-neutral-100">
                {s}
              </p>
            </li>
          ))}
        </ol>

        <section className="mt-10 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="shrink-0">
            <p className="text-4xl font-bold text-neutral-900 dark:text-neutral-100">
              {LESSON.price}
            </p>
            <p className="mt-1 flex items-center gap-2 whitespace-nowrap text-[17px] text-neutral-600 dark:text-neutral-400">
              <Video size={18} aria-hidden />
              {LESSON.length} · live video call
            </p>
          </div>

          <div className="md:text-right">
            {ready ? (
              <a
                href={LESSON.STRIPE_PAYMENT_LINK}
                className="inline-flex items-center justify-center rounded-lg px-7 py-3.5 text-lg font-semibold bg-[#CC1010] text-white hover:bg-[#B00D0D] active:scale-[0.98] transition w-full md:w-auto"
              >
                {LESSON.cta}
              </a>
            ) : (
              <span
                aria-disabled="true"
                title="Add your Stripe Payment Link in lib/lessons.ts"
                className="inline-flex items-center justify-center rounded-lg px-7 py-3.5 text-lg font-semibold bg-[#CC1010] text-white opacity-50 cursor-not-allowed w-full md:w-auto"
              >
                {LESSON.cta}
              </span>
            )}
            <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400">
              <Lock size={13} aria-hidden />
              {ready ? LESSON.ctaNote : "Payment link not set up yet"}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
