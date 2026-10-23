import { NextResponse } from "next/server";
import { getAccess } from "@/lib/access";

/* Tells the practice page whether paid belts are open for this student */
export async function GET() {
  const a = await getAccess();
  return NextResponse.json(
    { paywall: a.paywall, member: a.member, accessUntil: a.accessUntil },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
