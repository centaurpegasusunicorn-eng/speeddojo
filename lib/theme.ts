"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";
import { THEME_KEY as KEY } from "./themeScript";

/*
 * LIGHT / DARK MODE
 * -----------------
 * The choice is saved in localStorage and applied as data-theme="dark" on
 * <html>. Tailwind's `dark:` classes key off that attribute (see globals.css).
 * THEME_SCRIPT (lib/themeScript.ts) runs in <head> before the page paints,
 * so a dark-mode student never sees a white flash on load.
 */
export type Theme = "light" | "dark";

let current: Theme | null = null;
const listeners = new Set<() => void>();

function stored(): Theme {
  try {
    return window.localStorage.getItem(KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function getSnapshot(): Theme {
  if (current === null) current = stored();
  return current;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function setTheme(t: Theme) {
  current = t;
  try {
    window.localStorage.setItem(KEY, t);
  } catch {
    /* private window: the choice just won't be remembered */
  }
  document.documentElement.setAttribute("data-theme", t);
  listeners.forEach((l) => l());
}

/** Current theme. Renders as "light" on the server, then the real value. */
export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, getSnapshot, () => "light");
}

/**
 * Mounted once in the root layout. In development React's Strict Mode can
 * reset <html> attributes on its remount; this puts the theme back.
 */
export function ThemeSync() {
  useLayoutEffect(() => {
    document.documentElement.setAttribute("data-theme", getSnapshot());
  }, []);
  return null;
}
