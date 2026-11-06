"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import BpmGauge from "@/components/BpmGauge";
import { ClickEngine } from "@/lib/clickEngine";
import { useTheme } from "@/lib/theme";

/*
 * A working slice of the practice screen for the homepage: the real note
 * highway, the real tempo dial and the real click. Drag the dial and the
 * video and click follow, exactly as in the app.
 *
 * The clip (/home/hero.mp4 and hero-dark.mp4) is cut from Shadow Strike,
 * which was recorded at 60 BPM, starting on a beat.
 */
const CLIP_BPM = 60;
const MIN = 40;
const MAX = 120;
const START = 70;

export default function TryIt() {
  const dark = useTheme() === "dark";
  const videoRef = useRef<HTMLVideoElement>(null);
  const engineRef = useRef<ClickEngine | null>(null);
  const [bpm, setBpm] = useState(START);
  const [playing, setPlaying] = useState(false);
  const name = dark ? "hero-dark" : "hero";

  // the click, locked to the video's clock
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const engine = new ClickEngine();
    engine.attach(v, { originalBpm: CLIP_BPM, beatsPerBar: 4 });
    engine.setVolume(0.45);
    engine.setAccentVolume(0.7);
    engineRef.current = engine;
    return () => engine.detach();
  }, [name]);

  // tempo = playback speed
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
    <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 p-3 sm:p-4 grid lg:grid-cols-[minmax(0,1fr)_300px] gap-4 lg:gap-6 items-center">
      <button
        type="button"
        onClick={toggle}
        aria-label={playing ? "Pause" : "Play"}
        className="relative block w-full rounded-xl overflow-hidden bg-neutral-200 dark:bg-neutral-900 aspect-video cursor-pointer"
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
            <span className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#CC1010] text-white flex items-center justify-center shadow-[0_10px_30px_rgba(204,16,16,0.4)]">
              <Play size={32} fill="currentColor" className="ml-1" aria-hidden />
            </span>
          </span>
        )}
      </button>

      <div className="flex flex-col items-center gap-3 pb-2">
        <div className="w-full max-w-[220px] sm:max-w-[260px]">
          <BpmGauge bpm={bpm} min={MIN} max={MAX} onChange={setBpm} videoRef={videoRef} />
        </div>
        <button
          type="button"
          onClick={toggle}
          className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[15px] font-semibold bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 hover:opacity-90 transition"
        >
          {playing ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}
          {playing ? "Pause" : "Play with click"}
        </button>
        <p className="text-[14px] text-neutral-500 dark:text-neutral-400 text-center">
          Drag the dial to change the tempo. The video and click follow.
        </p>
      </div>
    </div>
  );
}
