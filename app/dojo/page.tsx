"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Camera, Lock, KeyRound, Play, CreditCard } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import SignOutButton from "@/components/SignOutButton";
import BeltPhoto from "@/components/BeltPhoto";
import { BRAND } from "@/lib/brand";
import { BELTS, REPS_TO_COMPLETE, pathState, type Rep } from "@/lib/belts";
import { EXERCISES } from "@/lib/mockData";
import { loadReps } from "@/lib/repStore";
import { loadTime, type TimeEntry } from "@/lib/timeStore";
import { loadDay1 } from "@/lib/day1";
import { beltSvg, svgDataUrl } from "@/lib/beltCard";
import { bpmGain, earnedDay, journeyLine } from "@/lib/journey";
import { formatDuration } from "@/lib/format";
import { localDay } from "@/lib/dates";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/lib/theme";
import { isFree } from "@/lib/pricing";
import { PROGRAM } from "@/lib/programs";

/*
 * MY DOJO: everything personal in one place.
 *  1. Overview: Day 1 photo, current belt, headline numbers
 *  2. My belts: all 12, with "Make my card" on each one earned
 *  3. Account: email, membership, password, photo, welcome video, sign out
 * Opened from the round profile button in the top bar.
 */
export default function MyDojoPage() {
  const dark = useTheme() === "dark";
  const [reps, setReps] = useState<Rep[] | null>(null);
  const [time, setTime] = useState<TimeEntry[]>([]);
  const [email, setEmail] = useState("");
  const [day1, setDay1] = useState<{ url: string; date: Date } | null>(null);
  const [access, setAccess] = useState<{ paywall: boolean; member: boolean; accessUntil: string | null } | null>(null);
  const [card, setCard] = useState<number | null>(null); // belt index to make a card for

  useEffect(() => {
    loadReps().then(setReps).catch(() => setReps([]));
    loadTime().then(setTime).catch(() => {});
    createClient()
      .auth.getUser()
      .then(({ data }: { data: { user: { email?: string } | null } }) => setEmail(data.user?.email ?? ""));
    loadDay1()
      .then((d) => d && setDay1({ url: d.photo.toDataURL("image/jpeg", 0.9), date: d.date }))
      .catch(() => {});
    fetch("/api/access")
      .then((r) => (r.ok ? r.json() : null))
      .then((a) => a && setAccess(a))
      .catch(() => {});
  }, []);

  const all = reps ?? [];
  const path = pathState(EXERCISES, all);
  const earned = path.highestIndex + 1;
  const current = path.highestIndex >= 0 ? BELTS[Math.min(path.highestIndex, BELTS.length - 1)] : null;
  const totalSeconds = time.reduce((s, t) => s + t.seconds, 0);
  const cleanReps = all.filter((r) => r.clean).length;
  const streak = (() => {
    const days = new Set([...all.map((r) => r.createdAt), ...time.map((t) => t.day)]);
    let n = 0;
    const d = new Date();
    if (!days.has(localDay(d))) d.setDate(d.getDate() - 1); // today not practised yet: count from yesterday
    while (days.has(localDay(d))) {
      n++;
      d.setDate(d.getDate() - 1);
    }
    return n;
  })();
  const bestGain = Math.max(0, ...EXERCISES.map((e) => bpmGain(e, all)));
  const nice = (day: string) =>
    new Date(day + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <main className="w-full px-4 sm:px-8 pb-20">
      <header className="h-20 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-lg sm:text-xl tracking-[0.25em] sm:tracking-[0.3em] text-neutral-800 dark:text-neutral-200 font-light"
        >
          {BRAND.name.toUpperCase()}
        </Link>
        <ThemeToggle />
      </header>

      <div className="max-w-5xl mx-auto pt-4">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-[15px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100"
        >
          <ArrowLeft size={16} aria-hidden />
          Back to practice
        </Link>

        {/* ── 1. Overview ─────────────────────────────────────────────── */}
        <section className="mt-8 flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
          {day1 ? (
            <figure className="shrink-0 bg-white p-2.5 pb-3 rounded-md shadow-[0_10px_30px_rgba(0,0,0,0.2)] -rotate-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={day1.url} alt="Your Day 1 photo" className="w-40 h-40 object-cover rounded-sm" />
              <figcaption className="mt-2 text-center text-[12px] font-semibold tracking-[0.18em] uppercase text-neutral-700">
                Day 1 · {day1.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              </figcaption>
            </figure>
          ) : (
            <Link
              href="/welcome"
              className="shrink-0 w-44 h-48 rounded-md border-2 border-dashed border-neutral-300 dark:border-neutral-700 flex flex-col items-center justify-center gap-2 text-center text-[14px] text-neutral-500 dark:text-neutral-400 hover:border-[#CC1010] transition"
            >
              <Camera size={24} aria-hidden />
              Take your
              <br />
              Day 1 photo
            </Link>
          )}
          <div className="text-center sm:text-left">
            <p className="text-[15px] tracking-[0.2em] uppercase text-[#CC1010]">My Dojo</p>
            <h1 className="mt-1 text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              {current ? `${current.name} Belt` : "No belt yet"}
            </h1>
            <p className="mt-2 text-lg text-neutral-600 dark:text-neutral-400">
              {earned} of {BELTS.length} belts earned
            </p>
          </div>
        </section>

        <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
          <Stat label="Practice time" value={formatDuration(totalSeconds)} />
          <Stat label="Clean reps" value={String(cleanReps)} />
          <Stat label="Streak" value={`${streak} day${streak === 1 ? "" : "s"}`} />
          <Stat label="Biggest gain" value={bestGain > 0 ? `+${bestGain} BPM` : "–"} />
        </div>

        {/* ── 2. My belts ─────────────────────────────────────────────── */}
        <p className="mt-14 text-[13px] font-semibold tracking-[0.3em] uppercase text-[#CC1010]">My belts</p>
        <h2 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">{PROGRAM.name}</h2>
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {EXERCISES.map((ex, i) => {
            const belt = BELTS[Math.min(i, BELTS.length - 1)];
            const done = path.progress[i]?.completed;
            const isNext = i === path.currentIndex;
            const paidLock = !!access?.paywall && !access.member && !isFree(i);
            const light = belt.name === "White" || belt.name === "Silver";
            // earned: full colour; working on it: its colour, faded; later: a faint shape
            const art = svgDataUrl(
              done || isNext
                ? beltSvg(belt.color, { light, black: i === BELTS.length - 1 })
                : beltSvg(dark ? "#3A3A3A" : "#D4D4D4", { light: !dark, black: false })
            );
            const when = done ? earnedDay(ex, all) : null;
            return (
              <article
                key={ex.id}
                className={`rounded-2xl p-5 flex flex-col ${
                  done
                    ? "bg-neutral-100 dark:bg-neutral-900"
                    : "border border-dashed border-neutral-200 dark:border-neutral-800"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={art} alt="" className={`w-full max-w-[260px] mx-auto ${done ? "" : isNext ? "opacity-45" : "opacity-25"}`} />
                <div className="mt-3 flex items-baseline justify-between gap-2">
                  <h3 className={`text-lg font-bold ${done || isNext ? "text-neutral-900 dark:text-neutral-100" : "text-neutral-400 dark:text-neutral-500"}`}>
                    {belt.name} Belt
                  </h3>
                  {when && <span className="text-[13px] text-neutral-500 dark:text-neutral-400">{nice(when)}</span>}
                </div>
                <p className="text-[15px] text-neutral-600 dark:text-neutral-400">
                  {done ? journeyLine(ex, all) : ex.name}
                </p>
                <div className="mt-auto pt-4">
                  {done ? (
                    <button
                      type="button"
                      onClick={() => setCard(i)}
                      className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[15px] font-semibold bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:opacity-90"
                    >
                      <Camera size={16} aria-hidden /> Make my card
                    </button>
                  ) : paidLock ? (
                    <Link href="/unlock" className="inline-flex items-center gap-1.5 text-[14px] text-neutral-500 dark:text-neutral-400 hover:underline">
                      <Lock size={14} aria-hidden /> Part of the full dojo
                    </Link>
                  ) : isNext ? (
                    <Link href={`/practice/${ex.id}`} className="text-[14px] font-semibold text-[#CC1010] hover:underline">
                      In progress · {path.progress[i].cleanAtEnd} of {REPS_TO_COMPLETE} clean reps →
                    </Link>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-[14px] text-neutral-400 dark:text-neutral-500">
                      <Lock size={14} aria-hidden /> Not yet
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        {/* ── 3. Account ──────────────────────────────────────────────── */}
        <h2 className="mt-14 text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">Account</h2>
        <div className="mt-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-800">
          <Row label="Email" value={email || "…"} />
          <Row
            label="Membership"
            value={
              !access || !access.paywall
                ? "Full access"
                : access.member
                ? `Full dojo${access.accessUntil ? ` · until ${new Date(access.accessUntil).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}` : ""}`
                : "Free · White belt"
            }
            action={
              access?.paywall ? (
                <Link href="/unlock" className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-[#CC1010] hover:underline">
                  <CreditCard size={16} aria-hidden /> {access.member ? "Billing and receipts" : "Unlock all 12 belts"}
                </Link>
              ) : null
            }
          />
          <Row
            label="Password"
            value="••••••••"
            action={
              <Link href="/reset-password" className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-neutral-700 dark:text-neutral-300 hover:underline">
                <KeyRound size={16} aria-hidden /> Change
              </Link>
            }
          />
          <Row
            label="Day 1 photo and welcome video"
            value={day1 ? "Private to you" : "Not taken yet"}
            action={
              <Link href="/welcome" className="inline-flex items-center gap-1.5 text-[15px] font-semibold text-neutral-700 dark:text-neutral-300 hover:underline">
                <Play size={16} aria-hidden /> Open
              </Link>
            }
          />
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <span className="text-[15px] text-neutral-600 dark:text-neutral-400">Sign out of {BRAND.name}</span>
            <SignOutButton withLabel />
          </div>
        </div>
      </div>

      {card !== null && (
        <BeltPhoto
          beltName={BELTS[card].name}
          beltColor={BELTS[card].color}
          beltIndex={card}
          allBelts={BELTS}
          line={card === BELTS.length - 1 ? `All 12 ${PROGRAM.name} belts earned` : journeyLine(EXERCISES[card], all)}
          onClose={() => setCard(null)}
        />
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-neutral-100 dark:bg-neutral-900 px-4 py-3">
      <p className="text-[14px] text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">{value}</p>
    </div>
  );
}

function Row({ label, value, action }: { label: string; value: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-4">
      <div className="min-w-0">
        <p className="text-[14px] text-neutral-500 dark:text-neutral-400">{label}</p>
        <p className="text-[16px] text-neutral-900 dark:text-neutral-100 break-all">{value}</p>
      </div>
      {action}
    </div>
  );
}
