"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

/** Signs the student out and returns to /login. A round icon by default;
 *  withLabel shows "Sign out" next to the icon. */
export default function SignOutButton({
  className = "",
  withLabel = false,
}: {
  className?: string;
  withLabel?: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function signOut() {
    setBusy(true);
    await createClient().auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (withLabel) {
    return (
      <button
        type="button"
        onClick={signOut}
        disabled={busy}
        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[15px] font-semibold border border-neutral-300 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition disabled:opacity-50 ${className}`}
      >
        <LogOut size={16} aria-hidden /> Sign out
      </button>
    );
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
