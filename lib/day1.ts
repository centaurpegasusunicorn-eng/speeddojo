import { createClient } from "@/lib/supabase/client";

/*
 * The Day 1 photo: kept privately in the student's own account (Supabase
 * Storage, a folder only they can open), so it's there for their belt cards
 * on any device. Set up by supabase/welcome.sql.
 */

const BUCKET = "day1-photos";
const WELCOMED_KEY = "dojo_welcomed";

async function userId(): Promise<string | null> {
  const { data } = await createClient().auth.getUser();
  return data.user?.id ?? null;
}

/** Saves (or replaces) their Day 1 photo. Returns an error message, or null. */
export async function saveDay1(photo: HTMLCanvasElement): Promise<string | null> {
  const uid = await userId();
  if (!uid) return "Please sign in again.";
  const blob: Blob = await new Promise((res) => photo.toBlob((b) => res(b!), "image/jpeg", 0.86));
  const { error } = await createClient()
    .storage.from(BUCKET)
    .upload(`${uid}/day1.jpg`, blob, { upsert: true, contentType: "image/jpeg" });
  return error ? error.message : null;
}

/** Their Day 1 photo as a square canvas, plus the day it was taken */
export async function loadDay1(): Promise<{ photo: HTMLCanvasElement; date: Date } | null> {
  const uid = await userId();
  if (!uid) return null;
  const supabase = createClient();
  const { data: files } = await supabase.storage.from(BUCKET).list(uid, { search: "day1.jpg" });
  const meta = files?.find((f: { name: string }) => f.name === "day1.jpg");
  if (!meta) return null;
  const { data: blob } = await supabase.storage.from(BUCKET).download(`${uid}/day1.jpg`);
  if (!blob) return null;
  const bmp = await createImageBitmap(blob);
  const c = document.createElement("canvas");
  c.width = bmp.width;
  c.height = bmp.height;
  c.getContext("2d")!.drawImage(bmp, 0, 0);
  return { photo: c, date: new Date(meta.created_at ?? meta.updated_at ?? Date.now()) };
}

export async function deleteDay1(): Promise<void> {
  const uid = await userId();
  if (uid) await createClient().storage.from(BUCKET).remove([`${uid}/day1.jpg`]);
}

/** Has this student been through the welcome? (Never blocks on errors.) */
export async function needsWelcome(): Promise<boolean> {
  const uid = await userId();
  if (!uid) return false;
  try {
    if (localStorage.getItem(`${WELCOMED_KEY}_${uid}`)) return false;
  } catch {}
  const { data, error } = await createClient()
    .from("profiles")
    .select("welcomed_at")
    .eq("id", uid)
    .maybeSingle();
  if (error || !data) return false; // e.g. welcome.sql not run yet
  return !data.welcomed_at;
}

export async function markWelcomed(): Promise<void> {
  const uid = await userId();
  if (!uid) return;
  try {
    localStorage.setItem(`${WELCOMED_KEY}_${uid}`, "1");
  } catch {}
  await createClient().from("profiles").update({ welcomed_at: new Date().toISOString() }).eq("id", uid);
}
