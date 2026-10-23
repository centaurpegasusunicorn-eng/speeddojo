"use client";

import { Rep } from "./belts";
import { createClient } from "./supabase/client";
import { localDay } from "./dates";

export async function loadReps(): Promise<Rep[]> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return [];

  const { data, error } = await supabase
    .from("reps")
    .select("id, exercise_id, bpm, clean, created_at")
    .eq("user_id", userData.user.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load reps:", error.message);
    return [];
  }

  return (data ?? []).map((r) => ({
    id: r.id,
    exerciseId: r.exercise_id,
    bpm: r.bpm,
    clean: r.clean,
    createdAt: localDay(r.created_at),
  }));
}

export async function addRep(
  rep: Omit<Rep, "id" | "createdAt">
): Promise<Rep | null> {
  const supabase = createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return null;

  const { data, error } = await supabase
    .from("reps")
    .insert({
      user_id: userData.user.id,
      exercise_id: rep.exerciseId,
      bpm: rep.bpm,
      clean: rep.clean,
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to add rep:", error.message);
    return null;
  }

  return {
    id: data.id,
    exerciseId: data.exercise_id,
    bpm: data.bpm,
    clean: data.clean,
    createdAt: localDay(data.created_at),
  };
}

// This file is the single place the app talks to the database.
// Every component calls loadReps()/addRep() only — none of them
// know or care that this used to be localStorage.
