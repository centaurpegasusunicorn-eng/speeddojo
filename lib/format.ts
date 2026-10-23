/** 45 -> "45s", 840 -> "14 min", 7800 -> "2h 10m" */
export function formatDuration(totalSeconds: number): string {
  const s = Math.round(totalSeconds);
  if (s <= 0) return "0 min";
  if (s < 60) return `${s}s`;
  const minutes = Math.round(s / 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** 42.3 -> "0:43" (rounds up so it never shows 0:00 early) */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
