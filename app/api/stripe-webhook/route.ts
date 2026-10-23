import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { recordCheckout, recordSubscription } from "@/lib/access";

/*
 * Stripe calls this when something happens to a payment. It's how the app
 * learns a student has paid, renewed or cancelled, even if they closed the
 * tab before getting back to the site.
 *
 * In Stripe: Developers > Webhooks > Add destination
 *   URL:    https://<your site>/api/stripe-webhook
 *   Events: checkout.session.completed,
 *           checkout.session.async_payment_succeeded,
 *           customer.subscription.updated, customer.subscription.deleted
 * Then put its signing secret (whsec_...) in Vercel as STRIPE_WEBHOOK_SECRET.
 */
export async function POST(request: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!secret || !signature) {
    return new NextResponse("Webhook not set up", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    // Not from Stripe (or the wrong secret)
    return new NextResponse("Bad signature", { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        // Lesson purchases (Payment Links) have no student attached; skip them
        if (event.data.object.client_reference_id) {
          await recordCheckout(event.data.object);
        }
        break;
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await recordSubscription(event.data.object);
        break;
    }
  } catch (err) {
    console.error("Stripe webhook failed:", event.type, err);
    // 500 makes Stripe retry later
    return new NextResponse("Failed", { status: 500 });
  }

  return NextResponse.json({ received: true });
}
