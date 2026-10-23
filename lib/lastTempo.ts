"use client";

import type { Rep } from "./belts";

/*
 * Remembers where each student left the big tempo dial, per exercise.
 *
 *  1. The exact dial setting is saved in this browser whenever it moves.
 *  2. On another device (or after the browser is cleared) it falls back to
 *     the tempo of the last rep they logged on that exercise.
 *  3. First time on an exercise: its start tempo.
 * Always kept inside the exercise's start-end range.
 */

const key = (userId: string, exerciseId: string) =>
  `dojo_tempo:${userId}:${exerciseId}`;

export function saveLastTempo(userId: string, exerciseId: string, bpm: number) {
  try {
    window.localStorage.setItem(key(userId, exerciseId), String(bpm));
  } catch {
    /* private window or storage blocked: the logged-rep fallback still works */
  }
}

export function lastTempo(
  userId: string,
  exercise: { id: string; startBpm: number; endBpm: number },
  reps: Rep[]
): number {
  let bpm: number | null = null;

  try {
    const saved = Number(window.localStorage.getItem(key(userId, exercise.id)));
    if (Number.isFinite(saved) && saved > 0) bpm = saved;
  } catch {
    /* ignore */
  }

  if (bpm === null) {
    // reps arrive oldest first, so the last match is the most recent
    const mine = reps.filter((r) => r.exerciseId === exercise.id);
    if (mine.length) bpm = mine[mine.length - 1].bpm;
  }

  return Math.min(exercise.endBpm, Math.max(exercise.startBpm, bpm ?? exercise.startBpm));
}
