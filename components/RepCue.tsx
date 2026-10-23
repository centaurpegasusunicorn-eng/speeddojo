"use client";

import { Zap } from "lucide-react";
import { textOn, type Belt } from "@/lib/belts";
import { useTheme } from "@/lib/theme";

/*
 * The pulsing lightning-bolt circle shown beside "Log your rep".
 * Styled like the belt you're working towards on the path: the belt's
 * colour, a soft steady glow, and a ripple. It pulses faster than the path
 * (every PULSE_SECONDS) because it's asking for an answer right now.
 */
const PULSE_SECONDS = 1.6;

export default function RepCue({ belt }: { belt: Belt }) {
  const dark = useTheme() === "dark";
  // Where the belt's own colour would vanish, glow in grey instead
  const vanishes =
    (!dark && belt.name === "White") || (dark && belt.name === "Black");
  const glow = vanishes ? (dark ? "#EDEDED" : "#171717") : belt.color;
  const glowOpacity = vanishes ? 0.12 : 0.3;

  return (
    <div className="relative w-14 h-14 shrink-0" aria-hidden>
      {/* steady glow */}
      <span
        className="absolute -inset-2 rounded-full"
        style={{ backgroundColor: glow, opacity: glowOpacity * 0.8 }}
      />
      {/* ripple */}
      <span
        className="absolute inset-0 rounded-full motion-reduce:hidden"
        style={{
          backgroundColor: glow,
          opacity: 0,
          animation: `repCuePulse ${PULSE_SECONDS}s cubic-bezier(0.2,0.7,0.3,1) infinite`,
          ["--cue-from" as string]: String(glowOpacity * 1.6),
        }}
      />
      {/* the disc */}
      <span
        className="absolute inset-0 rounded-full flex items-center justify-center"
        style={{
          backgroundColor: belt.color,
          color: textOn(belt.color),
          boxShadow: dark
            ? "0 0 3px rgba(255,255,255,0.35)"
            : "0 1px 3px rgba(0,0,0,0.3)",
        }}
      >
        <Zap size={26} fill="currentColor" strokeWidth={1.5} />
      </span>
    </div>
  );
}
