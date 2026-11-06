"use client";

import { addRep } from "@/lib/repStore";

/*
 * Reps logged in the homepage demo, before someone has an account. Kept in
 * this browser only, then added to their account the first time they arrive
 * signed in (see app/dashboard/page.tsx), so their White belt progress has
 * already started.
 */
const KEY = "dojo_demo_reps";

export type DemoRep = { exerciseId: string; bpm: number; clean: boolean };

export function loadDemoReps(): DemoRep[] {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export function saveDemoRep(rep: DemoRep): DemoRep[] {
  const all = [...loadDemoReps(), rep].slice(-50);
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {}
  return all;
}

/** Copy any demo reps into the signed-in account, then forget them */
export async function importDemoReps(): Promise<number> {
  const reps = loadDemoReps();
  if (reps.length === 0) return 0;
  let saved = 0;
  for (const r of reps) {
    if (await addRep({ exerciseId: r.exerciseId, bpm: r.bpm, clean: r.clean })) saved++;
  }
  try {
    localStorage.removeItem(KEY);
  } catch {}
  return saved;
}
