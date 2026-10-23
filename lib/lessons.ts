/*
 * 1:1 LESSONS: everything you'd want to edit lives here.
 *
 * The flow:
 *   "Book a lesson" button  ->  /lessons (sales page)
 *   -> Stripe Payment Link (STRIPE_PAYMENT_LINK)
 *   -> after paying, Stripe sends them to /lessons/booked
 *   -> "Pick your time" button opens your calendar (BOOKING_URL)
 *
 * Stripe setup (no code): Stripe dashboard > Payment Links > New.
 *   Under "After payment", choose "Don't show confirmation page" and enter:
 *   https://YOUR-SITE/lessons/booked
 *   (while testing locally: http://localhost:3000/lessons/booked)
 *   Then paste the link Stripe gives you below.
 */

export const LESSON = {
  // ─── Settings ────────────────────────────────────────────────────────────
  price: "$60", // PLACEHOLDER: display only; the real charge is set in Stripe
  length: "45 minutes", // PLACEHOLDER
  STRIPE_PAYMENT_LINK: "", // e.g. "https://buy.stripe.com/abc123"
  BOOKING_URL: "", // e.g. "https://calendly.com/your-name/lesson"

  // ─── Sales page copy (all placeholder) ───────────────────────────────────
  eyebrow: "1:1 online lesson",
  headline: "Break through the tempo wall",
  // {exercise} is replaced with the exercise they came from, if any
  intro:
    "Stuck on {exercise}? A short live lesson finds what's holding your speed back and gives you a plan to fix it.",
  introNoExercise:
    "A short live lesson finds what's holding your speed back and gives you a plan to fix it.",
  benefits: [
    {
      title: "Live feedback on your playing",
      body: "Play the exercise on camera and get your picking, fretting and timing checked in real time.",
    },
    {
      title: "The fix, not just the problem",
      body: "Leave with the one or two changes that will make the biggest difference.",
    },
    {
      title: "A plan for your next week",
      body: "Tempos and rep targets to take back into the dojo.",
    },
  ],
  steps: ["Pay securely", "Pick a time that suits you", "Meet online"],
  cta: "Book my lesson",
  ctaNote: "Secure payment by Stripe. You'll choose your time right after.",

  // ─── After-payment page copy ─────────────────────────────────────────────
  bookedHeadline: "You're in. Now pick your time.",
  bookedBody:
    "Payment received, thank you. Choose a slot that suits you and you'll get a confirmation email with the video link.",
  bookedCta: "Pick your time",
};
