"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { BELTS, REPS_TO_COMPLETE, textOn, type PathState } from "@/lib/belts";
import { useTheme } from "@/lib/theme";

// Neutral greys for each theme (belt colours and the red trail stay the same)
const LIGHT = { trail: "#AEAEAE", lockFill: "#F5F5F5", lockEdge: "#D4D4D4", ink: "#171717", paper: "var(--background)", track: "#EDEDED" };
const DARK = { trail: "#666666", lockFill: "#3D3D3D", lockEdge: "#666666", ink: "#EDEDED", paper: "var(--background)", track: "#262626" };

// Padlock on paid belts (students without the full dojo)
const PADLOCK_LIGHT = "#8A8A8A";
const PADLOCK_DARK = "#A3A3A3";
const PADLOCK_SIZE = 1; // 1 = fills most of the dot

/** A small padlock centred on (x, y), r = the dot's radius */
function Padlock({ x, y, r, color }: { x: number; y: number; r: number; color: string }) {
  const s = r * 0.95 * PADLOCK_SIZE;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} pointerEvents="none" aria-hidden>
      <path d="M-0.3 -0.02 V-0.28 A0.3 0.3 0 0 1 0.3 -0.28 V-0.02" fill="none" stroke={color} strokeWidth={0.17} />
      <rect x={-0.46} y={-0.06} width={0.92} height={0.64} rx={0.13} fill={color} />
    </g>
  );
}

/*
 * The winding path of belts. One stop per exercise, in order:
 *  - completed: a solid belt-coloured knot (click to revisit)
 *  - the one you're on: larger, with a red ring showing clean reps so far
 *    and a slow pulsing halo (click to open)
 *  - locked: pale grey, not clickable
 * The completed stretch of the trail is drawn in red.
 */

const X0 = 80;
const DX = 94;
const Y_HI = 300;
const Y_LO = 340;
const K = 0.7; // dot size scale (all stops and their rings)

// ─── THE BELT YOU'RE WORKING TOWARDS ───────────────────────────────────────
const CURRENT_SIZE = 1.2; // circle size (1 = the original size)
const PULSE_EVERY_SECONDS = 10; // one pulse this often
const PULSE_LENGTH_SECONDS = 2.4; // how long each pulse takes to fade out
const PULSE_SPREAD = 2.2; // how far it spreads (x the circle's size)
// ───────────────────────────────────────────────────────────────────────────
const C = K * CURRENT_SIZE;

// ─── PHONE VERSION: a straight row that fits the screen ────────────────────
// Stops sit STRAIGHT_GAP apart in a box STRAIGHT_WIDTH wide (in drawing units).
// A smaller width makes every dot bigger on screen; keep the gap at roughly
// STRAIGHT_WIDTH / 12.
const STRAIGHT_WIDTH = 600;
const STRAIGHT_GAP = 49;
// ───────────────────────────────────────────────────────────────────────────

type Pt = { x: number; y: number };
const wavePos = (i: number): Pt => ({ x: X0 + i * DX, y: i % 2 === 0 ? Y_LO : Y_HI });
const straightPos = (i: number): Pt => ({ x: 30 + i * STRAIGHT_GAP, y: 40 });

function trail(pos: (i: number) => Pt, upTo: number, straight: boolean): string {
  if (straight) return `M${pos(0).x} ${pos(0).y}L${pos(upTo).x} ${pos(upTo).y}`;
  let d = `M${pos(0).x} ${pos(0).y}`;
  for (let i = 1; i <= upTo; i++) {
    const a = pos(i - 1);
    const b = pos(i);
    const mid = (a.x + b.x) / 2;
    d += `C${mid} ${a.y} ${mid} ${b.y} ${b.x} ${b.y}`;
  }
  return d;
}

