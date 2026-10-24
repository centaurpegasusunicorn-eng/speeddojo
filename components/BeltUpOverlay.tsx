"use client";

import { useEffect, useRef, useState } from "react";
import { BELTS, type Belt, type Rep } from "@/lib/belts";
import { EXERCISES } from "@/lib/mockData";
import { Camera } from "lucide-react";
import BeltPhoto from "@/components/BeltPhoto";

/*
 * THE BELT-UP CELEBRATION
 * Plays when a student earns a belt: the belt ties itself on, light bursts
 * out behind it, confetti flies, and the belt count fills up. Stays until
 * they press Continue (or Esc / Enter).
 */

// ─── SETTINGS ───────────────────────────────────────────────────────────────
const GOLD = "#F5C542"; // accents, and the Black belt's stripe
const RED = "#CC1010";
const CONFETTI_PIECES = 160;
// Optional celebration sound: put an audio file in /public and name it here,
// e.g. "/belt-up.mp3". Leave "" for silence.
const BELT_UP_SOUND = "";
// ────────────────────────────────────────────────────────────────────────────

export default function BeltUpOverlay({
  belt,
  reps = [],
  onDone,
}: {
  belt: Belt;
  /** the student's logged reps, for the "60 → 90 BPM in 12 days" line */
  reps?: Rep[];
  onDone: () => void;
}) {
  const index = Math.max(0, BELTS.findIndex((b) => b.name === belt.name));
  const total = BELTS.length;
  const isBlack = index === total - 1;
  const exercise = EXERCISES[index];
  const journey = exercise ? journeyLine(exercise, reps) : "";
  const lightBelt = belt.name === "White" || belt.name === "Silver";
  const glow = belt.name === "Black" ? GOLD : belt.color;

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [closing, setClosing] = useState(false);
  const [photo, setPhoto] = useState(false);
  const photoRef = useRef(false);
  photoRef.current = photo;

  const close = () => {
    if (closing) return;
    setClosing(true);
    setTimeout(onDone, 350);
  };

  // Keyboard: Esc / Enter close; nothing reaches the practice page behind
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      e.stopPropagation();
      if (photoRef.current) {
        // the photo screen is open: Esc closes just that
        if (e.key === "Escape") setPhoto(false);
        return;
      }
      if (e.key === "Escape" || e.key === "Enter") {
        e.preventDefault();
        close();
      } else if (e.key === " ") {
        e.preventDefault();
      }
    };
    window.addEventListener("keydown", onKey, true);
    const t = setTimeout(() => buttonRef.current?.focus(), 2600);
    return () => {
      window.removeEventListener("keydown", onKey, true);
      clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sound, if one is set
  useEffect(() => {
    if (!BELT_UP_SOUND) return;
    const a = new Audio(BELT_UP_SOUND);
    a.play().catch(() => {});
    return () => a.pause();
  }, []);

  // Confetti burst when the belt lands
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = (canvas.width = window.innerWidth * dpr);
    const H = (canvas.height = window.innerHeight * dpr);
    const colors = isBlack
      ? [GOLD, GOLD, "#FFFFFF", "#FFE9A8"]
      : [belt.color, belt.color, GOLD, "#FFFFFF", RED];

    type P = { x: number; y: number; vx: number; vy: number; r: number; spin: number; a: number; w: number; h: number; c: string; life: number };
    const parts: P[] = [];
    const burst = (n: number, power: number) => {
      for (let i = 0; i < n; i++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = (0.35 + Math.random()) * power * dpr;
        parts.push({
          x: W / 2,
          y: H * 0.36,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp - 6 * dpr,
          r: Math.random() * Math.PI,
          spin: (Math.random() - 0.5) * 0.4,
          a: 1,
          w: (6 + Math.random() * 6) * dpr,
          h: (3 + Math.random() * 4) * dpr,
          c: colors[(Math.random() * colors.length) | 0],
          life: 0,
        });
      }
    };

    let raf = 0;
    const start = performance.now();
    let fired = 0;
    const tick = (now: number) => {
      const t = now - start;
      if (fired === 0 && t > 950) { burst(CONFETTI_PIECES, 16); fired = 1; }
      if (fired === 1 && t > 1500) { burst(CONFETTI_PIECES / 2, 11); fired = 2; }
      ctx.clearRect(0, 0, W, H);
      for (const p of parts) {
        p.life++;
        p.vx *= 0.985;
        p.vy = p.vy * 0.985 + 0.32 * dpr;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.spin;
        if (p.life > 90) p.a -= 0.012;
        if (p.a <= 0) continue;
        ctx.save();
        ctx.globalAlpha = p.a;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.scale(1, Math.cos(p.life * 0.15)); // flutter
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
      if (t < 7000) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [belt.color, isBlack]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${belt.name} belt earned`}
      className="belt-up fixed inset-0 z-50 overflow-hidden flex flex-col items-center justify-center text-white select-none"
      style={{
        background: `radial-gradient(ellipse at 50% 38%, color-mix(in oklab, ${glow} 38%, #0a0a0a) 0%, #0a0a0a 55%, #000 100%)`,
        animation: closing ? "buFadeOut 0.35s ease-in forwards" : "buFadeIn 0.4s ease-out both",
      }}
    >
      {/* light rays, slowly turning */}
      <div
        aria-hidden
        className="absolute left-1/2 top-[38%] w-[220vmax] h-[220vmax] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
        style={{
          background: `repeating-conic-gradient(from 0deg, color-mix(in oklab, ${glow} 30%, transparent) 0deg 6deg, transparent 6deg 18deg)`,
          maskImage: "radial-gradient(circle, black 0%, transparent 32%)",
          WebkitMaskImage: "radial-gradient(circle, black 0%, transparent 32%)",
          animation: "buRaysIn 1.2s 0.2s ease-out both, buSpin 40s linear infinite",
        }}
      />
      {/* shockwave ring when the belt lands */}
      <div
        aria-hidden
        className="absolute left-1/2 top-[38%] w-[40vmin] h-[40vmin] -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          border: `3px solid ${glow}`,
          boxShadow: `0 0 40px ${glow}`,
          animation: "buShock 0.9s 0.9s cubic-bezier(0.2,0.7,0.3,1) both",
        }}
      />

      <canvas ref={canvasRef} aria-hidden className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* everything gives a little jolt when the belt lands */}
      <div className="relative flex flex-col items-center px-6 w-full" style={{ animation: "buShake 0.4s 0.92s both" }}>
        <BeltKnot color={belt.color} light={lightBelt} black={isBlack} glow={glow} />

        <p
          className="mt-6 sm:mt-8 text-[13px] sm:text-sm font-semibold tracking-[0.5em] uppercase"
          style={{ color: GOLD, animation: "buRise 0.6s 1.1s ease-out both" }}
        >
          {isBlack ? "Mastery" : "Belt earned"}
        </p>
        <h1
          className="mt-2 text-6xl sm:text-8xl md:text-9xl font-black tracking-tight text-center leading-none"
          style={{
            animation: "buSlam 0.7s 1.25s cubic-bezier(0.2,1.5,0.4,1) both",
            textShadow: `0 0 40px color-mix(in oklab, ${glow} 70%, transparent), 0 4px 0 rgba(0,0,0,0.35)`,
          }}
        >
          {belt.name} Belt
        </h1>
        {exercise && (
          <p
            className="mt-4 text-[16px] sm:text-xl text-white/75 text-center"
            style={{ animation: "buRise 0.6s 1.7s ease-out both" }}
          >
            {isBlack
              ? "All 12 belts earned. The full path is complete."
              : journey}
          </p>
        )}

        {/* the belt count filling up */}
        <div
          className="mt-7 sm:mt-9 flex flex-col items-center gap-2.5"
          style={{ animation: "buRise 0.5s 1.95s ease-out both" }}
        >
          <div className="flex gap-1.5 sm:gap-2">
            {BELTS.map((b, i) => (
              <span
                key={b.name}
                className="block w-5 sm:w-8 h-2.5 sm:h-3 rounded-full"
                style={{
                  background: i <= index ? b.color : "rgba(255,255,255,0.14)",
                  boxShadow:
                    i === index
                      ? `0 0 0 2px ${GOLD}, 0 0 16px ${glow}`
                      : i <= index && (b.name === "Black" || b.name === "White")
                      ? "inset 0 0 0 1px rgba(255,255,255,0.5)"
                      : undefined,
                  animation:
                    i < index
                      ? `buPip 0.3s ${2.05 + i * 0.06}s ease-out both`
                      : i === index
                      ? `buPipNew 0.6s ${2.15 + index * 0.06}s cubic-bezier(0.2,1.6,0.4,1) both`
                      : undefined,
                }}
              />
            ))}
          </div>
          <p className="text-[13px] sm:text-sm tracking-[0.2em] uppercase text-white/60">
            {index + 1} of {total} belts
          </p>
        </div>

        <div
          className="mt-8 sm:mt-10 flex flex-col-reverse sm:flex-row items-center gap-3 sm:gap-4"
          style={{ animation: "buRise 0.5s 2.7s ease-out both" }}
        >
          <button
            type="button"
            onClick={() => setPhoto(true)}
            className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-lg font-bold text-white bg-white/10 hover:bg-white/20 transition outline-none focus-visible:ring-4 focus-visible:ring-white/40"
          >
            <Camera size={20} aria-hidden /> Take your belt photo
          </button>
          <button
            ref={buttonRef}
            type="button"
            onClick={close}
            className="rounded-full px-9 py-3.5 text-lg font-bold text-black transition hover:scale-[1.04] active:scale-[0.98] outline-none focus-visible:ring-4 focus-visible:ring-white/40"
            style={{
              background: GOLD,
              boxShadow: `0 8px 30px color-mix(in oklab, ${GOLD} 45%, transparent)`,
            }}
          >
            Continue
          </button>
        </div>
      </div>

      {photo && (
        <BeltPhoto
          beltName={belt.name}
          beltColor={belt.color}
          beltIndex={index}
          allBelts={BELTS}
          line={
            isBlack
              ? "All 12 belts earned"
              : journey || `Belt ${index + 1} of ${total}`
          }
          onClose={() => setPhoto(false)}
        />
      )}
    </div>
  );
}

