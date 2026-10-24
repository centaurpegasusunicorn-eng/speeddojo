"use client";

import { useEffect, useRef } from "react";
import { SCENES, type SceneId } from "@/lib/scenes";
import { playUrl } from "@/lib/video";
import { useTheme } from "@/lib/theme";

/*
 * Covers the exercise video with a calm scene. The exercise video keeps
 * running underneath (it drives the click, count-in and rep prompt); the
 * scene just plays along at normal speed while the exercise is playing.
 */
export default function SceneOverlay({ scene, playing }: { scene: SceneId; playing: boolean }) {
  const dark = useTheme() === "dark";
  const ref = useRef<HTMLVideoElement>(null);
  const s = SCENES.find((x) => x.id === scene);
  const file = s ? (dark && s.videoUrlDark ? s.videoUrlDark : s.videoUrl) : "";

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (playing) v.play().catch(() => {});
    else v.pause();
  }, [playing, file]);

  if (!s || scene === "highway") return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
      {file ? (
        <video
          ref={ref}
          key={file}
          src={playUrl(file)}
          muted
          loop
          playsInline
          preload="auto"
          className="w-full h-full object-cover"
        />
      ) : (
        <Placeholder kind={scene} playing={playing} />
      )}
    </div>
  );
}

/* Until the real videos are in: a simple moving stand-in */
function Placeholder({ kind, playing }: { kind: SceneId; playing: boolean }) {
  const state = playing ? "running" : "paused";
  if (kind === "fish") {
    return (
      <div className="w-full h-full relative" style={{ background: "radial-gradient(ellipse at 50% 40%, #1f6f78 0%, #0e3b4a 60%, #072430 100%)" }}>
        {[
          { top: "28%", dur: 14, delay: 0, size: 1, color: "#F97316" },
          { top: "55%", dur: 19, delay: -6, size: 0.8, color: "#FFFFFF" },
          { top: "70%", dur: 16, delay: -11, size: 1.15, color: "#EF4444" },
        ].map((f, i) => (
          <span
            key={i}
            className="absolute -left-[12%] block rounded-[50%] opacity-90"
            style={{
              top: f.top,
              width: `${9 * f.size}%`,
              height: `${3.6 * f.size}%`,
              background: `radial-gradient(ellipse at 35% 50%, ${f.color} 0%, ${f.color}cc 60%, transparent 72%)`,
              animation: `sceneSwim ${f.dur}s linear ${f.delay}s infinite`,
              animationPlayState: state,
            }}
          />
        ))}
        <span className="absolute inset-0" style={{ background: "repeating-radial-gradient(circle at 30% 30%, rgba(255,255,255,0.05) 0 2px, transparent 2px 40px)", animation: "sceneRipple 9s ease-in-out infinite", animationPlayState: state }} />
        <Caption>Fish scene preview</Caption>
      </div>
    );
  }
  return (
    <div className="w-full h-full relative" style={{ background: "linear-gradient(180deg, #2d4a3e 0%, #3f5f4a 38%, #4f6b73 52%, #2c4f63 100%)" }}>
      <span
        className="absolute left-0 right-0 bottom-0 h-[48%]"
        style={{
          background: "repeating-linear-gradient(100deg, rgba(255,255,255,0.10) 0 6px, transparent 6px 46px)",
          backgroundSize: "200% 100%",
          animation: "sceneFlow 6s linear infinite",
          animationPlayState: state,
        }}
      />
      <Caption>Bears scene preview</Caption>
    </div>
  );
}

function Caption({ children }: { children: React.ReactNode }) {
  return (
    <span className="absolute bottom-3 right-4 text-[11px] tracking-[0.2em] uppercase text-white/50">{children}</span>
  );
}
