"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import BpmGauge from "@/components/BpmGauge";
import PathMenu from "@/components/PathMenu";
import ProgressChart from "@/components/ProgressChart";
import Countdown from "@/components/Countdown";
import SignUpButton from "@/components/home/SignUpButton";
import { ClickEngine } from "@/lib/clickEngine";
import { useTheme } from "@/lib/theme";
import { BELTS, REPS_TO_COMPLETE, pathState } from "@/lib/belts";
import { EXERCISES } from "@/lib/mockData";
import { PROGRAM } from "@/lib/programs";

/*
 * The White belt, playable right on the homepage: the real belt path,
 * highway, tempo dial (with its round progress ring), time-left countdown
 * and click. Everything works except logging reps: when the exercise ends,
 * the "log your rep" moment becomes the invitation to sign up.
 *
 * Videos: /home/white.mp4 and white-dark.mp4, lighter copies of the White
 * belt exercise (re-make them if the exercise video changes).
 */
const EX = EXERCISES[0];
const BELT = BELTS[0];

export default function AppDemo() {
  const dark = useTheme() === "dark";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [bpm, setBpm] = useState(EX.startBpm);
  const [playing, setPlaying] = useState(false);
  const [finished, setFinished] = useState(false);
  const name = dark ? "white-dark" : "white";
  const path = useMemo(() => pathState(EXERCISES, []), []);

  // the click, locked to the video's clock
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const engine = new ClickEngine();
    engine.attach(v, { originalBpm: EX.originalBpm, beatsPerBar: 4 });
    engine.setVolume(0.45);
    engine.setAccentVolume(0.7);
    return () => engine.detach();
  }, [name]);

  // tempo = playback speed
  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = bpm / EX.originalBpm;
  }, [bpm, name]);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (finished) {
      v.currentTime = 0;
      setFinished(false);
    }
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  // space bar plays and pauses, as in the app (when not typing in a field)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, button, a, [contenteditable='true']")) return;
      const box = videoRef.current?.getBoundingClientRect();
      if (!box || box.bottom < 0 || box.top > window.innerHeight) return; // only when in view
      e.preventDefault();
      toggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-[var(--background)] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)] p-4 sm:p-6 lg:p-8 text-left">
      {/* top row, as in the app: belt path, then time left / the log-your-rep moment */}
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,32%)] gap-4 lg:gap-8 items-center">
        <div>
          <p className="mb-1 text-center sm:text-left text-[13px] font-semibold tracking-[0.3em] uppercase text-[#CC1010]">
            {PROGRAM.name}
          </p>
          <div className="sm:hidden pt-2">
            <PathMenu exercises={EXERCISES} path={path} currentId={EX.id} straight />
          </div>
          <div className="hidden sm:block">
            <PathMenu exercises={EXERCISES} path={path} currentId={EX.id} />
          </div>
        </div>
        <div className="min-h-[4.5rem] flex items-center justify-center lg:justify-end">
          {finished ? (
            <div className="w-full rounded-xl bg-neutral-100 dark:bg-neutral-900 px-5 py-4" style={{ animation: "buRise 0.4s ease-out both" }}>
              <p className="text-lg font-bold">Was that rep clean?</p>
              <p className="mt-0.5 text-[15px] text-neutral-600 dark:text-neutral-400">
                Make a free account to log it and start earning your White belt.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <SignUpButton
                  label="Log it free"
                  className="rounded-lg px-5 py-2.5 text-[15px] font-bold bg-[#CC1010] text-white hover:bg-[#B00D0D] transition"
                />
                <button type="button" onClick={toggle} className="inline-flex items-center gap-1.5 text-[15px] text-neutral-600 dark:text-neutral-400 hover:underline">
                  <RotateCcw size={15} aria-hidden /> Play again
                </button>
              </div>
            </div>
          ) : (
            <Countdown videoRef={videoRef} />
          )}
        </div>
      </div>

      <div className="mt-4 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,32%)] gap-6 lg:gap-8">
        {/* the highway */}
        <div>
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? "Pause" : "Play"}
            className="relative block w-full rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-800 aspect-video cursor-pointer bg-neutral-200 dark:bg-neutral-900"
          >
            <video
              ref={videoRef}
              key={name}
              src={`/home/${name}.mp4`}
              poster={`/home/${name}.jpg`}
              playsInline
              preload="metadata"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => {
                setPlaying(false);
                setFinished(true);
              }}
              className="block w-full h-full object-cover"
            />
            {!playing && !finished && (
              <span className="absolute inset-0 flex items-center justify-center bg-black/5">
                <span className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#CC1010] text-white flex items-center justify-center shadow-[0_10px_30px_rgba(204,16,16,0.4)]">
                  <Play size={32} fill="currentColor" className="ml-1" aria-hidden />
                </span>
              </span>
            )}
          </button>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xl font-bold">{EX.name}</p>
              <p className="text-[15px] text-neutral-500 dark:text-neutral-400 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,0.25)]" style={{ background: BELT.color }} aria-hidden />
                {BELT.name} Belt · {REPS_TO_COMPLETE} clean reps at {EX.endBpm} BPM earns it
              </p>
            </div>
            <button
              type="button"
              onClick={toggle}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-semibold bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:opacity-90 transition"
            >
              {playing ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}
              {playing ? "Pause" : "Play"}
            </button>
          </div>
        </div>

        {/* dial (its outer ring shows how far through the rep you are) and chart */}
        <div>
          <div className="mx-auto w-full max-w-[300px] lg:max-w-none">
            <BpmGauge bpm={bpm} min={EX.startBpm} max={EX.endBpm} onChange={setBpm} videoRef={videoRef} />
          </div>
          <p className="mt-1 mb-3 text-center text-[14px] text-neutral-500 dark:text-neutral-400">
            Drag the dial to set your tempo.
          </p>
          <ProgressChart
            reps={[]}
            sessions={[]}
            target={null}
          />
        </div>
      </div>
    </div>
  );
}