/* The progress story: "Silent Step: 60 → 90 BPM in 12 days". Falls back to
   "Silent Step mastered at 90 BPM" if they started at the target already. */
function journeyLine(ex: { id: string; name: string; endBpm: number }, reps: Rep[]): string {
  const mine = reps.filter((r) => r.exerciseId === ex.id);
  if (mine.length === 0) return `${ex.name} mastered at ${ex.endBpm} BPM`;
  const first = mine.reduce((a, b) => (b.createdAt < a.createdAt ? b : a));
  const from = Math.min(...mine.filter((r) => r.createdAt === first.createdAt).map((r) => r.bpm));
  if (from >= ex.endBpm) return `${ex.name} mastered at ${ex.endBpm} BPM`;
  const start = new Date(first.createdAt + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const days = Math.max(1, Math.round((today.getTime() - start.getTime()) / 86_400_000) + 1);
  return `${ex.name}: ${from} → ${ex.endBpm} BPM in ${days} day${days === 1 ? "" : "s"}`;
}

/* A tied martial-arts belt: it slides in, the knot pops, the tails swing
   down, then a sheen runs along it */
function BeltKnot({ color, light, black, glow }: { color: string; light: boolean; black: boolean; glow: string }) {
  const edge = light ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.22)";
  const stitch = light ? "rgba(0,0,0,0.16)" : "rgba(255,255,255,0.28)";
  const shadeId = "bu-shade";
  const sheenId = "bu-sheen";
  const clipId = "bu-clip";
  // curved like it's tied round a waist; tails hang from under the knot
  const band = "M10 62 Q300 96 590 62 L590 114 Q300 148 10 114 Z";
  const tailL = "M266 126 L304 126 L274 272 L230 262 Z";
  const tailR = "M296 126 L334 126 L370 262 L326 272 Z";
  const knot = "M262 68 Q300 60 338 68 L347 142 Q300 153 253 142 Z";
  return (
    <svg
      viewBox="0 0 600 290"
      className="w-[min(88vw,560px)] h-auto overflow-visible"
      aria-hidden
      style={{ filter: `drop-shadow(0 0 28px color-mix(in oklab, ${glow} 55%, transparent)) drop-shadow(0 18px 24px rgba(0,0,0,0.5))` }}
    >
      <defs>
        <linearGradient id={shadeId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.3" />
        </linearGradient>
        <linearGradient id={sheenId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.7" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={clipId}>
          <path d={band} />
          <path d={tailL} />
          <path d={tailR} />
          <path d={knot} />
        </clipPath>
      </defs>

      {/* tails swing down from the knot */}
      <g style={{ transformOrigin: "300px 130px", animation: "buTailL 0.6s 0.75s cubic-bezier(0.3,1.6,0.5,1) both" }}>
        <path d={tailL} fill={color} stroke={edge} strokeWidth={2} />
        <path d={tailL} fill={`url(#${shadeId})`} />
        {black && <path d="M238 228 L282 232 L279 247 L235 243 Z" fill={GOLD} />}
      </g>
      <g style={{ transformOrigin: "300px 130px", animation: "buTailR 0.6s 0.75s cubic-bezier(0.3,1.6,0.5,1) both" }}>
        <path d={tailR} fill={color} stroke={edge} strokeWidth={2} />
        <path d={tailR} fill={`url(#${shadeId})`} />
        {black && <path d="M362 228 L318 232 L321 247 L365 243 Z" fill={GOLD} />}
      </g>

      {/* the band wraps in from both sides */}
      <g style={{ transformOrigin: "300px 105px", animation: "buBand 0.65s 0.3s cubic-bezier(0.2,1.2,0.4,1) both" }}>
        <path d={band} fill={color} stroke={edge} strokeWidth={2} />
        <path d={band} fill={`url(#${shadeId})`} />
        <path d="M24 76 Q300 109 576 76 M24 100 Q300 133 576 100" stroke={stitch} strokeWidth={2} strokeDasharray="7 6" fill="none" />
      </g>

      {/* the knot pops on top */}
      <g style={{ transformOrigin: "300px 105px", animation: "buKnot 0.5s 0.65s cubic-bezier(0.2,1.8,0.4,1) both" }}>
        <path d={knot} fill={color} stroke={edge} strokeWidth={2} />
        <path d={knot} fill={`url(#${shadeId})`} />
        <path d="M267 83 Q300 76 333 83 M259 128 Q300 137 341 128" stroke={stitch} strokeWidth={2} fill="none" />
      </g>

      {/* sheen sweeping along the belt */}
      <g clipPath={`url(#${clipId})`}>
        <rect
          x={-160}
          y={0}
          width={140}
          height={290}
          fill={`url(#${sheenId})`}
          style={{ animation: "buSheen 2.6s 1.4s ease-in-out infinite" }}
        />
      </g>
    </svg>
  );
}
