"use client";

import { useRef, useCallback, useEffect, useState, type RefObject } from "react";
import { useTheme } from "@/lib/theme";

type Props = {
  bpm: number;
  min: number;
  max: number;
  onChange: (bpm: number) => void;
  accentColor?: string;
  /** When given, a ring around the dial fills black as the video plays. */
  videoRef?: RefObject<HTMLVideoElement | null>;
  /** The student's best clean tempo on this exercise: shown as a marker on
   *  the ring. Leave out when they haven't logged a clean rep yet. */
  best?: number;
  /** Tapping the best marker calls this with the best tempo */
  onJumpToBest?: (bpm: number) => void;
};

/*
 * The dial artwork lives in /public/dial.svg (800 x 800 viewBox), with a
 * dark-mode version in /public/dial-dark.svg drawn to the same geometry.
 * These numbers describe the groove the red ring sits in, measured from
 * the artwork's marker ring, in that 800-unit space. If you swap in new
 * artwork, update them (the ring is dead centre at 400, 400).
 */
const VIEWBOX = 800;
const CENTER = VIEWBOX / 2;
const RING_RADIUS = 244; // centre-line of the groove
const RING_WIDTH = 36; // red arc thickness (groove is ~45 wide)

// ─── RING COLOURS ──────────────────────────────────────────────────────────
// TEMPO RING (the thick ring that shows the tempo)
const LIGHT_RING_COLOR = "#CC1010"; // light mode: one solid colour
// dark mode: colours swept around the ring, slowest tempo first
const DARK_RING_COLORS = ["#29F3FD", "#FF04D6", "#7A2BFF"]; // cyan, magenta, purple
const DARK_RING_GLOW = 0.55; // dark mode soft glow strength (0 = none)

// PROGRESS RING (the thin outer ring that fills as the video plays)
const PROGRESS_FILL_LIGHT = "#111111";
const PROGRESS_TRACK_LIGHT = "#E0E0E0"; // the unfilled part
const PROGRESS_FILL_DARK = "#F5F5F5";
const PROGRESS_TRACK_DARK = "#262626";
// ───────────────────────────────────────────────────────────────────────────

/* Colours are blended in OKLab, which keeps the in-between shades vivid
   (a plain RGB blend of cyan and pink goes muddy grey-lilac). */
