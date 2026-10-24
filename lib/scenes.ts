/*
 * VIEWS FOR THE PRACTICE VIDEO
 * Highway shows the notes. The others replace the picture with a calm,
 * looping scene once students know the notes: the click, count-in and rep
 * prompt carry on exactly the same underneath.
 *
 * For each scene, put a short seamless loop in /public (or R2) and name it
 * here. Scenes play at normal speed whatever the tempo. Leave videoUrl ""
 * to show a simple placeholder until the real video is ready.
 */
export type SceneId = "highway" | "fish" | "bears";

export const SCENES: {
  id: SceneId;
  label: string;
  videoUrl?: string;
  videoUrlDark?: string; // optional dark-mode version
}[] = [
  { id: "highway", label: "Highway" },
  { id: "fish", label: "Fish", videoUrl: "", videoUrlDark: "" },
  { id: "bears", label: "Bears", videoUrl: "", videoUrlDark: "" },
];

/** Scene video files (kept open to every student, like the free belt) */
export const SCENE_FILES = SCENES.flatMap((s) => [s.videoUrl, s.videoUrlDark]).filter(
  (f): f is string => !!f
);

const KEY = "dojo_view_";

/** The view chosen for an exercise (remembered per exercise, per browser) */
export function loadScene(exerciseId: string): SceneId {
  try {
    const v = localStorage.getItem(KEY + exerciseId);
    if (SCENES.some((s) => s.id === v)) return v as SceneId;
  } catch {}
  return "highway";
}

export function saveScene(exerciseId: string, id: SceneId) {
  try {
    localStorage.setItem(KEY + exerciseId, id);
  } catch {}
}
