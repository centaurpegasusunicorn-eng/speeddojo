"use client";

import { Moon, Sun } from "lucide-react";
import { setTheme, useTheme } from "@/lib/theme";

/*
 * Light/dark switch: a lozenge track with a round knob that slides across.
 * Light = knob on the left with a sun, dark = knob on the right with a moon.
 *
 * Position and icons are driven by `dark:` classes (the data-theme attribute
 * set before first paint), not React state, so a dark-mode page loads with
 * the knob already on the right instead of sliding over on load.
 */
const EASE = "ease-[cubic-bezier(0.34,1.45,0.64,1)]"; // tiny overshoot

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const dark = useTheme() === "dark";

  return (
    <button
      type="button"
      role="switch"
      aria-checked={dark}
      aria-label="Dark mode"
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={() => setTheme(dark ? "light" : "dark")}
      className={`group relative shrink-0 w-[68px] h-9 rounded-full p-1 transition-colors duration-300
        bg-neutral-200 hover:bg-neutral-300 shadow-[inset_0_1px_3px_rgba(0,0,0,0.18)]
        dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#CC1010] ${className}`}
    >
      {/* Faint hint of the other mode, on the side the knob isn't */}
      <Moon
        size={14}
        aria-hidden
        className="absolute right-[11px] top-1/2 -translate-y-1/2 text-neutral-500 transition-opacity duration-300 opacity-100 dark:opacity-0"
      />
      <Sun
        size={14}
        aria-hidden
        className="absolute left-[11px] top-1/2 -translate-y-1/2 text-neutral-400 transition-opacity duration-300 opacity-0 dark:opacity-100"
      />

      {/* The knob */}
      <span
        className={`relative flex items-center justify-center w-7 h-7 rounded-full transition-[translate,scale,background-color] duration-500 ${EASE}
          translate-x-0 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.3)]
          dark:translate-x-8 dark:bg-neutral-100 dark:shadow-[0_1px_4px_rgba(0,0,0,0.8)]
          group-active:scale-90`}
      >
        <Sun
          size={16}
          aria-hidden
          className={`absolute text-[#CC1010] transition-[opacity,rotate,scale] duration-500 ${EASE}
            opacity-100 rotate-0 scale-100
            dark:opacity-0 dark:-rotate-90 dark:scale-50`}
        />
        <Moon
          size={15}
          aria-hidden
          className={`absolute text-neutral-900 transition-[opacity,rotate,scale] duration-500 ${EASE}
            opacity-0 rotate-90 scale-50
            dark:opacity-100 dark:rotate-0 dark:scale-100`}
        />
      </span>
    </button>
  );
}
