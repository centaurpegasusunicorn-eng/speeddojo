"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, RotateCcw, Trash2, Play } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import CameraCapture from "@/components/CameraCapture";
import { BRAND } from "@/lib/brand";
import { WELCOME } from "@/lib/welcome";
import { EXERCISES } from "@/lib/mockData";
import { GOLD } from "@/lib/beltCard";
import { playUrl } from "@/lib/video";
import { useTheme } from "@/lib/theme";
import { deleteDay1, loadDay1, markWelcomed, saveDay1 } from "@/lib/day1";

/*
 * The welcome ritual, before a new student's first practice: your intro
 * video, their Day 1 photo, then into the dojo. Copy lives in lib/welcome.ts.
 */
export default function WelcomePage() {
  const router = useRouter();
  const dark = useTheme() === "dark";
  const [photo, setPhoto] = useState<{ url: string; date: Date } | null>(null);
  const [camera, setCamera] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [entering, setEntering] = useState(false);

  // A returning student sees the Day 1 photo they already took
  useEffect(() => {
    loadDay1()
      .then((d) => d && setPhoto({ url: d.photo.toDataURL("image/jpeg", 0.9), date: d.date }))
      .catch(() => {});
  }, []);

  const captured = async (c: HTMLCanvasElement) => {
    setCamera(false);
    setPhoto({ url: c.toDataURL("image/jpeg", 0.9), date: new Date() });
    setSaving(true);
    setError(null);
    const err = await saveDay1(c);
    setSaving(false);
    if (err) setError("Couldn't save your photo just now. You can still carry on, and retake it later.");
  };

  const remove = async () => {
    await deleteDay1();
    setPhoto(null);
  };

  const enter = async () => {
    setEntering(true);
    await markWelcomed();
    router.push(`/practice/${EXERCISES[0].id}`);
  };

  const video = dark && WELCOME.INTRO_VIDEO_URL_DARK ? WELCOME.INTRO_VIDEO_URL_DARK : WELCOME.INTRO_VIDEO_URL;
  const day = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <main className="w-full px-4 sm:px-8 pb-20">
      <header className="h-20 flex items-center justify-between">
        <Link
          href="/dashboard"
          className="text-lg sm:text-xl tracking-[0.25em] sm:tracking-[0.3em] text-neutral-800 dark:text-neutral-200 font-light"
        >
          {BRAND.name.toUpperCase()}
        </Link>
        <ThemeToggle />
      </header>

      <div className="max-w-3xl mx-auto pt-6 sm:pt-10">
        <p className="text-[15px] tracking-[0.2em] uppercase text-[#CC1010]">{WELCOME.eyebrow}</p>
        <h1 className="mt-2 text-4xl md:text-6xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          {WELCOME.headline}
        </h1>
        <p className="mt-4 text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl">{WELCOME.intro}</p>

        {/* 1 · the intro video */}
        <Step n={1} title={WELCOME.videoTitle}>
          {video ? (
            <video
              key={video}
              src={playUrl(video)}
              controls
              playsInline
              preload="metadata"
              className="w-full aspect-video rounded-2xl bg-black"
            />
          ) : (
            <div className="w-full aspect-video rounded-2xl bg-neutral-100 dark:bg-neutral-900 flex flex-col items-center justify-center gap-3 text-neutral-500 dark:text-neutral-400">
              <span className="w-14 h-14 rounded-full bg-[#CC1010] text-white flex items-center justify-center">
                <Play size={24} fill="currentColor" className="ml-1" aria-hidden />
              </span>
              {WELCOME.videoPlaceholder}
            </div>
          )}
        </Step>

        {/* 2 · the Day 1 photo */}
        <Step n={2} title={WELCOME.photoTitle}>
          <p className="text-[17px] text-neutral-600 dark:text-neutral-400 max-w-xl">{WELCOME.photoBody}</p>
          <div className="mt-6 flex flex-col items-center">
            {camera ? (
              <CameraCapture onCapture={captured} ctaLabel={WELCOME.photoCta} />
            ) : photo ? (
              // a polaroid of Day 1
              <figure
                className="bg-white p-3 pb-4 rounded-md shadow-[0_12px_40px_rgba(0,0,0,0.25)] -rotate-2"
                style={{ animation: "buRise 0.5s ease-out both" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt="Your Day 1 photo" className="w-[min(70vw,300px)] aspect-square object-cover rounded-sm" />
                <figcaption className="mt-3 text-center text-[15px] font-semibold tracking-[0.2em] uppercase text-neutral-800">
                  Day 1 · {day(photo.date)}
                </figcaption>
              </figure>
            ) : (
              <button
                type="button"
                onClick={() => setCamera(true)}
                className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[17px] font-bold text-black active:scale-[0.98] transition"
                style={{ background: GOLD }}
              >
                {WELCOME.photoCta}
              </button>
            )}

            {photo && !camera && (
              <div className="mt-6 flex gap-5 text-[15px] text-neutral-500 dark:text-neutral-400">
                <button type="button" onClick={() => setCamera(true)} className="inline-flex items-center gap-1.5 hover:underline">
                  <RotateCcw size={15} /> Retake
                </button>
                <button type="button" onClick={remove} className="inline-flex items-center gap-1.5 hover:underline">
                  <Trash2 size={15} /> Delete
                </button>
              </div>
            )}
            {saving && <p className="mt-3 text-sm text-neutral-500">Saving privately…</p>}
            {error && <p className="mt-3 text-sm text-[#CC1010] text-center max-w-sm">{error}</p>}
            <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-neutral-500 dark:text-neutral-400 text-center">
              <Lock size={13} aria-hidden /> {WELCOME.photoPrivacy}
            </p>
          </div>
        </Step>

        {/* 3 · enter */}
        <Step n={3} title={WELCOME.enterTitle}>
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={enter}
              disabled={entering || saving}
              className="rounded-xl px-10 py-5 text-xl sm:text-2xl font-bold bg-[#CC1010] text-white hover:bg-[#B00D0D] active:scale-[0.98] transition shadow-[0_10px_30px_rgba(204,16,16,0.35)] disabled:opacity-60"
            >
              {WELCOME.enterCta}
            </button>
            {!photo && !camera && (
              <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">
                No photo? That&apos;s fine. You can take it later from here.
              </p>
            )}
          </div>
        </Step>
      </div>
    </main>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="mt-14">
      <div className="flex items-center gap-3 mb-5">
        <span className="w-9 h-9 rounded-full bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 flex items-center justify-center font-bold">
          {n}
        </span>
        <h2 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">{title}</h2>
      </div>
      {children}
    </section>
  );
}
