"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/** Round icon button that signs the student out and returns to /login. */
export default function SignOutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={busy}
      aria-label="Sign out"
      title="Sign out"
      className={`w-9 h-9 shrink-0 flex items-center justify-center rounded-full text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-900 transition-colors disabled:opacity-50 ${className}`}
    >
      <LogOut size={18} aria-hidden />
    </button>
  );
}
