"use client";

import { Belt, textOn } from "@/lib/belts";

export default function BeltUpOverlay({
  belt,
  onDone,
}: {
  belt: Belt;
  onDone: () => void;
}) {
  return (
    <div
      role="status"
      onClick={onDone}
      onAnimationEnd={onDone}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer"
      style={{
        backgroundColor: belt.color,
        color: textOn(belt.color),
        animation: "beltFlash 2.6s ease-out forwards",
      }}
    >
      <p className="text-lg tracking-[0.4em] uppercase mb-4 opacity-80">
        New belt
      </p>
      <p className="text-5xl sm:text-7xl md:text-9xl font-bold tracking-tight text-center px-4">
        {belt.name} Belt
      </p>
    </div>
  );
}
