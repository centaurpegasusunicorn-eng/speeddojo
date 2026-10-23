"use client";

import { useState } from "react";
import { MessagesSquare } from "lucide-react";
import { COMMUNITY } from "@/lib/community";

const CLICKED_KEY = "dojo_discord_clicked";

/** Discord link under the progress chart. Full card until the student has
 *  clicked it once (remembered in this browser), then a small one-line link.
 *  Hidden until an invite link is set in lib/community.ts. */
export default function CommunityLink() {
  const [clicked, setClicked] = useState(() => {
    try {
      return window.localStorage.getItem(CLICKED_KEY) === "1";
    } catch {
      return false;
    }
  });

  if (!COMMUNITY.DISCORD_INVITE_URL) return null;

  const remember = () => {
    try {
      window.localStorage.setItem(CLICKED_KEY, "1");
    } catch {
      /* ignore */
    }
    // shrink after they've gone (the link opens in a new tab)
    window.setTimeout(() => setClicked(true), 400);
  };

  const link = {
    href: COMMUNITY.DISCORD_INVITE_URL,
    target: "_blank",
    rel: "noopener noreferrer",
    onClick: remember,
  };

  if (clicked) {
    return (
      <div className="mt-5 flex items-center justify-between gap-3 rounded-lg px-1 text-[15px]">
        <span className="inline-flex items-center gap-2 text-neutral-700 dark:text-neutral-300">
          <MessagesSquare size={17} aria-hidden className="text-[#5865F2]" />
          {COMMUNITY.compactLabel}
        </span>
        <a
          {...link}
          className="rounded-md px-3 py-1 text-[14px] font-semibold text-[#5865F2] hover:bg-[#5865F2]/10 transition-colors"
        >
          {COMMUNITY.compactButton}
        </a>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-xl bg-neutral-100 dark:bg-neutral-900 p-4">
      <p className="text-[16px] font-semibold text-neutral-900 dark:text-neutral-100">
        {COMMUNITY.heading}
      </p>
      <p className="mt-0.5 text-[14.5px] text-neutral-600 dark:text-neutral-400">
        {COMMUNITY.body}
      </p>
      <a
        {...link}
        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white px-4 py-2 text-[15px] font-semibold transition-colors"
      >
        <MessagesSquare size={18} aria-hidden />
        {COMMUNITY.button}
      </a>
    </div>
  );
}
