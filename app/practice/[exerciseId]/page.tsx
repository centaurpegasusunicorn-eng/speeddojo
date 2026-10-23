"use client";

import { playUrl } from "@/lib/video";
import { useRef, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { EXERCISES, getExercise } from "@/lib/mockData";
import { addRep, loadReps } from "@/lib/repStore";
import { createClient } from "@/lib/supabase/client";
import {
  Rep,
  Belt,
  BELTS,
  REPS_TO_COMPLETE,
  NEUTRAL_STRIP,
  isLight,
  pathState,
} from "@/lib/belts";
import PathMenu from "@/components/PathMenu";
import Countdown from "@/components/Countdown";
import NowTraining from "@/components/NowTraining";
import BeltUpOverlay from "@/components/BeltUpOverlay";
import BpmGauge from "@/components/BpmGauge";
import ProgressChart from "@/components/ProgressChart";
import { ClickEngine } from "@/lib/clickEngine";
import { SlidersVertical, ChevronDown } from "lucide-react";
import { loadTime, addTime, type TimeEntry } from "@/lib/timeStore";
import { localDay } from "@/lib/dates";
import { formatDuration } from "@/lib/format";
import { readPrefs, writePrefs } from "@/lib/prefs";
import { lastTempo, saveLastTempo } from "@/lib/lastTempo";
import { useTheme } from "@/lib/theme";
import ThemeToggle from "@/components/ThemeToggle";
import SignOutButton from "@/components/SignOutButton";
import RepCue from "@/components/RepCue";
import CommunityLink from "@/components/CommunityLink";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import { BRAND } from "@/lib/brand";

const RED = "#CC1010";

// ─── LAYOUT ────────────────────────────────────────────────────────────────
// Width of the right-hand column (dial, mixer, chart) as a % of the page.
// The video column takes the rest. 25 = the original width.
const RIGHT_COLUMN_PERCENT = 28.75;
// ───────────────────────────────────────────────────────────────────────────
// Strip colour before the first belt, dark mode
const NEUTRAL_STRIP_DARK = "#262626";

export default function PracticePage() {
  const params = useParams<{ exerciseId: string }>();
  const router = useRouter();
  const exercise = getExercise(params.exerciseId);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [bpm, setBpm] = useState(exercise?.originalBpm ?? 90);
  const [showPrompt, setShowPrompt] = useState(false);
  const [saving, setSaving] = useState(false);
  const userIdRef = useRef<string | null>(null);
  const tempoAnim = useRef<number | null>(null); // "Set to my best" sweep


  // Keyboard shortcuts (see handleShortcut below). One listener for the
  // page; it always calls the latest version of the handler.
  const shortcutRef = useRef<(e: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    shortcutRef.current = handleShortcut;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => shortcutRef.current(e);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => () => {
    if (tempoAnim.current) cancelAnimationFrame(tempoAnim.current);
  }, []);
  const [saveError, setSaveError] = useState(false);
  const [reps, setReps] = useState<Rep[]>([]);
  const [loading, setLoading] = useState(true);
  const engineRef = useRef<ClickEngine | null>(null);
  const stripRef = useRef<HTMLDivElement>(null);
  const flashTimer = useRef<number | null>(null);
  const [clickVolume, setClickVolume] = useState(0.5);
  const [accentVolume, setAccentVolume] = useState(0.8);
  const [paused, setPaused] = useState(true);
  const [mixerOpen, setMixerOpen] = useState(false);
  const [pulseOn, setPulseOn] = useState(true);
  const pulseOnRef = useRef(true);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  // Remember whether the student left the mixer open
  useEffect(() => {
    setMixerOpen(window.localStorage.getItem("dojo_mixer_open") === "1");
  }, []);

  function toggleMixer() {
    setMixerOpen((open) => {
      window.localStorage.setItem("dojo_mixer_open", open ? "0" : "1");
      return !open;
    });
  }
  const [guitarVolume, setGuitarVolume] = useState(1);
  const [accents, setAccents] = useState<boolean[]>([true, false, false, false]);
  const [beltUp, setBeltUp] = useState<Belt | null>(null);
  const [debug, setDebug] = useState(false);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);

  // Light/dark mode picks the video. If the dark file is missing or won't
  // load, fall back to the light one rather than showing a broken player.
  const theme = useTheme();
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const videoFile =
    theme === "dark" &&
    exercise?.videoUrlDark &&
    exercise.videoUrlDark !== failedSrc
      ? exercise.videoUrlDark
      : exercise?.videoUrl ?? "";
  const videoSrc = playUrl(videoFile);
  // Where to pick up after a light/dark swap: position + whether it was playing
  const resumeRef = useRef<{ time: number; playing: boolean } | null>(null);

  // Remember volumes, accents and the pulse switch in a cookie
  useEffect(() => {
    const p = readPrefs();
    if (p) {
      if (typeof p.click === "number") setClickVolume(p.click);
      if (typeof p.accent === "number") setAccentVolume(p.accent);
      if (typeof p.guitar === "number") setGuitarVolume(p.guitar);
      if (Array.isArray(p.accents) && p.accents.length === 4)
        setAccents(p.accents.map(Boolean));
      if (typeof p.pulse === "boolean") setPulseOn(p.pulse);
    }
    setPrefsLoaded(true);
  }, []);

  useEffect(() => {
    if (!prefsLoaded) return;
    writePrefs({
      click: clickVolume,
      accent: accentVolume,
      guitar: guitarVolume,
      accents,
      pulse: pulseOn,
    });
  }, [prefsLoaded, clickVolume, accentVolume, guitarVolume, accents, pulseOn]);

  // Pulse switch: keep a ref for the beat callback, and reset the strip when off
  useEffect(() => {
    pulseOnRef.current = pulseOn;
    const el = stripRef.current;
    if (!pulseOn && el) {
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
      el.style.transition = "none";
      el.style.backgroundColor = el.dataset.base ?? "";
    }
  }, [pulseOn]);

  useEffect(() => {
    setDebug(new URLSearchParams(window.location.search).get("debug") === "1");
  }, []);

  // Attach the click engine to the video once it's on the page
  useEffect(() => {
    if (loading || !exercise || !videoRef.current) return;
    const engine = new ClickEngine();
    engine.attach(videoRef.current, {
      originalBpm: exercise.originalBpm,
      beatsPerBar: 4,
    });
    engineRef.current = engine;

    // Flash the belt strip on every beat: light grey normally, red on
    // accented beats, then back to the belt colour.
    engine.setOnBeat((accent) => {
      const el = stripRef.current;
      if (!el || !pulseOnRef.current) return;
      const base = el.dataset.base ?? "";
      const accentColor = el.dataset.accent ?? RED;
      // Light belts need a darker flash to be visible
      const grey = isLight(base) ? "#6B7280" : "#D4D4D4";
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
      el.style.transition = "none";
      el.style.backgroundColor = accent ? accentColor : grey;
      flashTimer.current = window.setTimeout(() => {
        el.style.transition = "background-color 120ms ease-out";
        el.style.backgroundColor = base;
      }, 90);
    });

    return () => {
      engine.setOnBeat(null);
      engine.detach();
      engineRef.current = null;
      if (flashTimer.current) window.clearTimeout(flashTimer.current);
      if (stripRef.current) {
        stripRef.current.style.transition = "none";
        stripRef.current.style.backgroundColor =
          stripRef.current.dataset.base ?? "";
      }
    };
  }, [loading, exercise?.id]);

  useEffect(() => {
    engineRef.current?.setVolume(clickVolume);
    engineRef.current?.setAccentVolume(accentVolume);
    engineRef.current?.setAccents(accents);
  }, [clickVolume, accentVolume, accents, loading, exercise?.id]);

  // Track real practice time: seconds the video is actually playing.
  // Saved when the video pauses/ends, every 30s, when the tab is hidden,
  // and when leaving the page.
  useEffect(() => {
    if (loading || !exercise || !videoRef.current) return;
    const video = videoRef.current;
    const exerciseId = exercise.id;
    let startedAt: number | null = null;

    const start = () => {
      if (startedAt === null) startedAt = performance.now();
    };
    const flush = () => {
      if (startedAt === null) return;
      const secs = Math.round((performance.now() - startedAt) / 1000);
      startedAt = null;
      if (secs < 1) return;
      setTimeEntries((prev) => [
        ...prev,
        { exerciseId, day: localDay(new Date()), seconds: secs },
      ]);
      addTime(exerciseId, secs);
    };
    const onHidden = () => {
      if (document.hidden) {
        flush();
        if (!video.paused) start();
      }
    };

    video.addEventListener("play", start);
    video.addEventListener("pause", flush);
    video.addEventListener("ended", flush);
    document.addEventListener("visibilitychange", onHidden);
    const periodic = window.setInterval(() => {
      if (startedAt !== null) {
        flush();
        start();
      }
    }, 30000);
    if (!video.paused) start();

    return () => {
      window.clearInterval(periodic);
      video.removeEventListener("play", start);
      video.removeEventListener("pause", flush);
      video.removeEventListener("ended", flush);
      document.removeEventListener("visibilitychange", onHidden);
      flush();
    };
  }, [loading, exercise?.id]);

  // Keep the play/pause overlay in step with the video
  useEffect(() => {
    if (loading || !exercise || !videoRef.current) return;
    const video = videoRef.current;
    const sync = () => setPaused(video.paused || video.ended);
    const onEnded = () => setShowPrompt(true);
    const onPlay = () => {
      setShowPrompt(false);
      setSaveError(false);
    };
    const events = ["play", "pause", "ended", "emptied"];
    events.forEach((e) => video.addEventListener(e, sync));
    video.addEventListener("ended", onEnded);
    video.addEventListener("play", onPlay);
    setShowPrompt(false);
    sync();
    return () => {
      events.forEach((e) => video.removeEventListener(e, sync));
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("play", onPlay);
    };
  }, [loading, exercise?.id]);

  // Load the light or dark video. The two are the same take, so on a swap
  // we carry over the position and keep playing; tempo is reapplied in
  // onLoadedMetadata, and the click engine resyncs itself on load/seek.
  useEffect(() => {
    const v = videoRef.current;
    if (loading || !v || !videoSrc) return;
    if (v.getAttribute("src") === videoSrc) return;

    if (v.getAttribute("src")) {
      // Keep an earlier resume point if the last swap never loaded
      resumeRef.current ??= {
        time: v.currentTime,
        playing: !v.paused && !v.ended,
      };
    } else {
      resumeRef.current = null; // first load for this exercise
    }
    v.src = videoSrc;

    const onMeta = () => {
      const r = resumeRef.current;
      resumeRef.current = null;
      if (!r) return;
      if (r.time > 0) v.currentTime = Math.min(r.time, Math.max(0, v.duration - 0.05));
      if (r.playing) v.play().catch(() => {});
    };
    v.addEventListener("loadedmetadata", onMeta, { once: true });
    return () => v.removeEventListener("loadedmetadata", onMeta);
  }, [videoSrc, loading, exercise?.id]);

  // Guitar volume = the video's own audio level
  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = guitarVolume;
  }, [guitarVolume, loading, exercise?.id]);

  useEffect(() => {
    if (!exercise) return;
    const supabase = createClient();
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push("/login");
        return;
      }
      userIdRef.current = data.user.id;
      const all = await loadReps();
      setReps(all);
      setTimeEntries(await loadTime());

      // Locked exercises can't be opened: send the student to the one they're on
      const ps = pathState(EXERCISES, all);
      const idx = EXERCISES.findIndex((e) => e.id === exercise.id);
      const openIdx = Math.min(ps.currentIndex, EXERCISES.length - 1);
      if (idx > openIdx) {
        router.replace(`/practice/${EXERCISES[openIdx].id}`);
        return;
      }

      // Put the dial back where the student left it on this exercise
      // (see lib/lastTempo.ts)
      setBpm(lastTempo(data.user.id, exercise, all));

      setLoading(false);
    })();
  }, [exercise?.id, router]);

  if (!exercise) {
    return (
      <main className="w-full px-8 py-10">
        <p className="text-sm text-neutral-500">
          Exercise not found.{" "}
          <Link href="/dashboard" className="underline">
            Back to dashboard
          </Link>
        </p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="w-full px-8 py-10">
        <p className="text-sm text-neutral-500">Loading…</p>
      </main>
    );
  }

  const exerciseReps = reps.filter((r) => r.exerciseId === exercise.id);
  const cleanReps = exerciseReps.filter((r) => r.clean);
  const personalBest = cleanReps.reduce((max, r) => Math.max(max, r.bpm), 0);
  const cleanRate = exerciseReps.length
    ? Math.round((cleanReps.length / exerciseReps.length) * 100)
    : 0;
  const path = pathState(EXERCISES, reps);

  const exIndex = EXERCISES.findIndex((e) => e.id === exercise.id);
  const exProgress = path.progress[exIndex];
  const thisBelt = BELTS[Math.min(exIndex, BELTS.length - 1)];
  const highestBelt =
    path.highestIndex >= 0
      ? BELTS[Math.min(path.highestIndex, BELTS.length - 1)]
      : null;
  const stripColor =
    highestBelt?.color ?? (theme === "dark" ? NEUTRAL_STRIP_DARK : NEUTRAL_STRIP);
  const stripLabel = highestBelt ? `${highestBelt.name} Belt` : "No belt yet";
  // A red accent flash would be invisible on a Red belt, so use black there
  const accentFlash = highestBelt?.name === "Red" ? "#171717" : RED;
  const target = exProgress.completed
    ? null
    : {
        name: thisBelt.name,
        tempo: exercise.endBpm,
        progress: exProgress.cleanAtEnd,
        needed: REPS_TO_COMPLETE,
      };

  const streak = (() => {
    const days = new Set(exerciseReps.map((r) => r.createdAt));
    let count = 0;
    const d = new Date();
    while (days.has(localDay(d))) {
      count++;
      d.setDate(d.getDate() - 1);
    }
    return count;
  })();

  const todaySeconds = timeEntries
    .filter((t) => t.day === localDay(new Date()))
    .reduce((sum, t) => sum + t.seconds, 0);

  const gaugeMin = exercise.startBpm;
  const gaugeMax = exercise.endBpm;

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused || v.ended) v.play();
    else v.pause();
  }

  // Moving the dial by hand stops any "Set to my best" sweep in progress
  function handleBpmChange(v: number) {
    if (tempoAnim.current) cancelAnimationFrame(tempoAnim.current);
    tempoAnim.current = null;
    setTempo(v);
  }

  // "Set to my best": sweep the dial to the target over ~0.45s
  function sweepTo(target: number) {
    if (tempoAnim.current) cancelAnimationFrame(tempoAnim.current);
    const from = bpm;
    const start = performance.now();
    const DURATION = 450;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      const eased = 1 - (1 - t) ** 3;
      setTempo(Math.round(from + (target - from) * eased));
      tempoAnim.current = t < 1 ? requestAnimationFrame(step) : null;
    };
    tempoAnim.current = requestAnimationFrame(step);
  }

  function setTempo(v: number) {
    setBpm(v);
    if (exercise && userIdRef.current) saveLastTempo(userIdRef.current, exercise.id, v);
    if (videoRef.current && exercise) {
      videoRef.current.playbackRate = v / exercise.originalBpm;
    }
  }

  /*
   * KEYBOARD SHORTCUTS, so students can keep their hands on the guitar
   *   Space        play / pause
   *   Y / N        log the rep (while "Log your rep" is showing)
   *   Up / Down    tempo +1 / -1 BPM (hold Shift for 5)
   * Ignored while typing in a box or adjusting a mixer slider.
   */
  function handleShortcut(e: KeyboardEvent) {
    if (!exercise || loading || e.metaKey || e.ctrlKey || e.altKey) return;
    const target = e.target as HTMLElement | null;
    if (target?.closest("input, textarea, select, [contenteditable='true']")) return;
    // Space on a focused button should press that button, not play/pause
    const onControl = !!target?.closest(
      "button, a, [role='button'], [role='link'], [role='switch']"
    );
    const key = e.key.toLowerCase();

    if (key === " ") {
      if (onControl) return;
      e.preventDefault(); // don't scroll the page
      togglePlay();
    } else if (showPrompt && (key === "y" || key === "n")) {
      e.preventDefault();
      logRep(key === "y");
    } else if (key === "arrowup" || key === "arrowdown") {
      e.preventDefault();
      const step = (e.shiftKey ? 5 : 1) * (key === "arrowup" ? 1 : -1);
      handleBpmChange(Math.min(exercise.endBpm, Math.max(exercise.startBpm, bpm + step)));
    }
  }

  async function logRep(clean: boolean) {
    if (!exercise || saving) return; // ignore double-clicks
    setSaving(true);
    setSaveError(false);
    const newRep = await addRep({ exerciseId: exercise.id, bpm, clean });
    setSaving(false);
    if (!newRep) {
      // Keep the question up so the rep isn't lost; they can try again
      setSaveError(true);
      return;
    }
    const before = pathState(EXERCISES, reps);
    const after = pathState(EXERCISES, [...reps, newRep]);
    if (after.highestIndex > before.highestIndex) {
      setBeltUp(BELTS[Math.min(after.highestIndex, BELTS.length - 1)]);
    }
    setReps((prev) => [...prev, newRep]);
    setShowPrompt(false);
  }

  // "Log your rep" prompt once a rep ends, otherwise the countdown. Shown
  // beside the path on desktop, and right under the video on phones/tablets.
  const promptArea = (showPrompt ? (
            <div className="flex items-center gap-5">
            <RepCue belt={thisBelt} />
            <div className="flex flex-col items-start">
              <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                Log your rep:
              </p>
              <p className="text-neutral-700 dark:text-neutral-300 mb-2">
                Played it clean, zero mistakes?
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => logRep(true)}
                  disabled={saving}
                  className="inline-flex items-center border border-neutral-300 dark:border-neutral-600 font-bold px-5 py-3 rounded-lg text-sm disabled:opacity-50"
                >
                  YES<kbd className="ml-2 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded border border-current/30 text-[11px] font-semibold opacity-60 [@media(pointer:coarse)]:hidden">Y</kbd>
                </button>
                <button
                  onClick={() => logRep(false)}
                  disabled={saving}
                  className="inline-flex items-center bg-neutral-200 dark:bg-neutral-800 font-bold px-5 py-3 rounded-lg text-sm disabled:opacity-50"
                >
                  NO<kbd className="ml-2 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded border border-current/30 text-[11px] font-semibold opacity-60 [@media(pointer:coarse)]:hidden">N</kbd>
                </button>
              </div>
              {saveError && (
                <p role="alert" className="mt-2 text-sm text-red-600 dark:text-red-400">
                  Couldn&apos;t save that rep. Check your connection and tap again.
                </p>
              )}
            </div>
            </div>
          ) : (
            <Countdown key={exercise.id} videoRef={videoRef} />
          ));

  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 pb-10">
      {/* Header: belt bar flush to the top, logo left, belt + stats grouped right */}
      {/* Phones/tablets: logo + buttons on top, belt + stats on a swipeable row below */}
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2 pb-5 lg:pb-6">
        <Link
          href="/dashboard"
          className="order-1 h-14 lg:h-20 flex items-center text-lg lg:text-xl tracking-[0.25em] lg:tracking-[0.3em] text-neutral-800 dark:text-neutral-200 font-light"
        >
          {BRAND.name.toUpperCase()}
        </Link>

        <div className="order-2 h-14 flex items-center gap-1 lg:hidden">
          <ThemeToggle />
          <SignOutButton />
        </div>

        <div className="order-3 w-full lg:order-2 lg:w-auto min-w-0 flex items-start gap-3">
          <div
            ref={stripRef}
            data-base={stripColor}
            data-accent={accentFlash}
            role="button"
            tabIndex={0}
            aria-pressed={pulseOn}
            aria-label="Beat pulse"
            title={pulseOn ? "Beat pulse on (click to turn off)" : "Beat pulse off (click to turn on)"}
            onClick={() => setPulseOn((v) => !v)}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                setPulseOn((v) => !v);
              }
            }}
            className="shrink-0 w-6 h-16 lg:w-8 lg:h-20 cursor-pointer shadow-[inset_0_0_0_1px_rgba(0,0,0,0.12)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.18)]"
            style={{ backgroundColor: stripColor }}
          />
          <div className="h-16 lg:h-20 min-w-0 flex-1 flex items-center gap-2 lg:gap-4 overflow-x-auto [scrollbar-width:none] lg:overflow-visible">
            <span className="shrink-0 whitespace-nowrap text-base lg:text-lg text-neutral-700 dark:text-neutral-300 mr-1 lg:mr-2">{stripLabel}</span>
            <StatPill label="Personal best" value={`${personalBest || "—"} bpm`} />
            <StatPill label="Clean rate" value={`${cleanRate}%`} />
            <StatPill label="Streak" value={`${streak} days`} />
            <StatPill label="Practised today" value={formatDuration(todaySeconds)} />
            <span className="hidden lg:contents">
              <ThemeToggle className="ml-2" />
              <SignOutButton className="-ml-2" />
            </span>
          </div>
        </div>
      </div>

      {/* Path (over the video) + Log-your-rep prompt (over the dial, only once the rep has finished) */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,calc((100%_-_2rem)*var(--right-col)/100))] gap-4 lg:gap-8 items-center mb-4" style={{ "--right-col": RIGHT_COLUMN_PERCENT } as React.CSSProperties}>
        <div>
          {/* phones: a straight row that fits the screen; wider screens: the winding trail */}
          <div className="sm:hidden pt-2">
            <PathMenu exercises={EXERCISES} path={path} currentId={exercise.id} straight />
          </div>
          <div className="hidden sm:block">
            <PathMenu exercises={EXERCISES} path={path} currentId={exercise.id} />
          </div>
        </div>

        <div className="hidden lg:flex min-h-[4.5rem] items-center">
          {promptArea}
        </div>
      </div>

      {/* Main grid: video 3/4, gauge+chart 1/4 */}
      {/* Phones/tablets: one column in practice order (video, rep prompt,
          dial, chart, training card, Discord, then mixer + shortcuts last). The two desktop columns use
          "contents" below lg so their pieces can be reordered. */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,calc((100%_-_2rem)*var(--right-col)/100))] lg:gap-8" style={{ "--right-col": RIGHT_COLUMN_PERCENT } as React.CSSProperties}>
        <div className="contents lg:block">
          <div
            role="button"
            tabIndex={0}
            aria-label={paused ? "Play" : "Pause"}
            onClick={togglePlay}
            onKeyDown={(e) => {
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                togglePlay();
              }
            }}
            className="order-1 relative rounded-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden aspect-video flex items-center justify-center lg:mb-4 cursor-pointer"
          >
            <video
              key={exercise.id}
              ref={videoRef}
              className="w-full h-full"
              onError={() => {
                if (videoFile !== exercise.videoUrl) setFailedSrc(videoFile);
              }}
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  videoRef.current.playbackRate = bpm / exercise.originalBpm;
                  videoRef.current.preservesPitch = true;
                  videoRef.current.volume = guitarVolume;
                }
              }}
            />
            {paused && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <svg viewBox="0 0 100 100" className="w-[14.4%] min-w-[58px]" aria-hidden>
                  <polygon points="20,10 90,50 20,90" fill={RED} />
                </svg>
              </div>
            )}
          </div>

          {/* rep prompt / countdown sits right under the video on phones */}
          {(showPrompt || !paused) && (
            <div className="order-2 lg:hidden -mt-2 flex justify-center">{promptArea}</div>
          )}

          <div className="order-5 -mt-6 lg:mt-0">
          <NowTraining
            exercise={exercise}
            index={exIndex}
            belt={thisBelt}
            progress={exProgress}
            personalBest={personalBest}
            path={path}
            // the guide video plays at normal speed: pause the exercise first
            onGuideOpen={() => videoRef.current?.pause()}
          />
          </div>
        </div>

        <div className="contents lg:block">
          <div className="order-3 flex justify-center lg:mb-4">
            <div className="w-full max-w-[300px] sm:max-w-[380px] lg:max-w-none flex justify-center">
            <BpmGauge
              key={exercise.id}
              videoRef={videoRef}
              bpm={bpm}
              min={gaugeMin}
              max={gaugeMax}
              onChange={handleBpmChange}
              // ring colours are set at the top of components/BpmGauge.tsx
              // best clean tempo, kept inside this exercise's dial range
              best={
                personalBest > 0
                  ? Math.min(gaugeMax, Math.max(gaugeMin, personalBest))
                  : undefined
              }
              onJumpToBest={sweepTo}
            />
            </div>
          </div>

          <div className="order-4">
          <ProgressChart
            reps={exerciseReps}
            sessions={timeEntries.filter((t) => t.exerciseId === exercise.id)}
            target={target}
          />
          </div>
          {/* Audio Mixer + Keyboard Shortcuts, under the progress chart */}
          <div className="order-7 lg:mt-5">
            <button
              onClick={toggleMixer}
              aria-expanded={mixerOpen}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-neutral-800 dark:text-neutral-200"
            >
              <span className="flex items-center gap-2">
                <SlidersVertical size={18} aria-hidden />
                Audio Mixer
              </span>
              <ChevronDown
                size={18}
                aria-hidden
                className={`transition-transform duration-200 ${mixerOpen ? "rotate-180" : ""}`}
              />
            </button>
            <div
              className={`grid transition-[grid-template-rows] duration-200 ${
                mixerOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              }`}
            >
              <div className="min-h-0 overflow-hidden" inert={!mixerOpen}>
                <div className="space-y-3 px-4 pb-4 text-sm text-neutral-600 dark:text-neutral-400">
            <label className="flex items-center justify-between gap-4">
              Click Volume
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={clickVolume}
                onChange={(e) => setClickVolume(parseFloat(e.target.value))}
                style={{ accentColor: RED }}
                className="w-40"
              />
            </label>
            <label className="flex items-center justify-between gap-4">
              Accent Volume
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={accentVolume}
                onChange={(e) => setAccentVolume(parseFloat(e.target.value))}
                style={{ accentColor: RED }}
                className="w-40"
              />
            </label>
            <label className="flex items-center justify-between gap-4">
              Guitar Volume
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={guitarVolume}
                onChange={(e) => setGuitarVolume(parseFloat(e.target.value))}
                style={{ accentColor: RED }}
                className="w-40"
              />
            </label>
            <div className="flex items-center justify-between gap-4">
              Click Accent
              <div className="flex gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <button
                    key={i}
                    onClick={() =>
                      setAccents((prev) => prev.map((v, j) => (j === i ? !v : v)))
                    }
                    aria-pressed={accents[i]}
                    style={
                      accents[i]
                        ? { backgroundColor: RED, borderColor: RED, color: "#fff" }
                        : undefined
                    }
                    className="w-9 h-9 rounded-full border border-neutral-300 dark:border-neutral-600 text-sm font-semibold text-neutral-600 dark:text-neutral-300 active:scale-95 transition-transform"
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
              </div>
            </div>
          </div>
          {/* no keyboard on phones/tablets */}
          <div className="order-8 -mt-6 lg:mt-0 [@media(pointer:coarse)]:hidden">
            <KeyboardShortcuts />
          </div>
          <div className="order-6 -mt-6 lg:mt-0">
            <CommunityLink />
          </div>
        </div>
      </div>
      {debug && (
        <button
          onClick={() => {
            const i = path.highestIndex;
            setBeltUp(BELTS[Math.min(i + 1, BELTS.length - 1)]);
          }}
          className="mt-6 text-xs underline text-neutral-400 dark:text-neutral-500"
        >
          Preview belt-up (debug)
        </button>
      )}

      {beltUp && <BeltUpOverlay belt={beltUp} onDone={() => setBeltUp(null)} />}
    </main>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="shrink-0 whitespace-nowrap bg-neutral-100 dark:bg-neutral-900 rounded-lg pl-3 pr-5 py-1.5 lg:pl-4 lg:pr-8 lg:py-2">
      <p className="text-[13px] lg:text-[15px] text-neutral-500 dark:text-neutral-400">{label}</p>
      <p className="text-lg lg:text-xl font-semibold">{value}</p>
    </div>
  );
}
