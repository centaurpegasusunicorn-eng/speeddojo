"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Eye, Fish, Guitar, PawPrint } from "lucide-react";
import { SCENES, type SceneId } from "@/lib/scenes";

const ICONS = { highway: Guitar, fish: Fish, bears: PawPrint };

/* "View" drop-down, styled like the Audio Mixer: pick what the video shows */
export default function ScenePicker({
  value,
  onChange,
}: {
  value: SceneId;
  onChange: (id: SceneId) => void;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    try {
      setOpen(localStorage.getItem("dojo_view_open") === "1");
    } catch {}
  }, []);
  const toggle = () =>
    setOpen((o) => {
      try {
        localStorage.setItem("dojo_view_open", o ? "0" : "1");
      } catch {}
      return !o;
    });
  const current = SCENES.find((s) => s.id === value);

  return (
    <div>
      <button
        onClick={toggle}
        aria-expanded={open}
        className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-neutral-800 dark:text-neutral-200"
      >
        <span className="flex items-center gap-2">
          <Eye size={18} aria-hidden />
          View
          {!open && current && (
            <span className="font-normal text-neutral-500 dark:text-neutral-400">· {current.label}</span>
          )}
        </span>
        <ChevronDown size={18} aria-hidden className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      <div className={`grid transition-[grid-template-rows] duration-200 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}>
        <div className="min-h-0 overflow-hidden" inert={!open}>
          <div role="radiogroup" aria-label="Video view" className="px-4 pb-4 grid grid-cols-3 gap-2">
            {SCENES.map((s) => {
              const Icon = ICONS[s.id];
              const on = s.id === value;
              return (
                <button
                  key={s.id}
                  role="radio"
                  aria-checked={on}
                  onClick={() => onChange(s.id)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg py-3 text-[13px] font-medium transition ${
                    on
                      ? "bg-[#CC1010] text-white"
                      : "bg-neutral-100 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800"
                  }`}
                >
                  <Icon size={20} aria-hidden />
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
