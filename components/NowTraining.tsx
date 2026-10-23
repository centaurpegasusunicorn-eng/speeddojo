"use client";

import {
  BELTS,
  REPS_TO_COMPLETE,
  type Belt,
  type ExerciseProgress,
  type PathState,
} from "@/lib/belts";
import LessonUpsell from "./LessonUpsell";
import GuideVideo from "./GuideVideo";
import { useTheme } from "@/lib/theme";

type Props = {
  exercise: {
    id: string;
    name: string;
    description: string;
    startBpm: number;
    endBpm: number;
    guideVideoUrl?: string;
    guideVideoUrlDark?: string;
    guideLabel?: string;
  };
  /** Called when the guide video opens (the page pauses the exercise) */
  onGuideOpen?: () => void;
  index: number; // 0-based position on the path
  belt: Belt; // the belt this exercise earns
  progress: ExerciseProgress;
  personalBest: number;
  path: PathState;
};

/** The "Now training" card that sits under the video. */
export default function NowTraining({
  exercise,
  index,
  belt,
  progress,
  personalBest,
  path,
  onGuideOpen,
}: Props) {
  const dark = useTheme() === "dark";
  const earned = Math.max(0, path.highestIndex + 1);
  const range = exercise.endBpm - exercise.startBpm;
  const fill = progress.completed
    ? 1
    : personalBest > 0 && range > 0
    ? Math.min(1, Math.max(0, (personalBest - exercise.startBpm) / range))
    : 0;

  return (
    <section className="mt-6 rounded-2xl bg-neutral-100 dark:bg-neutral-900 px-4 py-4 sm:px-6 sm:py-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-[16px] tracking-[0.2em] uppercase text-neutral-600 dark:text-neutral-400">
          Now training · Exercise {index + 1}
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 w-full sm:w-auto">
          <span className="text-[16px] sm:text-[18px] text-neutral-600 dark:text-neutral-400">
            {earned} of {BELTS.length} belts earned
          </span>
          <div className="flex gap-1 w-full sm:w-[360px]" aria-hidden="true">
            {BELTS.map((b, i) => {
              const done = i < path.currentIndex;
              const current = i === path.currentIndex;
              return (
                <span
                  key={b.name}
                  className="flex-1 h-[13px] rounded-sm shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.15)]"
                  style={{
                    backgroundColor: done || current ? b.color : dark ? "#333333" : "#E5E5E5",
                    opacity: current ? 0.5 : 1,
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 mt-2">
        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{exercise.name}</h1>
        <span className="inline-flex items-center gap-2 text-[18px] text-neutral-600 dark:text-neutral-400">
          <span
            className="inline-block w-3.5 h-3.5 rounded-sm shadow-[inset_0_0_0_1px_rgba(0,0,0,0.2)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.3)]"
            style={{ backgroundColor: belt.color }}
          />
          {belt.name} Belt
        </span>
      </div>

      <p className="text-[18px] text-neutral-600 dark:text-neutral-400 mt-1 max-w-3xl">
        {exercise.description}
      </p>

      {exercise.guideVideoUrl && (
        <GuideVideo
          key={exercise.id}
          url={exercise.guideVideoUrl}
          urlDark={exercise.guideVideoUrlDark}
          label={exercise.guideLabel}
          onOpen={onGuideOpen}
        />
      )}

      <p className="text-[18px] text-neutral-700 dark:text-neutral-300 mt-3 mb-3">
        {progress.completed ? (
          <>{belt.name} belt earned.</>
        ) : (
          <>
            Earn the {belt.name} belt:{" "}
            <span className="font-semibold">
              {progress.cleanAtEnd} of {REPS_TO_COMPLETE}
            </span>{" "}
            clean reps at {exercise.endBpm} BPM.
          </>
        )}
      </p>

      <div className="h-1.5 rounded-full bg-neutral-300 dark:bg-neutral-700">
        <div
          className="h-1.5 rounded-full"
          style={{
            width: `${fill * 100}%`,
            backgroundColor: belt.color,
            boxShadow: dark
              ? "inset 0 0 0 1px rgba(255,255,255,0.25)"
              : "inset 0 0 0 1px rgba(0,0,0,0.15)",
          }}
        />
      </div>
      <div className="flex justify-between text-[17px] text-neutral-600 dark:text-neutral-400 mt-1">
        <span>{exercise.startBpm} BPM</span>
        <span>{exercise.endBpm} BPM</span>
      </div>
      <LessonUpsell exerciseId={exercise.id} />
    </section>
  );
}
