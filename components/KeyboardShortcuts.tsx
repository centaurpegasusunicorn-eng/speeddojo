"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, Keyboard } from "lucide-react";

/*
 * "Keyboard Shortcuts" panel under the Audio Mixer: a small guide to the
 * keys, drawn as keycaps. Opens and closes like the mixer and remembers
 * whether it was left open. The shortcuts themselves live in the practice
 * page (handleShortcut).
 */
const OPEN_KEY = "dojo_keys_open";

function Key({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <kbd
      className={`inline-flex items-center justify-center h-7 ${
        wide ? "min-w-[64px] px-3" : "min-w-7 px-1.5"
      } rounded-md font-sans text-[12px] font-semibold tracking-wide
        bg-white text-neutral-700 border border-neutral-300 border-b-[3px] border-b-neutral-400
        dark:bg-neutral-800 dark:text-neutral-200 dark:border-neutral-600 dark:border-b-neutral-950`}
    >
      {children}
    </kbd>
  );
}

const ROWS: { keys: ReactNode; label: string }[] = [
  { keys: <Key wide>Space</Key>, label: "Play / pause" },
  {
    keys: (
      <>
        <Key>Y</Key>
        <Key>N</Key>
      </>
    ),
    label: "Log rep: clean / missed",
  },
  {
    keys: (
      <>
        <Key>↑</Key>
        <Key>↓</Key>
      </>
    ),
    label: "Tempo +1 / −1",
  },
  {
    keys: (
      <>
        <Key wide>Shift</Key>
        <span className="text-neutral-400">+</span>
        <Key>↑</Key>
        <Key>↓</Key>
      </>
    ),
    label: "Tempo +5 / −5",
  },
];

export default function KeyboardShortcuts() {
  const [open, setOpen] = useState(() => {
    try {
      return window.localStorage.getItem(OPEN_KEY) === "1";
    } catch {
      return false;
    }
  });

  function toggle() {
    setOpen((o) => {
      try {
        window.localStorage.setItem(OPEN_KEY, o ? "0" : "1");
      } catch {
        /* ignore */
      }
      return !o;
    });
  }

  return (
    <div className="mb-6">
      <button
        onClick={toggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-neutral-800 dark:text-neutral-200"
      >
        <span className="flex items-center gap-2">
          <Keyboard size={18} aria-hidden />
          Keyboard Shortcuts
        </span>
        <ChevronDown
          size={18}
          aria-hidden
          className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`grid transition-[grid-template-rows] duration-200 ${
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden" inert={!open}>
          <ul className="space-y-2.5 px-4 pb-4 text-sm text-neutral-600 dark:text-neutral-400">
            {ROWS.map((r) => (
              <li key={r.label} className="flex items-center justify-between gap-4">
                <span>{r.label}</span>
                <span className="flex items-center gap-1.5 shrink-0">{r.keys}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
