"use client";

import Link from "next/link";
import { BELTS, textOn, type PathState } from "@/lib/belts";

type Item = { id: string };

/**
 * The 12-step path. Each button is named after its belt colour:
 *  - completed: filled with the belt colour
 *  - the open exercise: white with a dark outline
 *  - locked: greyed out and not clickable
 * The exercise you're currently on gets an extra ring.
 */
export default function ExerciseMenu({
  exercises,
  path,
  currentId,
}: {
  exercises: Item[];
  path: PathState;
  currentId?: string;
}) {
  return (
    <div className="flex gap-2 flex-wrap">
      {exercises.map((ex, i) => {
        const belt = BELTS[Math.min(i, BELTS.length - 1)];
        const completed = path.progress[i]?.completed ?? false;
        const unlocked = i <= path.currentIndex;
        const selected = ex.id === currentId;
        const base = "text-sm px-4 py-2 rounded-full border";

        if (!unlocked) {
          return (
            <span
              key={ex.id}
              aria-disabled="true"
              title="Complete the previous exercise to unlock"
              className={`${base} border-neutral-200 bg-neutral-100 text-neutral-400 dark:border-[#4D4D4D] dark:bg-[#3D3D3D] dark:text-[#8A8A8A] cursor-not-allowed select-none`}
            >
              {belt.name}
            </span>
          );
        }

        return (
          <Link
            key={ex.id}
            href={`/practice/${ex.id}`}
            style={
              completed
                ? { backgroundColor: belt.color, color: textOn(belt.color) }
                : undefined
            }
            className={`${base} ${
              completed
                ? "border-black/15 dark:border-white/25"
                : "bg-background border-neutral-900 text-neutral-900 dark:border-neutral-100 dark:text-neutral-100"
            } ${selected ? "ring-2 ring-neutral-900 ring-offset-2 ring-offset-background dark:ring-neutral-100" : ""}`}
          >
            {belt.name}
          </Link>
        );
      })}
    </div>
  );
}
