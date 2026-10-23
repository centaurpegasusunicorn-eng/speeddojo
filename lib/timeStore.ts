"use client";

import { createClient } from "./supabase/client";
import { localDay } from "./dates";

export type TimeEntry = { exerciseId: string; day: string; seconds: number };

export async function loadTime(): Promise<TimeEntry[]> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from("practice_time")
    .select("exercise_id, seconds, created_at")
    .eq("user_id", userData.user.id);

  if (error) {
    // Most likely the practice_time table hasn't been created yet
    console.warn("Could not load practice time:", error.message);
    return [];
  }
  return (data ?? []).map((r) => ({
    exerciseId: r.exercise_id,
    day: localDay(r.created_at),
    seconds: r.seconds,
  }));
}

export async function addTime(exerciseId: string, seconds: number) {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;
  const { error } = await supabase.from("practice_time").insert({
    user_id: userData.user.id,
    exercise_id: exerciseId,
    seconds,
  });
  if (error) console.warn("Could not save practice time:", error.message);
}
