"use client";

import { useTheme } from "@/lib/theme";

/* A short silent loop of the real note highway, light or dark to match */
export default function HeroVideo() {
  const dark = useTheme() === "dark";
  const name = dark ? "hero-dark" : "hero";
  return (
    <video
      key={name}
      src={`/home/${name}.mp4`}
      poster={`/home/${name}.jpg`}
      autoPlay
      muted
      loop
      playsInline
      aria-label="The note highway from a Core Training exercise"
      className="block w-full aspect-video object-cover"
    />
  );
}
