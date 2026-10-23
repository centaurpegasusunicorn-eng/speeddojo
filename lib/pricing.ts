/*
 * THE FULL DOJO (paid membership)
 * Copy for the unlock page, and how long a one-off payment lasts.
 * The price itself comes from Stripe (the product you made there), so it
 * only needs changing in one place.
 */

export const PRICING = {
  // How many exercises are free, counting from the first (1 = White belt)
  FREE_EXERCISES: 1,

  // If the Stripe price is a ONE-OFF payment, how many days it unlocks.
  // 365 = a yearly pass. Use 36500 for lifetime access.
  // (If the Stripe price is yearly/recurring, Stripe decides instead.)
  ONE_OFF_ACCESS_DAYS: 365,

  eyebrow: "The full dojo",
  headline: "Unlock all 12 belts",
  intro:
    "You've got the White belt. Keep the momentum going with every exercise, from Yellow to Black.",
  benefits: [
    { title: "All 12 exercises", body: "The full path, basic to advanced, with BPM-synced videos." },
    { title: "Every belt to earn", body: "Track your tempo and clean reps all the way to Black belt." },
    { title: "Keep your progress", body: "Everything you've logged so far carries straight over." },
  ],
  cta: "Unlock the full dojo",
  ctaNote: "Secure checkout with Stripe",
  oneOffNote: "One payment. No subscription, no surprise charges.",
  recurringNote: "Renews yearly. Cancel anytime in a couple of clicks.",
  // Shown if payments aren't set up yet
  priceFallback: "Price coming soon",

  // After paying
  unlockedHeadline: "You're in. All 12 belts are unlocked.",
  unlockedBody: "Your progress is saved. Pick up where you left off.",
  unlockedCta: "Start the next belt",

  // The prompt after earning the White belt
  promptHeadline: "White belt earned!",
  promptBody: "That's the first step on the path. Unlock the next 11 belts to keep going.",
  promptCta: "See the full dojo",
  promptDismiss: "Not now",
};

/** Is this exercise (0 = first) one of the free ones? */
export const isFree = (exerciseIndex: number) =>
  exerciseIndex < PRICING.FREE_EXERCISES;
