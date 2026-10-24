"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Download, RotateCcw, Share2, X, ImageUp } from "lucide-react";
import { beltSvg, drawBeltCard, squareFrom, svgDataUrl, GOLD } from "@/lib/beltCard";
import { BRAND } from "@/lib/brand";

/*
 * "Take your belt photo": webcam selfie with the belt across it, turned into
 * a shareable card. Nothing is uploaded; the photo stays on the device.
 */

const COUNTDOWN_FROM = 3;

type Props = {
  beltName: string;
  beltColor: string;
  beltIndex: number;
  allBelts: { name: string; color: string }[];
  line: string;
  onClose: () => void;
};

export default function BeltPhoto(props: Props) {
  const { beltName, beltColor, beltIndex, allBelts, onClose } = props;
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<"starting" | "camera" | "nocamera" | "making" | "done">("starting");
  const [count, setCount] = useState<number | null>(null);
  const [flash, setFlash] = useState(false);
  const [card, setCard] = useState<{ url: string; blob: Blob } | null>(null);
  const [canShare, setCanShare] = useState(false);

  const light = beltName === "White" || beltName === "Silver";
  const isBlack = beltIndex === allBelts.length - 1;
  const beltImg = svgDataUrl(beltSvg(beltColor, { light, black: isBlack }));
  const fileName = `${BRAND.name.toLowerCase()}-${beltName.toLowerCase()}-belt.png`;

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  };

  const startCamera = async () => {
    setStage("starting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      const v = videoRef.current!;
      v.srcObject = stream;
      await v.play();
      setStage("camera");
    } catch {
      setStage("nocamera"); // no camera, or permission declined
    }
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => { if (card) URL.revokeObjectURL(card.url); }, [card]);

  const makeCard = async (photo: HTMLCanvasElement | null) => {
    setStage("making");
    const canvas = await drawBeltCard({ ...props, photo });
    const blob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), "image/png"));
    const file = new File([blob], fileName, { type: "image/png" });
    setCanShare(!!navigator.canShare?.({ files: [file] }));
    setCard({ url: URL.createObjectURL(blob), blob });
    setStage("done");
  };

  const snap = () => {
    if (count !== null) return;
    let n = COUNTDOWN_FROM;
    setCount(n);
    const tick = setInterval(() => {
      n -= 1;
      if (n > 0) {
        setCount(n);
        return;
      }
      clearInterval(tick);
      setCount(null);
      setFlash(true);
      setTimeout(() => setFlash(false), 450);
      const photo = squareFrom(videoRef.current!, true);
      stopCamera();
      makeCard(photo);
    }, 900);
  };

  const fromFile = async (f: File | undefined) => {
    if (!f) return;
    const img = new Image();
    img.src = URL.createObjectURL(f);
    await img.decode();
    stopCamera();
    makeCard(squareFrom(img, false));
  };

  const share = async () => {
    if (!card) return;
    const file = new File([card.blob], fileName, { type: "image/png" });
    try {
      await navigator.share({
        files: [file],
        title: `${beltName} Belt`,
        text: [
          `Just earned my ${beltName} Belt on ${BRAND.name} 🥋🎸`,
          props.line,
          [BRAND.hashtag, BRAND.website].filter(Boolean).join(" "),
        ]
          .filter(Boolean)
          .join("\n"),
      });
    } catch {
      /* they cancelled the share sheet */
    }
  };

  const download = () => {
    if (!card) return;
    const a = document.createElement("a");
    a.href = card.url;
    a.download = fileName;
    a.click();
  };

  const retake = () => {
    setCard(null);
    startCamera();
  };

  const btn = "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-[16px] font-bold transition active:scale-[0.98]";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Your belt photo"
      className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-4 text-white"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute top-4 right-4 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"
      >
        <X size={22} />
      </button>

      {/* camera: live mirrored preview with the belt in the frame */}
      <div className={stage === "camera" || stage === "starting" ? "flex flex-col items-center" : "hidden"}>
        <p className="mb-3 text-sm tracking-[0.3em] uppercase" style={{ color: GOLD }}>
          Strike a pose
        </p>
        <div
          className="relative w-[min(86vw,62vh,520px)] aspect-square rounded-[28px] overflow-hidden bg-neutral-900"
          style={{ boxShadow: `0 0 0 6px ${beltColor}, 0 0 0 12px ${GOLD}, 0 0 60px ${beltColor}` }}
        >
          <video ref={videoRef} playsInline muted className="absolute inset-0 w-full h-full object-cover -scale-x-100" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={beltImg} alt="" className="absolute left-1/2 -translate-x-1/2 w-[155%] max-w-none top-[64%] pointer-events-none" />
          {count !== null && (
            <span
              key={count}
              className="absolute inset-0 flex items-center justify-center text-[9rem] font-black"
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
          className={`${btn} mt-6 text-black disabled:opacity-50`}
          style={{ background: GOLD }}
        >
          <Camera size={20} /> Take photo
        </button>
        <p className="mt-3 text-[13px] text-white/50">Your photo stays on your device. Nothing is uploaded.</p>
      </div>

      {/* no camera (or permission declined): upload a picture, or skip the photo */}
      {stage === "nocamera" && (
        <div className="max-w-sm text-center">
          <p className="text-2xl font-bold">No camera available</p>
          <p className="mt-2 text-white/70">
            Allow camera access in your browser and try again, use a photo you already have, or make the card without one.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button type="button" onClick={() => fileRef.current?.click()} className={`${btn} text-black`} style={{ background: GOLD }}>
              <ImageUp size={20} /> Choose a photo
            </button>
            <button type="button" onClick={() => makeCard(null)} className={`${btn} bg-white/10 hover:bg-white/20`}>
              Make it without a photo
            </button>
            <button type="button" onClick={startCamera} className="text-[15px] text-white/60 hover:underline">
              Try the camera again
            </button>
          </div>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={(e) => fromFile(e.target.files?.[0])}
      />

      {stage === "making" && <p className="text-white/70">Making your card…</p>}

      {/* the finished card */}
      {stage === "done" && card && (
        <div className="flex flex-col items-center" style={{ animation: "buRise 0.5s ease-out both" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={card.url}
            alt={`${beltName} Belt card`}
            className="w-auto max-w-[86vw] max-h-[66vh] rounded-2xl shadow-2xl"
            style={{ boxShadow: `0 20px 60px rgba(0,0,0,0.6), 0 0 40px ${beltColor}55` }}
          />
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {canShare && (
              <button type="button" onClick={share} className={`${btn} text-black`} style={{ background: GOLD }}>
                <Share2 size={20} /> Share
              </button>
            )}
            <button
              type="button"
              onClick={download}
              className={`${btn} ${canShare ? "bg-white/10 hover:bg-white/20" : "text-black"}`}
              style={canShare ? undefined : { background: GOLD }}
            >
              <Download size={20} /> Download
            </button>
            <button type="button" onClick={retake} className={`${btn} bg-white/10 hover:bg-white/20`}>
              <RotateCcw size={18} /> Retake
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
