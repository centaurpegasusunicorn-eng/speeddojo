"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { loadDay1 } from "@/lib/day1";

/*
 * The round button in the top bar that opens My Dojo: their Day 1 photo,
 * or their initial if they haven't taken one.
 */
export default function ProfileButton({ className = "" }: { className?: string }) {
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
        c.width = c.height = 96;
        c.getContext("2d")!.drawImage(d.photo, 0, 0, 96, 96);
        setPhoto(c.toDataURL("image/jpeg", 0.85));
      })
      .catch(() => {});
  }, []);

  return (
    <Link
      href="/dojo"
      aria-label="My Dojo"
      title="My Dojo"
      className={`w-9 h-9 shrink-0 rounded-full overflow-hidden flex items-center justify-center bg-neutral-200 dark:bg-neutral-800 text-[15px] font-semibold text-neutral-700 dark:text-neutral-200 ring-2 ring-transparent hover:ring-[#CC1010] transition ${className}`}
    >
      {photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={photo} alt="" className="w-full h-full object-cover" />
      ) : (
        initial
      )}
    </Link>
  );
}
