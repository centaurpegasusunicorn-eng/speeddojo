import { REPS_TO_COMPLETE, type Rep } from "@/lib/belts";

/*
 * Progress stories worked out from logged reps (nothing extra is stored).
 */

type Ex = { id: string; name: string; endBpm: number };

/** Slowest tempo on their first day of an exercise */
export function startTempo(ex: Ex, reps: Rep[]): { bpm: number; day: string } | null {
  const mine = reps.filter((r) => r.exerciseId === ex.id);
  if (mine.length === 0) return null;
  const day = mine.reduce((a, b) => (b.createdAt < a.createdAt ? b : a)).createdAt;
  return { bpm: Math.min(...mine.filter((r) => r.createdAt === day).map((r) => r.bpm)), day };
}

/** The day the belt was earned: when the last needed clean rep was logged */
export function earnedDay(ex: Ex, reps: Rep[]): string | null {
  const clean = reps
    .filter((r) => r.exerciseId === ex.id && r.clean && r.bpm >= ex.endBpm)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  return clean.length >= REPS_TO_COMPLETE ? clean[REPS_TO_COMPLETE - 1].createdAt : null;
}

function daysBetween(from: string, to: string): number {
  const a = new Date(from + "T00:00:00").getTime();
  const b = new Date(to + "T00:00:00").getTime();
  return Math.max(1, Math.round((b - a) / 86_400_000) + 1);
}

/** "Silent Step: 60 → 90 BPM in 12 days" (or "... mastered at 90 BPM") */
export function journeyLine(ex: Ex, reps: Rep[], untilDay?: string): string {
  const start = startTempo(ex, reps);
  if (!start || start.bpm >= ex.endBpm) return `${ex.name} mastered at ${ex.endBpm} BPM`;
  const end = untilDay ?? earnedDay(ex, reps) ?? localToday();
  const days = daysBetween(start.day, end);
  return `${ex.name}: ${start.bpm} → ${ex.endBpm} BPM in ${days} day${days === 1 ? "" : "s"}`;
}

/** BPM gained on an exercise (0 if none) */
export function bpmGain(ex: Ex, reps: Rep[]): number {
  const start = startTempo(ex, reps);
  if (!start) return 0;
  const best = Math.max(...reps.filter((r) => r.exerciseId === ex.id && r.clean).map((r) => r.bpm), start.bpm);
  return Math.max(0, best - start.bpm);
}

function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
