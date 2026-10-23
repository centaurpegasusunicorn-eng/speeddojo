/*
 * Where the exercise and guide videos come from.
 *
 * Videos in lib/mockData.ts are named like "/100.mp4". The player asks for
 * them through /api/video, which decides where to fetch them from:
 *  - Cloudflare R2 once its settings are added in Vercel (see .env.example)
 *  - otherwise the files in the /public folder, as before
 * So nothing changes until R2 is switched on.
 */

/** The address the video player should use for a video file */
export function playUrl(file: string): string {
  if (!file) return "";
  return `/api/video?f=${encodeURIComponent(file.replace(/^\//, ""))}`;
}
