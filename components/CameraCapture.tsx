"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, ImageUp } from "lucide-react";
import { squareFrom, GOLD } from "@/lib/beltCard";

/*
 * A square selfie camera with a 3-2-1 countdown and flash. Falls back to
 * choosing an existing photo if there's no camera or access is declined.
 * Hands back a mirrored, square photo.
 */

const COUNTDOWN_FROM = 3;

export default function CameraCapture({
  onCapture,
  frameColor = GOLD,
  ctaLabel = "Take photo",
}: {
  onCapture: (photo: HTMLCanvasElement) => void;
  frameColor?: string;
  ctaLabel?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<"starting" | "camera" | "nocamera">("starting");
  const [count, setCount] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);

  const attempt = useRef(0); // only the latest start counts

  const stop = () => {
    attempt.current++;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const start = async () => {
    const mine = ++attempt.current;
    setStage("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      if (mine !== attempt.current) {
        stream.getTracks().forEach((t) => t.stop()); // a newer start took over
        return;
      }
      streamRef.current = stream;
      const v = videoRef.current!;
      v.srcObject = stream;
      await v.play();
      if (mine === attempt.current) setStage("camera");
    } catch {
      if (mine === attempt.current) setStage("nocamera");
    }
  };

  useEffect(() => {
    start();
    return stop;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const snap = () => {
    if (count !== null) return;
    let n = COUNTDOWN_FROM;
    setCount(n);
    const tick = setInterval(() => {
      n -= 1;
      if (n > 0) return setCount(n);
      clearInterval(tick);
      setCount(null);
      setFlash(true);
      setTimeout(() => setFlash(false), 450);
      const photo = squareFrom(videoRef.current!, true);
      stop();
      onCapture(photo);
    }, 900);
  };

  const fromFile = async (f: File | undefined) => {
    if (!f) return;
    const img = new Image();
    img.src = URL.createObjectURL(f);
    await img.decode();
    stop();
    onCapture(squareFrom(img, false));
  };

  const gold = "inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-[17px] font-bold text-black transition active:scale-[0.98] disabled:opacity-50";

  return (
    <div className="flex flex-col items-center">
      {stage === "nocamera" ? (
        <div className="w-full max-w-sm aspect-square rounded-[28px] bg-neutral-100 dark:bg-neutral-900 flex flex-col items-center justify-center gap-4 p-6 text-center">
          <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">No camera available</p>
          <p className="text-[15px] text-neutral-600 dark:text-neutral-400">
            Allow camera access in your browser and try again, or use a photo you already have.
          </p>
          <button type="button" onClick={() => fileRef.current?.click()} className={gold} style={{ background: GOLD }}>
            <ImageUp size={20} /> Choose a photo
          </button>
          <button type="button" onClick={start} className="text-[15px] text-neutral-500 hover:underline">
            Try the camera again
          </button>
        </div>
      ) : (
        <>
          <div
            className="relative w-[min(86vw,420px)] aspect-square rounded-[28px] overflow-hidden bg-neutral-900"
            style={{ boxShadow: `0 0 0 6px ${frameColor}, 0 0 40px color-mix(in oklab, ${frameColor} 50%, transparent)` }}
          >
            <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover -scale-x-100" />
            {count !== null && (
              <span
                key={count}
                className="absolute inset-0 flex items-center justify-center text-[8rem] font-black text-white"
                style={{ animation: "buSlam 0.8s cubic-bezier(0.2,1.5,0.4,1) both", textShadow: "0 4px 30px rgba(0,0,0,0.6)" }}
              >
                {count}
              </span>
            )}
            {flash && <span className="absolute inset-0 bg-white" style={{ animation: "buFadeOut 0.45s ease-out forwards" }} />}
            {stage === "starting" && (
              <span className="absolute inset-0 flex items-center justify-center text-white/60">Starting camera…</span>
            )}
          </div>
          <button
            type="button"
            onClick={snap}
            disabled={stage !== "camera" || count !== null}
            className={`${gold} mt-6`}
            style={{ background: GOLD }}
          >
            <Camera size={20} /> {ctaLabel}
          </button>
        </>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => fromFile(e.target.files?.[0])}
      />
    </div>
  );
}
