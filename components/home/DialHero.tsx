"use client";

import { useEffect, useRef, useState } from "react";
import SignUpForm from "@/components/home/SignUpForm";
import { Pause, Play } from "lucide-react";
import BpmGauge from "@/components/BpmGauge";
import { ClickEngine } from "@/lib/clickEngine";
import { useTheme } from "@/lib/theme";

/*
 * Homepage hero: the headline, then the real tempo dial, huge and centred,
 * rising from the bottom of the screen with its middle on the fold. Drag it
 * and press play: the click and the note highway (just below) follow the
 * tempo, exactly as in the app.
 *
 * The clip (/home/hero.mp4, hero-dark.mp4) is cut from Shadow Strike,
 * recorded at 60 BPM, starting on a beat.
 */
const CLIP_BPM = 60;
const MIN = 40;
const MAX = 120;
const START = 72;
// The dial's width: the fold cuts it in half, so this also sets how much
// room the headline gets above it
const DIAL = "min(94vw, 860px, 92svh)";
// The dial artwork has empty space around the ring; tuck that up under the
// text so the ring itself is what sits half above the fold
const TUCK = 0.09;

export default function DialHero({
  headline,
  body,
  primary,
  note,
  hint,
}: {
  headline: string;
  body: string;
  primary: string;
  note: string;
  hint: string;
}) {
  const dark = useTheme() === "dark";
  const videoRef = useRef<HTMLVideoElement>(null);
  const [bpm, setBpm] = useState(START);
  const [playing, setPlaying] = useState(false);
  const name = dark ? "hero-dark" : "hero";

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
    <section className="px-4 sm:px-8 overflow-x-clip">
      {/* everything above the dial fits in the screen minus half the dial */}
      <div
        className="max-w-5xl mx-auto flex flex-col items-center justify-center text-center pt-4 pb-2"
        style={{ minHeight: `calc(100svh - 5rem - ${DIAL} * ${0.5 - TUCK})` }}
      >
        <h1 className="wide text-[2.2rem] leading-[1.03] sm:text-5xl lg:text-[3.9rem] font-extrabold tracking-[-0.025em]">
          {headline}
        </h1>
        <p className="mt-4 text-lg sm:text-xl leading-relaxed text-neutral-600 dark:text-neutral-400 max-w-[44rem]">
          {body}
        </p>
        {/* sign up right here, no trip to another page */}
        <div id="start" className="mt-6 w-full max-w-2xl">
          <SignUpForm row cta={primary} />
        </div>
        <p className="mt-1 text-[15px] text-neutral-500 dark:text-neutral-400">{note}</p>
      </div>

      {/* the dial: its centre sits on the fold */}
      <div className="relative mx-auto" style={{ width: DIAL, marginTop: `calc(${DIAL} * -${TUCK})` }}>
        <BpmGauge bpm={bpm} min={MIN} max={MAX} onChange={setBpm} videoRef={videoRef} large />
      </div>
      <div className="mt-3 flex flex-col items-center gap-2">
        <button
          type="button"
          onClick={toggle}
          className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[16px] font-semibold bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:opacity-90 transition"
        >
          {playing ? <Pause size={18} aria-hidden /> : <Play size={18} aria-hidden />}
          {playing ? "Pause" : "Play with click"}
        </button>
        <p className="text-center text-[15px] text-neutral-500 dark:text-neutral-400">{hint}</p>
      </div>

      {/* the highway the dial is driving */}
      <div className="max-w-5xl mx-auto mt-10">
        <button
          type="button"
          onClick={toggle}
          aria-label={playing ? "Pause" : "Play"}
          className="relative block w-full rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 aspect-video cursor-pointer bg-neutral-200 dark:bg-neutral-900"
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
            <span className="absolute inset-0 flex items-center justify-center bg-black/10">
              <span className="w-20 h-20 rounded-full bg-[#CC1010] text-white flex items-center justify-center shadow-[0_10px_30px_rgba(204,16,16,0.4)]">
                <Play size={34} fill="currentColor" className="ml-1" aria-hidden />
              </span>
            </span>
          )}
        </button>
      </div>
    </section>
  );
}
