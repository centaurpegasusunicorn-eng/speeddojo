import { NextResponse, type NextRequest } from "next/server";
import { getAccess } from "@/lib/access";
import { paymentsOn, priceId, stripe } from "@/lib/stripe";

/*
 * The "Unlock" button posts here. Creates a Stripe Checkout page for the
 * Full Dojo price and sends the student to it. Works for a one-off price
 * or a yearly (recurring) one, whichever the Stripe price is.
 */
export async function POST(request: NextRequest) {
  const origin = request.nextUrl.origin;
  if (!paymentsOn()) return NextResponse.redirect(`${origin}/unlock`, 303);

  const access = await getAccess();
  if (!access.userId) return NextResponse.redirect(`${origin}/login?next=/unlock`, 303);
  if (access.member && access.recurring) {
    // already subscribed: nothing to buy
    return NextResponse.redirect(`${origin}/unlock`, 303);
  }

  const price = await stripe().prices.retrieve(priceId());
  const recurring = !!price.recurring;

  const session = await stripe().checkout.sessions.create({
    mode: recurring ? "subscription" : "payment",
    line_items: [{ price: price.id, quantity: 1 }],
    client_reference_id: access.userId,
    metadata: { user_id: access.userId },
    ...(access.customerId
      ? { customer: access.customerId }
      : { customer_email: access.email ?? undefined }),
    ...(recurring
      ? { subscription_data: { metadata: { user_id: access.userId } } }
      : {
          // a receipt they can find later in "Manage billing"
          invoice_creation: { enabled: true },
          ...(access.customerId ? {} : { customer_creation: "always" as const }),
        }),
    allow_promotion_codes: true,
    success_url: `${origin}/unlocked?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/unlock`,
  });

  return NextResponse.redirect(session.url!, 303);
}
