"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { loadDay1 } from "@/lib/day1";

/*
 * The round button in the top bar that opens My Dojo: their Day 1 photo,
 * or their initial if they haven't taken one. A 2px ring inside it shows
 * the belt they're on (with a faint edge so a White belt still shows).
 */
export default function ProfileButton({
  className = "",
  ringColor,
}: {
  className?: string;
  /** colour of the 2px ring inside the photo: the belt they're on */
  ringColor?: string;
}) {
  const [photo, setPhoto] = useState<string | null>(null);
  const [initial, setInitial] = useState("");

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }: { data: { user: { email?: string } | null } }) =>
        setInitial((data.user?.email ?? "?").charAt(0).toUpperCase())
      );
    loadDay1()
      .then((d) => {
        if (!d) return;
        const c = document.createElement("canvas");
        c.width = c.height = 192;
        c.getContext("2d")!.drawImage(d.photo, 0, 0, 192, 192);
        setPhoto(c.toDataURL("image/jpeg", 0.85));
      })
      .catch(() => {});
  }, []);

  return (
    <Link
      href="/dojo"
      aria-label="My Dojo"
      title="My Dojo"
      className={`relative w-11 h-11 lg:w-[66px] lg:h-[66px] shrink-0 rounded-full overflow-hidden flex items-center justify-center bg-neutral-200 dark:bg-neutral-800 text-[18px] lg:text-[26px] font-semibold text-neutral-700 dark:text-neutral-200 ring-2 ring-transparent hover:ring-[#CC1010] transition ${className}`}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" className="w-full h-full object-cover" />
      ) : (
        initial
      )}
      {ringColor && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ boxShadow: `inset 0 0 0 2px ${ringColor}, inset 0 0 0 3px rgba(0,0,0,0.18)` }}
        />
      )}
    </Link>
  );
}