export default function PathMenu({
  exercises,
  path,
  currentId,
  straight = false,
  paidFrom,
}: {
  exercises: { id: string; name?: string }[];
  path: PathState;
  currentId?: string;
  /** Phones: a straight row with the selected belt's name underneath */
  straight?: boolean;
  /** Belts from this index on get a padlock (not a member yet) */
  paidFrom?: number;
}) {
  const pos = straight ? straightPos : wavePos;
  // drawing box: [left, top, width, height]
  const box = straight ? [0, 0, STRAIGHT_WIDTH, 80] : [0, 264, 1200, 112];
  const router = useRouter();
  const dark = useTheme() === "dark";
  const c = dark ? DARK : LIGHT;
  const n = exercises.length;
  const redUpTo = Math.min(path.currentIndex, n - 1);
  const shadowId = useId();

  // Hover label (custom, so it can match the chart's tooltip size/style)
  const [tip, setTip] = useState<{ x: number; y: number; text: string } | null>(null);
  const hover = (x: number, y: number, text: string) => straight ? {} : ({
    onMouseEnter: () => setTip({ x, y, text }),
    onMouseLeave: () => setTip(null),
  });

  return (
    <div className="relative">
    <svg
      viewBox={box.join(" ")}
      className="block w-full h-auto overflow-visible"
      role="group"
      aria-label="Your path of belts"
    >
      <defs>
        {/* Soft depth instead of hairline outlines. Light: a gentle shadow
            (keeps the White belt visible on a white page). Dark: a faint
            glow (keeps the Black belt visible on a black page). */}
        <filter id={shadowId} x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow
            dx="0"
            dy={dark ? 0 : 1}
            stdDeviation={dark ? 1.4 : 1.6}
            floodColor={dark ? "#FFFFFF" : "#000000"}
            floodOpacity={dark ? 0.28 : 0.3}
          />
        </filter>
      </defs>
      <path
        d={trail(pos, n - 1, straight)}
        fill="none"
        stroke={c.trail}
        strokeWidth={3}
        strokeDasharray="2 9"
        strokeLinecap="round"
      />
      <path
        d={trail(pos, redUpTo, straight)}
        fill="none"
        stroke="#CC1010"
        strokeWidth={4}
        strokeLinecap="round"
      />

      {exercises.map((ex, i) => {
        const belt = BELTS[Math.min(i, BELTS.length - 1)];
        const { x, y } = pos(i);
        const progress = path.progress[i];
        const unlocked = i <= path.currentIndex;
        const isCurrent = i === path.currentIndex;
        const selected = ex.id === currentId;
        const paid = paidFrom !== undefined && i >= paidFrom;
        const padColor = dark ? PADLOCK_DARK : PADLOCK_LIGHT;
        const paidNote = paid ? " · full dojo" : "";

        if (!unlocked && i === n - 1) {
          // The goal: a bold bullseye so it stands out even while locked
          return (
            <g key={ex.id} aria-disabled="true" aria-label={`${belt.name} belt, the goal`} {...hover(x, y, `${belt.name} belt · the goal`)}>
              <circle cx={x} cy={y} r={17} fill={c.paper} stroke={c.ink} strokeWidth={2} />
              <circle cx={x} cy={y} r={8} fill={c.ink} />
            </g>
          );
        }

        if (!unlocked) {
          return (
            <g key={ex.id} aria-disabled="true" aria-label={`${belt.name} belt, locked`} {...hover(x, y, `${belt.name} belt · locked${paidNote}`)}>
              <circle
                cx={x}
                cy={y}
                r={(i === n - 1 ? 16 : 14) * K}
                fill={c.lockFill}
                stroke={c.lockEdge}
                strokeWidth={1.4}
              />
              {paid && <Padlock x={x} y={y} r={14 * K} color={padColor} />}
            </g>
          );
        }

        const open = () => router.push(`/practice/${ex.id}`);
        const frac = progress.cleanAtEnd / REPS_TO_COMPLETE;
        // Glow colour: the belt's own colour, except where it would vanish
        // (White belt on a light page, Black belt on a dark page)
        const glow =
          (!dark && belt.name === "White") || (dark && belt.name === "Black")
            ? c.ink
            : belt.color;
        const glowOpacity = glow === c.ink ? 0.12 : 0.3;

        return (
          <g
            key={ex.id}
            role="link"
            tabIndex={0}
            aria-label={`${belt.name} belt, exercise ${i + 1}${
              progress.completed ? ", completed" : ", in progress"
            }${paid ? ", part of the full dojo" : ""}`}
            onClick={open}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                open();
              }
            }}
            {...hover(x, y, `${belt.name} belt${paidNote}`)}
            // No focus box on mouse click; keyboard users get the red ring below
            className="group cursor-pointer outline-none"
          >
            <circle
              cx={x}
              cy={y}
              r={isCurrent ? 42 * C : 30 * K}
              fill="none"
              stroke="#CC1010"
              strokeWidth={2}
              className="opacity-0 group-focus-visible:opacity-100"
            />
            <circle cx={x} cy={y} r={20} fill="transparent" />
            {i === n - 1 && (
              <circle cx={x} cy={y} r={24} fill="none" stroke={c.ink} strokeWidth={1.6} />
            )}

            {isCurrent ? (
              <>
                {/* Steady soft glow so it always reads as "this one" */}
                <circle cx={x} cy={y} r={40 * C} fill={glow} opacity={glowOpacity * 0.7} />
                {/* An occasional pulse: one ripple every PULSE_EVERY_SECONDS */}
                <circle cx={x} cy={y} r={33 * C} fill={glow} opacity={0}>
                  <animate
                    attributeName="r"
                    values={`${33 * C};${33 * C * PULSE_SPREAD};${33 * C * PULSE_SPREAD}`}
                    keyTimes={`0;${PULSE_LENGTH_SECONDS / PULSE_EVERY_SECONDS};1`}
                    calcMode="spline"
                    keySplines="0.2 0.7 0.3 1;0 0 1 1"
                    dur={`${PULSE_EVERY_SECONDS}s`}
                    begin="0.8s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values={`${glowOpacity * 1.3};0;0`}
                    keyTimes={`0;${PULSE_LENGTH_SECONDS / PULSE_EVERY_SECONDS};1`}
                    calcMode="spline"
                    keySplines="0.3 0 0.6 1;0 0 1 1"
                    dur={`${PULSE_EVERY_SECONDS}s`}
                    begin="0.8s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle cx={x} cy={y} r={33 * C} fill="none" stroke={c.track} strokeWidth={6 * C} />
                <circle
                  cx={x}
                  cy={y}
                  r={33 * C}
                  fill="none"
                  stroke="#CC1010"
                  strokeWidth={6 * C}
                  strokeLinecap={frac > 0 ? "round" : "butt"}
                  pathLength={100}
                  strokeDasharray={`${frac * 100} 100`}
                  transform={`rotate(-90 ${x} ${y})`}
                />
                {/* Not earned yet, so a hollow ring rather than a solid dot:
                    the belt's colour as an outline with a faint tint inside */}
                <circle cx={x} cy={y} r={20 * C} fill={c.paper} />
                <circle cx={x} cy={y} r={20 * C} fill={belt.color} opacity={0.16} />
                <circle
                  cx={x}
                  cy={y}
                  r={20 * C}
                  fill="none"
                  stroke={belt.color}
                  strokeWidth={5 * C}
                  filter={`url(#${shadowId})`}
                />
                {paid && <Padlock x={x} y={y} r={16 * C} color={belt.color} />}
              </>
            ) : (
              <>
                {/* The one you're viewing: a soft glow in its own colour */}
                {selected && (
                  <circle cx={x} cy={y} r={32 * K} fill={glow} opacity={glowOpacity} />
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={(selected ? 21 : 18) * K}
                  fill={belt.color}
                  filter={`url(#${shadowId})`}
                />
                {paid && (
                  <g opacity={0.75}>
                    <Padlock x={x} y={y} r={(selected ? 21 : 18) * K} color={textOn(belt.color)} />
                  </g>
                )}
              </>
            )}
          </g>
        );
      })}
    </svg>
      {tip && (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-[7px] px-2.5 py-[7px] text-[13.8px] leading-tight text-white bg-black dark:bg-neutral-900 dark:border dark:border-neutral-700"
          style={{
            left: `${(tip.x / box[2]) * 100}%`,
            top: `calc(${((tip.y - box[1]) / box[3]) * 100}% - 22px)`,
          }}
        >
          {tip.text}
        </div>
      )}
      {straight && (() => {
        // No hover on touch screens, so name the belt you're viewing
        const i = exercises.findIndex((e) => e.id === currentId);
        if (i < 0) return null;
        const belt = BELTS[Math.min(i, BELTS.length - 1)];
        return (
          <p className="mt-1 flex items-center justify-center gap-2 text-[15px] text-neutral-600 dark:text-neutral-400">
            <span className="w-2.5 h-2.5 rounded-full shadow-[0_0_0_1px_rgba(0,0,0,0.15)]" style={{ background: belt.color }} />
            {exercises[i].name ?? `Exercise ${i + 1}`} · {belt.name} Belt
          </p>
        );
      })()}
    </div>
  );
}
