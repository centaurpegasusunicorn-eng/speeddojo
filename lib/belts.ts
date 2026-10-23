/*
 * THE PATH
 * --------
 * There are 12 exercises, basic to advanced. Exercise N earns belt N.
 * - Each exercise has a start tempo and an end tempo.
 * - An exercise is COMPLETE after REPS_TO_COMPLETE clean reps at its end tempo.
 * - Exercises unlock in order: you can use every completed exercise, plus the
 *   next one. Everything after that is locked.
 * - The belt strip always shows the highest belt completed so far.
 * Completion is worked out from the logged reps, so there is nothing extra
 * to store.
 */

export type Belt = { name: string; color: string };

export const BELTS: Belt[] = [
  { name: "White", color: "#FFFFFF" },
  { name: "Yellow", color: "#EAB308" },
  { name: "Orange", color: "#F97316" },
  { name: "Green", color: "#16A34A" },
  { name: "Teal", color: "#0D9488" },
  { name: "Blue", color: "#2563EB" },
  { name: "Purple", color: "#7C3AED" },
  { name: "Pink", color: "#EC4899" },
  { name: "Red", color: "#DC2626" },
  { name: "Brown", color: "#92400E" },
  { name: "Silver", color: "#A3A3A3" },
  { name: "Black", color: "#171717" },
];

/** Strip colour before the first belt has been earned */
export const NEUTRAL_STRIP = "#EDEDED";

/** Clean reps needed at an exercise's end tempo to complete it */
export const REPS_TO_COMPLETE = 5;

export type Rep = {
  id: string;
  exerciseId: string;
  bpm: number;
  clean: boolean;
  createdAt: string; // local calendar day, YYYY-MM-DD
};

/** Is this colour light enough to need dark text / a darker flash? */
export function isLight(hex: string): boolean {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.6;
}

export function textOn(hex: string): string {
  return isLight(hex) ? "#171717" : "#FFFFFF";
}

export type PathExercise = { id: string; endBpm: number };

export type ExerciseProgress = {
  cleanAtEnd: number; // clean reps at the end tempo so far (max REPS_TO_COMPLETE)
  completed: boolean;
};

export type PathState = {
  progress: ExerciseProgress[]; // one per exercise, in path order
  currentIndex: number; // first exercise not yet completed (= length when all done)
  highestIndex: number; // last completed exercise, -1 if none
};

export function pathState(exercises: PathExercise[], reps: Rep[]): PathState {
  const progress = exercises.map((ex) => {
    const n = reps.filter(
      (r) => r.exerciseId === ex.id && r.clean && r.bpm >= ex.endBpm
    ).length;
    return {
      cleanAtEnd: Math.min(n, REPS_TO_COMPLETE),
      completed: n >= REPS_TO_COMPLETE,
    };
  });

  let currentIndex = progress.findIndex((p) => !p.completed);
  if (currentIndex === -1) currentIndex = exercises.length;

  return { progress, currentIndex, highestIndex: currentIndex - 1 };
}
