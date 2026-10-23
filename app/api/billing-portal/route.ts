import { NextResponse, type NextRequest } from "next/server";
import { getAccess } from "@/lib/access";
import { paymentsOn, stripe } from "@/lib/stripe";

/* "Manage billing": Stripe's own page for receipts, card details, cancelling */
export async function POST(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const access = await getAccess();
  if (!paymentsOn() || !access.customerId) {
    return NextResponse.redirect(`${origin}/unlock`, 303);
  }
  const portal = await stripe().billingPortal.sessions.create({
    customer: access.customerId,
    return_url: `${origin}/unlock`,
  });
  return NextResponse.redirect(portal.url, 303);
}
