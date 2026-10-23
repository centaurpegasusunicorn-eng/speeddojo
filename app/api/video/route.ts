import { NextResponse, type NextRequest } from "next/server";
import { AwsClient } from "aws4fetch";
import { createClient } from "@/lib/supabase/server";
import { getAccess } from "@/lib/access";
import { isFree } from "@/lib/pricing";
import { EXERCISES } from "@/lib/mockData";

/*
 * Hands the video player a short-lived link to a video.
 *
 * With Cloudflare R2 set up (the four R2_ settings in Vercel), videos live in
 * a private R2 bucket. Only signed-in students get a link, and each link
 * stops working after LINK_HOURS, so links can't be shared around.
 * Without those settings, it falls back to the files in /public.
 *
 * canWatch() below keeps paid belts' videos for members only.
 */

const LINK_HOURS = 6; // long enough for a practice session

// Only plain video file names, nothing that could reach other files
const SAFE_NAME = /^[\w-]+(\/[\w-]+)*\.(mp4|webm|mov|m4v)$/;

export async function GET(request: NextRequest) {
  const file = request.nextUrl.searchParams.get("f") ?? "";
  if (!SAFE_NAME.test(file)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const {
    R2_ACCOUNT_ID: account,
    R2_ACCESS_KEY_ID: keyId,
    R2_SECRET_ACCESS_KEY: secret,
    R2_BUCKET: bucket,
  } = process.env;

  // R2 not set up yet: use the copy in /public
  if (!account || !keyId || !secret || !bucket) {
    return NextResponse.redirect(new URL(`/${file}`, request.nextUrl.origin));
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) {
    return new NextResponse("Please sign in", { status: 401 });
  }
  if (!(await canWatch(file))) {
    return new NextResponse("This video is part of the full dojo", { status: 403 });
  }

  const r2 = new AwsClient({
    accessKeyId: keyId,
    secretAccessKey: secret,
    service: "s3",
    region: "auto",
  });
  const url = new URL(
    `https://${account}.r2.cloudflarestorage.com/${bucket}/${file}`
  );
  url.searchParams.set("X-Amz-Expires", String(LINK_HOURS * 3600));
  const signed = await r2.sign(new Request(url), { aws: { signQuery: true } });

  const res = NextResponse.redirect(signed.url, 302);
  // Let this browser reuse the link for a while (it re-requests the video in
  // chunks as it plays), but never share it with anyone else
  res.headers.set("Cache-Control", `private, max-age=${(LINK_HOURS - 1) * 3600}`);
  return res;
}

// Free belts' videos are open to every signed-in student; the rest need
// a membership (once payments are switched on)
async function canWatch(file: string): Promise<boolean> {
  const name = `/${file}`;
  const freeFiles = EXERCISES.filter((_, i) => isFree(i)).flatMap((e) => [
    e.videoUrl,
    e.videoUrlDark,
    e.guideVideoUrl,
    e.guideVideoUrlDark,
  ]);
  if (freeFiles.includes(name)) return true;
  return (await getAccess()).member;
}
