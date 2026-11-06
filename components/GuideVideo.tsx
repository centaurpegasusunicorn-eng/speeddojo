"use client";

import { playUrl } from "@/lib/video";
import { useEffect, useRef, useState } from "react";
import { Play, X } from "lucide-react";
import { useTheme } from "@/lib/theme";

/*
 * "How to approach this" instructional video for an exercise.
 * A button in the training card opens it in a pop-up player at normal speed
 * (the tempo dial doesn't touch it). Set it per exercise in lib/mockData.ts:
 *   guideVideoUrl, optional guideVideoUrlDark, optional guideLabel.
 */
export default function GuideVideo({
  url,
  urlDark,
  label = "How to approach this exercise",
  onOpen,
  thumbnail,
}: {
  url: string;
  urlDark?: string;
  label?: string;
  /** Show a picture with a play button instead of the small pill button.
   *  Pass an image path, or "" for a plain placeholder picture. */
  thumbnail?: string;
  /** Called when the player opens, e.g. to pause the exercise video */
  onOpen?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [darkFailed, setDarkFailed] = useState(false);
  const dark = useTheme() === "dark";
  const closeRef = useRef<HTMLButtonElement>(null);
  const src = dark && urlDark && !darkFailed ? urlDark : url;

  // Esc closes; focus the close button when it opens
  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const openPlayer = () => {
    if (!url) return;
    onOpen?.();
    setOpen(true);
  };

  return (
    <>
      {thumbnail !== undefined ? (
        <button
          type="button"
          onClick={openPlayer}
          disabled={!url}
          className="group block w-full text-left disabled:cursor-default"
        >
          <span
            className="relative block aspect-video rounded-lg overflow-hidden bg-neutral-800 bg-cover bg-center"
            style={thumbnail ? { backgroundImage: `url(${thumbnail})` } : { background: "linear-gradient(135deg, #2a2a2a, #111)" }}
          >
            <span className="absolute inset-0 bg-black/25 group-hover:bg-black/10 transition" />
            <span className="absolute inset-0 flex items-center justify-center">
              <span className={`w-11 h-11 rounded-full flex items-center justify-center text-white ${url ? "bg-[#CC1010]" : "bg-white/20"}`}>
                <Play size={18} fill="currentColor" aria-hidden className="ml-0.5" />
              </span>
            </span>
          </span>
          <span className="mt-1.5 block text-[14px] font-medium text-neutral-700 dark:text-neutral-300">
            {url ? label : "Lesson video coming soon"}
          </span>
        </button>
      ) : (
      <button
        type="button"
        onClick={openPlayer}
        className="mt-3 inline-flex items-center gap-2 rounded-full border border-neutral-300 dark:border-neutral-700 pl-2 pr-4 py-1.5 text-[16px] font-medium text-neutral-800 dark:text-neutral-200 hover:bg-white dark:hover:bg-neutral-800 transition-colors"
      >
        <span className="w-7 h-7 rounded-full bg-[#CC1010] text-white flex items-center justify-center">
          <Play size={14} fill="currentColor" aria-hidden className="ml-0.5" />
        </span>
        {label}
      </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={label}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 md:p-10"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-5xl"
            // clicks on the player itself shouldn't close it
            onClick={(e) => e.stopPropagation()}
          >
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute -top-11 right-0 w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center"
            >
              <X size={20} aria-hidden />
            </button>
            <video
              key={src}
              src={playUrl(src)}
              controls
              autoPlay
              playsInline
              onError={() => {
                if (src !== url) setDarkFailed(true); // fall back to light
              }}
              className="w-full rounded-xl bg-black aspect-video"
            />
          </div>
        </div>
      )}
    </>
  );
}
