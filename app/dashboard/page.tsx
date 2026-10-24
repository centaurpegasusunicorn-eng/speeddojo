"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { EXERCISES } from "@/lib/mockData";
import { loadReps } from "@/lib/repStore";
import { pathState } from "@/lib/belts";
import { createClient } from "@/lib/supabase/client";
import { needsWelcome } from "@/lib/day1";

/*
 * There's no separate dashboard any more: the practice screen shows
 * everything. This address (used after sign-in, by the logo, and in emails)
 * just sends the student to the exercise they practised most recently,
 * or to the one they're working towards if they haven't practised yet.
 */
export default function DashboardRedirect() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.replace("/login");
        return;
      }
      const userId = data.user.id;

      // Most recent activity: the newest logged rep or practice session
      const [rep, time] = await Promise.all([
        supabase
          .from("reps")
          .select("exercise_id, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from("practice_time")
          .select("exercise_id, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      // Brand-new students start with the welcome (intro video + Day 1 photo)
      if (!rep.data && !time.data && (await needsWelcome())) {
        router.replace("/welcome");
        return;
      }

      const latest = [rep.data, time.data]
        .filter((r): r is { exercise_id: string; created_at: string } => !!r)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];

      // Only go there if it still exists and is unlocked
      const reps = await loadReps();
      const path = pathState(EXERCISES, reps);
      const openIdx = Math.min(path.currentIndex, EXERCISES.length - 1);
      const lastIdx = latest
        ? EXERCISES.findIndex((e) => e.id === latest.exercise_id)
        : -1;
      const target =
        lastIdx >= 0 && lastIdx <= openIdx ? EXERCISES[lastIdx] : EXERCISES[openIdx];

      router.replace(`/practice/${target.id}`);
    })();
  }, [router]);

  return (
    <main className="w-full px-8 py-10">
      <p className="text-sm text-neutral-500 dark:text-neutral-400">Loading…</p>
    </main>
  );
}
