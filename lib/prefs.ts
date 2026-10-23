// Audio mixer preferences, remembered in a cookie (1 year)
export type AudioPrefs = {
  click: number;
  accent: number;
  guitar: number;
  accents: boolean[];
  pulse: boolean;
};

const NAME = "dojo_audio";

export function readPrefs(): Partial<AudioPrefs> | null {
  if (typeof document === "undefined") return null;
  const entry = document.cookie.split("; ").find((c) => c.startsWith(`${NAME}=`));
  if (!entry) return null;
  try {
    return JSON.parse(decodeURIComponent(entry.slice(NAME.length + 1)));
  } catch {
    return null;
  }
}

export function writePrefs(p: AudioPrefs) {
  document.cookie = `${NAME}=${encodeURIComponent(
    JSON.stringify(p)
  )}; max-age=31536000; path=/; SameSite=Lax`;
}
