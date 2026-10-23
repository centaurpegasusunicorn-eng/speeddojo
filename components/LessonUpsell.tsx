"use client";

import Link from "next/link";
import { Video } from "lucide-react";

/*
 * "Book a lesson" upsell, shown at the bottom of the Now Training card.
 * Opens the lesson sales page (/lessons), which knows which exercise the
 * student came from. Lesson price, links and sales copy: lib/lessons.ts
 */

// ─── COPY ──────────────────────────────────────────────────────────────────
const HEADING = "Stuck on this one?";
const BODY = "Book a 1:1 online lesson and get live feedback on your playing.";
const BUTTON = "Book a lesson";
// ───────────────────────────────────────────────────────────────────────────

export default function LessonUpsell({ exerciseId }: { exerciseId?: string }) {
  const href = exerciseId
    ? `/lessons?exercise=${encodeURIComponent(exerciseId)}`
    : "/lessons";

  return (
    <div className="mt-5 pt-4 border-t border-neutral-300 dark:border-neutral-700 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
      <div>
        <p className="text-[18px] font-semibold text-neutral-900 dark:text-neutral-100">
          {HEADING}
        </p>
        <p className="text-[16px] text-neutral-600 dark:text-neutral-400">{BODY}</p>
      </div>

      <Link
        href={href}
        className="inline-flex items-center gap-2 shrink-0 rounded-lg px-4 py-2.5 text-[15px] font-semibold bg-[#CC1010] text-white hover:bg-[#B00D0D] active:scale-[0.98] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CC1010]"
      >
        <Video size={18} aria-hidden />
        {BUTTON}
      </Link>
    </div>
  );
}
