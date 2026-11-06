/*
 * HOMEPAGE COPY
 * Every word on the public homepage (speeddojo.com/) lives here, so you can
 * rewrite it without touching the layout. Anything in [square brackets] is
 * a placeholder only you can fill in.
 *
 * The price comes from Stripe automatically. Testimonials stay hidden until
 * you add real ones.
 */

export const HOME = {
  // Hero layout: "try" (headline, then a working practice player with the
  // real dial and click), "split" (headline beside a looping clip), "bottom"
  // or "center" (full-screen video). Add ?hero=split (etc.) to the homepage
  // address to preview one.
  heroLayout: "try" as "try" | "split" | "bottom" | "center",

  // Your full-width video, straight after the belt band: put the file in
  // /public/home and name it here, e.g. "/home/rach.mp4". Leave "" for the
  // placeholder.
  video: {
    url: "",
    poster: "", // a still to show before it plays, e.g. "/home/rach.jpg"
    placeholder: "[Rach's video: playing, talking, and showing SpeedDojo]",
    caption: "",
  },

  metaTitle: "Guitar speed training you can measure",
  metaDescription:
    "Tempo-synced practice videos, a dial that remembers your best, and a belt to earn for every exercise. Start Core Training free.",

  nav: { signIn: "Sign in", start: "Start free" },

  hero: {
    headline: "Build real guitar speed, one clean rep at a time.",
    body:
      "Play along with tempo-synced exercise videos, log every clean rep, and earn a belt for each exercise on the way to Black. The White belt is free.",
    primary: "Start free",
    secondary: "See what's included",
    note: "Free account. Works in your browser on computer, tablet, or phone.",
  },

  band: {
    caption: "Core Training takes you from White belt to Black in 12 exercises.",
  },

  steps: {
    heading: "How a belt is earned",
    items: [
      {
        title: "Play along at your tempo",
        body: "Set the dial and the video, click, and count-in all follow. Start slow and nudge it up as the pattern settles.",
      },
      {
        title: "Log the clean ones",
        body: "After each run, tap Yes if it was clean. Your chart keeps every rep and every tempo, so progress is something you can see.",
      },
      {
        title: "Earn the belt",
        body: "Five clean reps at the target tempo earns the belt and opens the next exercise.",
      },
    ],
  },

  views: {
    heading: "Learn it with the highway, then play by feel",
    body:
      "Start with the note highway on screen. Once the pattern is in your hands, switch the view to a calm river scene and keep your eyes off the fretboard while the click carries on.",
    labels: ["Highway", "Fish", "Bears"],
  },

  card: {
    heading: "Every belt gets its moment",
    body:
      "Take a Day 1 photo when you join. Each new belt puts it next to today's photo with your tempo gain, ready to share or keep for yourself.",
    caption: "Example belt card",
  },

  founder: {
    heading: "A note from Rach",
    body: "[A few lines in your own words: why you built SpeedDojo, how you practise, and what you want students to get from it.]",
    signature: "Rach",
    photo: "", // e.g. "/home/rach.jpg"; leave "" to show your initial
  },

  // Real quotes only, added with the student's permission, e.g.
  // { quote: "...", name: "Maya", detail: "Green Belt, +34 BPM" }
  testimonials: [] as { quote: string; name: string; detail: string }[],

  pricing: {
    heading: "Start free, unlock when you're ready",
    free: {
      name: "White belt",
      price: "Free",
      points: [
        "The first Core Training exercise",
        "Tempo dial, progress chart, and rep log",
        "Belt celebration and your belt card",
      ],
      cta: "Start free",
    },
    full: {
      name: "Full dojo",
      points: [
        "All 12 Core Training belts, White to Black",
        "Every practice video and view",
        "Your free-belt progress carries straight over",
      ],
      cta: "Get the full dojo",
    },
    oneOffNote: "One payment for a year of access.",
    recurringNote: "Renews yearly. Cancel in a couple of clicks.",
  },

  faq: {
    heading: "Questions",
    items: [
      {
        q: "What do I need?",
        a: "A guitar, a browser, and headphones or speakers. SpeedDojo runs on a computer, tablet, or phone, with nothing to install.",
      },
      {
        q: "What level is Core Training for?",
        a: "[Who it suits, and roughly where they should be before starting.]",
      },
      {
        q: "Do I keep my progress if I upgrade?",
        a: "Yes. Everything you log on the White belt carries over to the full dojo.",
      },
      {
        q: "How much practice does a belt take?",
        a: "[A rough guide, e.g. how many sessions a typical belt takes.]",
      },
    ],
  },

  final: {
    heading: "Your White belt is waiting",
    body: "Make a free account and play your first rep in a couple of minutes.",
    cta: "Start free",
  },

  footer: {
    links: [
      { label: "1:1 lessons", href: "/lessons" },
      { label: "Sign in", href: "/login" },
    ],
  },
};
