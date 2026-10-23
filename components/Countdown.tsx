"use client";

import { useEffect, useState, type RefObject } from "react";
import { formatClock } from "@/lib/format";

/**
 * Real-time countdown for the current rep. Accounts for playback speed, so
 * at 130 BPM it shows the actual seconds left. Shown while the exercise is
 * playing, or paused part-way through; hidden before it starts and once it
 * has finished (the "Log your rep" prompt takes its place).
 */
export default function Countdown({
  videoRef,
}: {
  videoRef: RefObject<HTMLVideoElement | null>;
}) {
  const [state, setState] = useState({ remaining: 0, visible: false });

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const update = () => {
      if (!Number.isFinite(video.duration)) {
        setState((s) => (s.visible ? { ...s, visible: false } : s));
        return;
      }
      const rate = video.playbackRate || 1;
      const playing = !video.paused && !video.ended;
      const midway = video.currentTime > 0.05 && !video.ended;
      setState({
        remaining: Math.max(0, (video.duration - video.currentTime) / rate),
        visible: playing || midway,
      });
    };

    update();
    const id = window.setInterval(() => {
      if (!video.paused) update();
    }, 250);
    const events = ["loadedmetadata", "play", "seeked", "ratechange", "ended", "pause", "emptied"];
    events.forEach((e) => video.addEventListener(e, update));

    return () => {
      window.clearInterval(id);
      events.forEach((e) => video.removeEventListener(e, update));
    };
  }, [videoRef]);

  if (!state.visible) return null;

  return (
    <div className="leading-none ml-auto text-right">
      <p className="text-[16px] uppercase tracking-widest text-neutral-600 dark:text-neutral-400 mb-2">
        Time left
      </p>
      <p className="text-5xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
        {formatClock(state.remaining)}
      </p>
    </div>
  );
}