type Lab = [number, number, number];
function hexToOklab(hex: string): Lab {
  const n = parseInt(hex.slice(1), 16);
  const lin = (c: number) => {
    c /= 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const r = lin((n >> 16) & 255), g = lin((n >> 8) & 255), b = lin(n & 255);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}
function oklabToCss([L, A, B]: Lab): string {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  const enc = (c: number) => {
    c = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
    return Math.round(Math.min(1, Math.max(0, c)) * 255);
  };
  return `rgb(${enc(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s)},${enc(
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
  )},${enc(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s)})`;
}
const RING_LAB = DARK_RING_COLORS.map(hexToOklab);
/** Colour at position t (0 = start of ring, 1 = end) */
function ringColor(t: number): string {
  const x = Math.min(1, Math.max(0, t)) * (RING_LAB.length - 1);
  const i = Math.min(RING_LAB.length - 2, Math.floor(x));
  const f = x - i;
  const [a, b] = [RING_LAB[i], RING_LAB[i + 1]];
  return oklabToCss([a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]);
}
/** Point on the tempo ring at position t (starts at 6 o'clock, clockwise) */
function ringPoint(t: number, radius = RING_RADIUS) {
  const a = Math.PI / 2 + t * 2 * Math.PI;
  return [CENTER + radius * Math.cos(a), CENTER + radius * Math.sin(a)];
}

// ─── BEST-TEMPO POINTER ────────────────────────────────────────────────────
// A small triangle on the inner edge of the ring, pointing out at the
// student's best tempo. Sizes are in the dial's 800-unit space.
const POINTER_TIP = 252; // how far out the tip reaches (ring centre-line = 244)
const POINTER_BASE = 212; // where the flat side sits, on the dial face
const POINTER_HALF_WIDTH = 30; // half the width of the flat side
const POINTER_SHADOW = 0.5; // light mode shadow strength (0-1)
const POINTER_SHADOW_DARK = 0.5; // dark mode (light-coloured) shadow strength
// ───────────────────────────────────────────────────────────────────────────

/** The gradient arc: many short slices, each its own colour, so the colour
 *  follows the curve (an SVG gradient would run in a straight line). */
function GradientArc({ pct }: { pct: number }) {
  const slices = Math.max(1, Math.ceil(pct * 180));
  const parts = [];
  for (let i = 0; i < slices; i++) {
    const t0 = (pct * i) / slices;
    // overlap each slice a touch so no hairline seams show between them
    const t1 = Math.min(pct, (pct * (i + 1)) / slices + 0.002);
    const [x0, y0] = ringPoint(t0);
    const [x1, y1] = ringPoint(t1);
    parts.push(
      <path
        key={i}
        d={`M${x0} ${y0}A${RING_RADIUS} ${RING_RADIUS} 0 0 1 ${x1} ${y1}`}
        stroke={ringColor((t0 + t1) / 2)}
      />
    );
  }
  const [sx, sy] = ringPoint(0);
  const [ex, ey] = ringPoint(pct);
  return (
    <g fill="none" strokeWidth={RING_WIDTH} strokeLinecap="butt">
      {pct > 0 && parts}
      {/* rounded ends, matching the light-mode ring */}
      <circle cx={sx} cy={sy} r={RING_WIDTH / 2} fill={ringColor(0)} stroke="none" />
      <circle cx={ex} cy={ey} r={RING_WIDTH / 2} fill={ringColor(pct)} stroke="none" />
    </g>
  );
}

// Exercise-progress ring that sits just outside the raised disc
const PROGRESS_RADIUS = 300;
const PROGRESS_WIDTH = 10;

export default function BpmGauge({
  bpm,
  min,
  max,
  onChange,
  accentColor = LIGHT_RING_COLOR,
  videoRef,
  best,
  onJumpToBest,
}: Props) {
  const dark = useTheme() === "dark";
  const [bestHover, setBestHover] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const progressRef = useRef<SVGCircleElement>(null);
  const lastPct = useRef(0);

  const pct = Math.min(1, Math.max(0, (bpm - min) / (max - min)));
  const bestT =
    best && best > 0 ? Math.min(1, Math.max(0, (best - min) / (max - min))) : null;
  const atBest = best !== undefined && bpm === best;
  lastPct.current = pct;

  // Drive the progress ring from the video's clock. Written straight to the
  // DOM so it can update every frame without re-rendering the page.
  useEffect(() => {
    const video = videoRef?.current;
    const ring = progressRef.current;
    if (!video || !ring) return;

    let raf = 0;
    const draw = () => {
      const d = video.duration;
      const p = Number.isFinite(d) && d > 0 ? video.currentTime / d : 0;
      ring.setAttribute("stroke-dasharray", `${Math.min(1, p) * 100} 100`);
    };
    const loop = () => {
      draw();
      if (!video.paused && !video.ended) raf = requestAnimationFrame(loop);
    };
    const kick = () => {
      cancelAnimationFrame(raf);
      loop();
    };

    const events = ["play", "pause", "seeked", "loadedmetadata", "ended", "emptied"];
    events.forEach((e) => video.addEventListener(e, kick));
    kick();

    return () => {
      cancelAnimationFrame(raf);
      events.forEach((e) => video.removeEventListener(e, kick));
    };
  }, [videoRef]);

  // Full 360 degree dial: min at 6 o'clock (bottom), clockwise to max
  const pointerToBpm = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return bpm;
      const rect = svg.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let angle = (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI - 90;
      if (angle < 0) angle += 360;
      let next = angle / 360;

      // Stop the dial wrapping from max straight back to min
      if (lastPct.current > 0.75 && next < 0.25) next = 1;
      else if (lastPct.current < 0.25 && next > 0.75) next = 0;

      return Math.round(min + next * (max - min));
    },
    [bpm, min, max]
  );

  function handlePointerDown(e: React.PointerEvent) {
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
    onChange(pointerToBpm(e.clientX, e.clientY));
  }
  function handlePointerMove(e: React.PointerEvent) {
    if (e.buttons !== 1) return;
    onChange(pointerToBpm(e.clientX, e.clientY));
  }

  return (
    <div
      className="relative w-full max-w-[460px] mx-auto aspect-square"
      style={{ containerType: "inline-size" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dark ? "/dial-dark.svg" : "/dial.svg"}
        alt=""
        draggable={false}
        className="absolute inset-0 w-full h-full select-none pointer-events-none"
      />

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        className="absolute inset-0 w-full h-full cursor-pointer touch-none select-none"
      >
        <defs>
          <mask id="pointerShadowMask" maskUnits="userSpaceOnUse" x="0" y="0" width={VIEWBOX} height={VIEWBOX}>
            <rect width={VIEWBOX} height={VIEWBOX} fill="white" />
            {/* hide only the shadow behind the flat edge; the slanted
                sides keep theirs */}
            <circle cx={CENTER} cy={CENTER} r={Math.hypot(POINTER_BASE, POINTER_HALF_WIDTH) + 2} fill="black" />
          </mask>
          <filter id="pointerShadow" x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow
              dx="0"
              dy="3"
              stdDeviation="4"
              // dark mode: a light shadow, so it reads on the black page
              floodColor={dark ? "#FFFFFF" : "#000000"}
              floodOpacity={dark ? POINTER_SHADOW_DARK : POINTER_SHADOW}
            />
          </filter>
          <filter id="tempoGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>
        {videoRef && (
          <>
            <circle
              cx={CENTER}
              cy={CENTER}
              r={PROGRESS_RADIUS}
              fill="none"
              stroke={dark ? PROGRESS_TRACK_DARK : PROGRESS_TRACK_LIGHT}
              strokeWidth={PROGRESS_WIDTH}
            />
            <circle
              ref={progressRef}
              cx={CENTER}
              cy={CENTER}
              r={PROGRESS_RADIUS}
              fill="none"
              stroke={dark ? PROGRESS_FILL_DARK : PROGRESS_FILL_LIGHT}
              strokeWidth={PROGRESS_WIDTH}
              pathLength={100}
              strokeDasharray="0 100"
              transform={`rotate(-90 ${CENTER} ${CENTER})`}
            />
          </>
        )}
        {dark ? (
          <>
            {DARK_RING_GLOW > 0 && (
              <g filter="url(#tempoGlow)" opacity={DARK_RING_GLOW}>
                <GradientArc pct={pct} />
              </g>
            )}
            <GradientArc pct={pct} />
          </>
        ) : (
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RING_RADIUS}
          fill="none"
          stroke={accentColor}
          strokeWidth={RING_WIDTH}
          strokeLinecap="round"
          pathLength={100}
          // tiny minimum so the lowest tempo still shows as a round dot
          strokeDasharray={`${Math.max(pct * 100, 0.001)} 100`}
          transform={`rotate(90 ${CENTER} ${CENTER})`}
        />
        )}

        {/* Best-tempo pointer: tap it to jump the dial to your best */}
        {bestT !== null && (() => {
          const a = Math.PI / 2 + bestT * 2 * Math.PI;
          const [tx, ty] = ringPoint(bestT, POINTER_TIP);
          const [bx, by] = ringPoint(bestT, POINTER_BASE);
          // corners of the flat side, at right angles to the pointer
          const ox = -Math.sin(a) * POINTER_HALF_WIDTH;
          const oy = Math.cos(a) * POINTER_HALF_WIDTH;
          const points = `${tx},${ty} ${bx + ox},${by + oy} ${bx - ox},${by - oy}`;
          const [cx, cy] = ringPoint(bestT, (POINTER_TIP + POINTER_BASE) / 2);
          const jump = () => onJumpToBest?.(best!);
          return (
            <g
              role="button"
              tabIndex={0}
              aria-label={atBest ? `At your best, ${best} BPM` : `Set tempo to your best, ${best} BPM`}
              className="cursor-pointer outline-none group"
              // don't let the dial's own drag handler treat this as a turn
              onPointerDown={(e) => e.stopPropagation()}
              onClick={jump}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  jump();
                }
              }}
              onMouseEnter={() => setBestHover(true)}
              onMouseLeave={() => setBestHover(false)}
              onFocus={() => setBestHover(true)}
              onBlur={() => setBestHover(false)}
            >
              {/* generous invisible tap area */}
              <circle cx={cx} cy={cy} r={40} fill="transparent" />
              {(() => {
                // Both layers scale together on hover and pop on reaching
                // your best (same shape, so the same centre point)
                const motion = {
                  className:
                    "", // no hover growth: the caption change is enough
                  style: {
                    transformBox: "fill-box" as const,
                    transformOrigin: "center",
                    animation: atBest ? "bestPop 0.5s ease-out 1" : undefined,
                  },
                };
                const fill = dark ? "#242424" : "#FFFFFF";
                return (
                  // key changes on reaching your best, replaying the pop
                  <g key={atBest ? "best" : "below"}>
                    {/* shadow layer, hidden over the dial face so the flat
                        edge casts no shadow; only the part over the ring does */}
                    <g mask="url(#pointerShadowMask)">
                      <g {...motion}>
                        <polygon
                          points={points}
                          fill={fill}
                          stroke={fill}
                          strokeWidth={4}
                          strokeLinejoin="round"
                          filter="url(#pointerShadow)"
                        />
                      </g>
                    </g>
                    {/* the crisp pointer on top */}
                    <g {...motion}>
                      <polygon
                        points={points}
                        fill={fill}
                        stroke={fill}
                        strokeWidth={4}
                        strokeLinejoin="round"
                      />
                    </g>
                  </g>
                );
              })()}
            </g>
          );
        })()}
      </svg>


      {/* Number sits in the middle of the dial, BPM directly underneath */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span
          className="font-bold tabular-nums leading-none"
          style={{ fontSize: "24cqw" }}
        >
          {bpm}
        </span>
      </div>
      {/* Caption under the number, always in the standard BPM style:
          "BPM" normally, "BEST: 82" while the pointer is hovered or
          focused, "BEST BPM" whenever the dial is at the student's best. */}
      <span
        className="absolute left-0 right-0 text-center text-neutral-500 dark:text-neutral-400 tracking-wide leading-none pointer-events-none"
        style={{ fontSize: "6cqw", top: "calc(50% + 11cqw)" }}
      >
        {bestT !== null && atBest
          ? "BEST BPM"
          : bestT !== null && bestHover
          ? `BEST: ${best}`
          : "BPM"}
      </span>
    </div>
  );
}
