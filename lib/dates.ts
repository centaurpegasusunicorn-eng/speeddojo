// Calendar day (YYYY-MM-DD) in the user's LOCAL timezone, so "today" and
// per-day totals roll over at the student's midnight, not UTC midnight.
export function localDay(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
