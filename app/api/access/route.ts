import { NextResponse } from "next/server";
import { getAccess } from "@/lib/access";
import { priceLabel } from "@/lib/stripe";

/* Tells the practice page whether paid belts are open for this student,
   and the price to show on the unlock panel if not */
export async function GET() {
  const a = await getAccess();
  const price = a.paywall && !a.member ? await priceLabel() : null;
  return NextResponse.json(
    { paywall: a.paywall, member: a.member, accessUntil: a.accessUntil, price },
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
