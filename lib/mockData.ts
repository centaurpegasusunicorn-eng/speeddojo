import { Rep } from "./belts";

/*
 * THE 12 EXERCISES, in path order (exercise 1 earns the White belt, exercise 2
 * Yellow, and so on - see BELTS in lib/belts.ts).
 *
 *  name         heading shown on the exercise page (rename freely)
 *  videoUrl     file in /public (light mode)
 *  videoUrlDark dark-mode version of the same video (optional). Must be the
 *               identical take, same length, same tempo, starting on beat 1.
 *               Left out, or file missing: dark mode plays the light video.
 *  originalBpm  tempo the video was RECORDED at (the click grid uses this)
 *  startBpm     lowest tempo on the dial
 *  endBpm       highest tempo on the dial = the tempo to master
 *  guideVideoUrl       optional "how to approach this" video (normal speed,
 *                      opens in a pop-up). Leave out for no button.
 *  guideVideoUrlDark   optional dark-mode version of it
 *  guideLabel          optional button text (default "How to approach this
 *                      exercise")
 *
 * Keep each id the same once students have used it. Exercises 3-12 below use
 * dummy content (see DUMMY): replace them as you make the real ones.
 */
export type Exercise = {
  id: string;
  name: string;
  description: string;
  videoUrl: string;
  videoUrlDark?: string;
  guideVideoUrl?: string;
  guideVideoUrlDark?: string;
  guideLabel?: string;
  originalBpm: number;
  startBpm: number;
  endBpm: number;
};

// DUMMY CONTENT: exercises 3-12 borrow Silent Step's video, description and
// tempos so the whole path can be tested. Replace each one (name,
// description, videos, tempos) as you make the real exercise. Keep the ids.
const DUMMY = {
  description:
    "Legato hammer-ons and pull-offs with zero pick noise. Focus on even volume between fretted and picked notes.",
  videoUrl: "/100.mp4",
  videoUrlDark: "/100-dark.mp4",
  originalBpm: 60,
  startBpm: 60,
  endBpm: 90,
};

export const EXERCISES: Exercise[] = [
  {
    id: "shadow-strike",
    name: "Shadow Strike",
    description:
      "Strict alternate picking across three strings. Keep the pick angle shallow and let your wrist do the work, not your elbow.",
    videoUrl: "/100.mp4", // update to your real filename in /public
    videoUrlDark: "/100-dark.mp4", // drop the dark render in /public with this name
    // Your setup + picking technique video. Uncomment when the file is in /public:
    // guideVideoUrl: "/start.mp4",
    // guideLabel: "Start here: setup and picking technique",
    originalBpm: 60,
    startBpm: 60,
    endBpm: 100,
  },
  {
    id: "silent-step",
    name: "Silent Step",
    description:
      "Legato hammer-ons and pull-offs with zero pick noise. Focus on even volume between fretted and picked notes.",
    videoUrl: "/100.mp4",
    videoUrlDark: "/100-dark.mp4",
    originalBpm: 60,
    startBpm: 60,
    endBpm: 90,
  },
  { id: "lesson-3", name: "Exercise 3", ...DUMMY },
  { id: "lesson-4", name: "Exercise 4", ...DUMMY },
  { id: "lesson-5", name: "Exercise 5", ...DUMMY },
  { id: "lesson-6", name: "Exercise 6", ...DUMMY },
  { id: "lesson-7", name: "Exercise 7", ...DUMMY },
  { id: "lesson-8", name: "Exercise 8", ...DUMMY },
  { id: "lesson-9", name: "Exercise 9", ...DUMMY },
  { id: "lesson-10", name: "Exercise 10", ...DUMMY },
  { id: "lesson-11", name: "Exercise 11", ...DUMMY },
  { id: "lesson-12", name: "Exercise 12", ...DUMMY },
];

export function getExercise(id: string): Exercise | undefined {
  return EXERCISES.find((e) => e.id === id);
}

// Unused sample data, kept for reference
export const SEED_REPS: Rep[] = [];
