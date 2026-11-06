"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import SignUpForm from "@/components/home/SignUpForm";

/* A button that opens the sign-up form in a pop-up, right on the page */
export default function SignUpButton({
  label,
  className,
  next,
  title = "Create your free account",
  body = "Start with the White belt. It takes about a minute.",
  cta,
}: {
  label: string;
  className: string;
  next?: string;
  title?: string;
  body?: string;
  cta?: string;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {label}
      </button>
      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 p-6 sm:p-8 shadow-2xl text-left"
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-neutral-900"
            >
              <X size={20} />
            </button>
            <h2 className="wide text-2xl font-extrabold pr-8">{title}</h2>
            <p className="mt-1.5 mb-5 text-[15px] text-neutral-600 dark:text-neutral-400">{body}</p>
            <SignUpForm next={next} cta={cta} autoFocus />
          </div>
        </div>
      )}
    </>
  );
}
