import "server-only";
import Stripe from "stripe";

/*
 * Stripe, for server code only (the secret key never reaches the browser).
 * Settings live in Vercel (and .env.local on your Mac):
 *   STRIPE_SECRET_KEY      sk_test_... (sandbox) or sk_live_... (real)
 *   STRIPE_PRICE_ID        price_...   the Full Dojo price
 *   STRIPE_WEBHOOK_SECRET  whsec_...   from the webhook you add in Stripe
 */

/** Payments switch on once the key and price are both set */
export function paymentsOn(): boolean {
  return !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_PRICE_ID;
}

let client: Stripe | null = null;
export function stripe(): Stripe {
  if (!client) client = new Stripe(process.env.STRIPE_SECRET_KEY as string);
  return client;
}

export function priceId(): string {
  return process.env.STRIPE_PRICE_ID as string;
}

/** The Full Dojo price as shown on the unlock page, e.g. "$99 / year" */
export async function priceLabel(): Promise<{ text: string; recurring: boolean } | null> {
  if (!paymentsOn()) return null;
  try {
    const p = await stripe().prices.retrieve(priceId());
    if (p.unit_amount == null) return null;
    const amount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: p.currency.toUpperCase(),
      minimumFractionDigits: p.unit_amount % 100 === 0 ? 0 : 2,
    }).format(p.unit_amount / 100);
    const every = p.recurring
      ? ` / ${p.recurring.interval_count > 1 ? `${p.recurring.interval_count} ` : ""}${p.recurring.interval}${p.recurring.interval_count > 1 ? "s" : ""}`
      : "";
    return { text: amount + every, recurring: !!p.recurring };
  } catch (err) {
    console.error("Couldn't load the Stripe price:", err);
    return null;
  }
}
