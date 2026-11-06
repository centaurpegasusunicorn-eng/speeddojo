"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import BpmGauge from "@/components/BpmGauge";
import PathMenu from "@/components/PathMenu";
import ProgressChart from "@/components/ProgressChart";
import { ClickEngine } from "@/lib/clickEngine";
import { useTheme } from "@/lib/theme";
import { BELTS, REPS_TO_COMPLETE, pathState, type Rep } from "@/lib/belts";
import { EXERCISES } from "@/lib/mockData";
import { PROGRAM } from "@/lib/programs";

/*
 * A live copy of the practice screen for the homepage: belt path, note
 * highway, tempo dial and progress chart, laid out as in the app. The dial,
 * play button and click all work; the progress is an example student's
 * (labelled as such). The clip is cut from Shadow Strike, recorded at
 * 60 BPM, starting on a beat.
 */
const CLIP_BPM = 60;
const EX = EXERCISES[1]; // the example student is working on belt 2
const BEST = 84;

// An example student's last fortnight on this exercise (and the White belt done)
function exampleReps(): { reps: Rep[]; sessions: { day: string; seconds: number }[] } {
  const reps: Rep[] = [];
  const sessions: { day: string; seconds: number }[] = [];
  const day = (ago: number) => {
    const d = new Date();
    d.setDate(d.getDate() - ago);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  for (let i = 0; i < REPS_TO_COMPLETE; i++)
    reps.push({ id: `w${i}`, exerciseId: EXERCISES[0].id, bpm: EXERCISES[0].endBpm, clean: true, createdAt: day(20) });
  const tempos = [62, 64, 66, 66, 70, 72, 72, 75, 78, 78, 80, 82, 84];
  tempos.forEach((t, i) => {
    const ago = 13 - i;
    reps.push({ id: `a${i}`, exerciseId: EX.id, bpm: t, clean: true, createdAt: day(ago) });
    if (i % 3 === 1) reps.push({ id: `b${i}`, exerciseId: EX.id, bpm: t + 2, clean: false, createdAt: day(ago) });
    sessions.push({ day: day(ago), seconds: 900 + ((i * 337) % 900) });
  });
  return { reps, sessions };
}

export default function AppDemo() {
  const dark = useTheme() === "dark";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [bpm, setBpm] = useState(76);
  const [playing, setPlaying] = useState(false);
  const name = dark ? "hero-dark" : "hero";
  const { reps, sessions } = useMemo(exampleReps, []);
  const path = useMemo(() => pathState(EXERCISES, reps), [reps]);
  const belt = BELTS[1];
  const progress = path.progress[1];

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const engine = new ClickEngine();
    engine.attach(v, { originalBpm: CLIP_BPM, beatsPerBar: 4 });
    engine.setVolume(0.45);
    engine.setAccentVolume(0.7);
    return () => engine.detach();
  }, [name]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = bpm / CLIP_BPM;
  }, [bpm, name]);

  const toggle = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  };

  return (
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-[var(--background)] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)] p-4 sm:p-6 lg:p-8 text-left">
      {/* belt path, as at the top of the practice page */}
      <p className="mb-1 text-center sm:text-left text-[13px] font-semibold tracking-[0.3em] uppercase text-[#CC1010]">
        {PROGRAM.name}
      </p>
      <div className="sm:hidden pt-2">
        <PathMenu exercises={EXERCISES} path={path} currentId={EX.id} straight />
      </div>
      <div className="hidden sm:block lg:w-[70%]">
        <PathMenu exercises={EXERCISES} path={path} currentId={EX.id} />
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
              loop
              muted
              playsInline
              preload="auto"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              className="block w-full h-full object-cover"
            />
            {!playing && (
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
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: belt.color }} aria-hidden />
                {belt.name} Belt · {progress.cleanAtEnd} of {REPS_TO_COMPLETE} clean reps at {EX.endBpm} BPM
              </p>
            </div>
            <button
              type="button"
              onClick={toggle}
              className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-semibold bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:opacity-90 transition"
            >
              {playing ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}
              {playing ? "Pause" : "Play with click"}
            </button>
          </div>
        </div>

        {/* dial and chart */}
        <div>
          <div className="mx-auto w-full max-w-[300px] lg:max-w-none">
            <BpmGauge
              bpm={bpm}
              min={EX.startBpm}
              max={EX.endBpm + 30}
              onChange={setBpm}
              videoRef={videoRef}
              best={BEST}
              onJumpToBest={setBpm}
            />
          </div>
          <p className="mt-1 mb-3 text-center text-[14px] text-neutral-500 dark:text-neutral-400">
            Drag the dial to change the tempo.
          </p>
          <ProgressChart
            reps={reps.filter((r) => r.exerciseId === EX.id)}
            sessions={sessions}
            target={{ name: belt.name, tempo: EX.endBpm, progress: progress.cleanAtEnd, needed: REPS_TO_COMPLETE }}
          />
          <p className="mt-2 text-[13px] text-neutral-400 dark:text-neutral-500">Example progress</p>
        </div>
      </div>
    </div>
  );
}
