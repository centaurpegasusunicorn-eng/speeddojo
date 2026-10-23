import "server-only";
import type Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { paymentsOn, stripe } from "@/lib/stripe";
import { PRICING } from "@/lib/pricing";

export type Access = {
  /** false until Stripe is set up: everything stays open */
  paywall: boolean;
  /** has paid (or the paywall is off) */
  member: boolean;
  accessUntil: string | null;
  customerId: string | null;
  recurring: boolean;
};

/** What the signed-in student can use. Reads their own membership row. */
export async function getAccess(): Promise<Access & { userId: string | null; email: string | null }> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = (data?.claims?.sub as string | undefined) ?? null;
  const email = (data?.claims?.email as string | undefined) ?? null;
  const open = { paywall: false, member: true, accessUntil: null, customerId: null, recurring: false };

  if (!paymentsOn()) return { ...open, userId, email };
  if (!userId) return { ...open, paywall: true, member: false, userId, email };

  const { data: row, error } = await supabase
    .from("memberships")
    .select("access_until, stripe_customer_id, stripe_subscription_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) console.error("memberships lookup failed:", error.message);

  const accessUntil = (row?.access_until as string | null) ?? null;
  return {
    paywall: true,
    member: !!accessUntil && new Date(accessUntil) > new Date(),
    accessUntil,
    customerId: (row?.stripe_customer_id as string | null) ?? null,
    recurring: !!row?.stripe_subscription_id,
    userId,
    email,
  };
}

// ─── Recording payments (webhook + the "you're in" page) ──────────────────

/** A finished checkout: unlock the student. Safe to call more than once. */
export async function recordCheckout(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id;
  if (!userId) throw new Error(`Checkout ${session.id} has no student attached`);
  if (session.payment_status === "unpaid") return; // e.g. bank transfer still pending

  const db = createAdminClient();
  const { data: row } = await db
    .from("memberships")
    .select("access_until, last_checkout_session")
    .eq("user_id", userId)
    .maybeSingle();
  if (row?.last_checkout_session === session.id) return; // already counted

  const customerId = idOf(session.customer);
  let accessUntil: Date;
  let subscriptionId: string | null = null;

  if (session.mode === "subscription") {
    subscriptionId = idOf(session.subscription);
    const sub = await stripe().subscriptions.retrieve(subscriptionId!);
    accessUntil = periodEnd(sub);
  } else {
    // One-off pass: add the pass length on top of any time they have left
    const current = row?.access_until ? new Date(row.access_until) : null;
    const from = current && current > new Date() ? current : new Date();
    accessUntil = new Date(from.getTime() + PRICING.ONE_OFF_ACCESS_DAYS * 86_400_000);
  }

  const { error } = await db.from("memberships").upsert({
    user_id: userId,
    access_until: accessUntil.toISOString(),
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    last_checkout_session: session.id,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Saving membership failed: ${error.message}`);
}

/** A subscription renewed, changed or ended: update how long access lasts. */
export async function recordSubscription(sub: Stripe.Subscription) {
  const db = createAdminClient();
  const live = ["active", "trialing", "past_due"].includes(sub.status);
  const accessUntil = live ? periodEnd(sub) : new Date();
  const { error } = await db
    .from("memberships")
    .update({ access_until: accessUntil.toISOString(), updated_at: new Date().toISOString() })
    .eq("stripe_subscription_id", sub.id);
  if (error) throw new Error(`Updating membership failed: ${error.message}`);
}

function periodEnd(sub: Stripe.Subscription): Date {
  const ends = sub.items.data.map((i) => i.current_period_end);
  return new Date(Math.max(...ends) * 1000);
}

function idOf(x: string | { id: string } | null | undefined): string | null {
  if (!x) return null;
  return typeof x === "string" ? x : x.id;
}
