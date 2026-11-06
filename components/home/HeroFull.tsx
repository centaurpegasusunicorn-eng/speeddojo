import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { BELTS } from "@/lib/belts";
import { BRAND } from "@/lib/brand";
import { HOME } from "@/lib/homepage";

/*
 * Full-screen hero: the neon highway fills the screen with the headline over
 * the top. Two arrangements:
 *   "bottom": headline anchored bottom-left, shade rising from the bottom
 *   "center": headline centred, the whole video dimmed evenly
 * The 12 belt colours run along the bottom edge and fill in on load.
 */
export default function HeroFull({
  variant,
  signUp,
}: {
  variant: "bottom" | "center";
  signUp: string;
}) {
  const h = HOME.hero;
  const center = variant === "center";

  return (
    <section className="relative min-h-[100svh] lg:h-[100svh] lg:min-h-[640px] lg:max-h-[1100px] overflow-hidden bg-black text-white">
      <video
        src="/home/hero-full.mp4"
        poster="/home/hero-full.jpg"
        autoPlay
        muted
        loop
        playsInline
        aria-hidden
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* shade so the words read clearly over the video */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: center
            ? "radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.78) 70%, rgba(0,0,0,0.9) 100%)"
            : "linear-gradient(to top, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.72) 32%, rgba(0,0,0,0.2) 62%, rgba(0,0,0,0.45) 100%)",
        }}
      />

      {/* nav over the video */}
      <header className="absolute top-0 inset-x-0 z-10">
        <div className="px-4 sm:px-8 h-20 flex items-center justify-between max-w-7xl mx-auto">
          <span className="text-lg sm:text-xl tracking-[0.3em] font-light">{BRAND.name.toUpperCase()}</span>
          <nav className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle className="hidden sm:block" />
            <Link href="/login" className="px-2 text-[15px] font-medium hover:underline">
              {HOME.nav.signIn}
            </Link>
            <Link
              href={signUp}
              className="rounded-lg px-4 py-2.5 text-[15px] font-semibold bg-[#CC1010] text-white hover:bg-[#B00D0D] transition"
            >
              {HOME.nav.start}
            </Link>
          </nav>
        </div>
      </header>

      <div
        className={`relative min-h-[100svh] lg:min-h-0 lg:h-full px-4 sm:px-8 pt-28 max-w-7xl mx-auto flex ${
          center ? "items-center justify-center text-center pb-16" : "items-end pb-16 sm:pb-24"
        }`}
      >
        <div className={center ? "max-w-5xl" : "max-w-4xl"}>
          <h1
            className="wide text-[2.35rem] leading-[1.02] sm:text-7xl lg:text-[6.2rem] font-extrabold tracking-[-0.025em]"
            style={{ textShadow: "0 4px 40px rgba(0,0,0,0.5)" }}
          >
            {h.headline}
          </h1>
          <p className={`mt-6 text-lg sm:text-2xl leading-relaxed text-white/80 max-w-[38rem] ${center ? "mx-auto" : ""}`}>
            {h.body}
          </p>
          <div className={`mt-9 flex flex-wrap items-center gap-3 ${center ? "justify-center" : ""}`}>
            <Link
              href={signUp}
              className="rounded-xl px-8 py-4 text-lg font-bold bg-[#CC1010] text-white hover:bg-[#B00D0D] active:scale-[0.98] transition shadow-[0_10px_30px_rgba(204,16,16,0.45)]"
            >
              {h.primary}
            </Link>
            <a
              href="#pricing"
              className="rounded-xl px-6 py-4 text-lg font-semibold border border-white/40 hover:bg-white/10 transition"
            >
              {h.secondary}
            </a>
          </div>
          <p className="mt-4 text-[15px] text-white/60">{h.note}</p>
        </div>
      </div>

      {/* the 12 belts along the bottom edge */}
      <div className="absolute bottom-0 inset-x-0 flex h-2.5 sm:h-3" aria-hidden>
        {BELTS.map((b, i) => (
          <span
            key={b.name}
            className="belt-fill flex-1 origin-left"
            style={{
              background: b.color,
              animationDelay: `${0.4 + i * 0.07}s`,
              boxShadow: b.name === "Black" ? "inset 0 1px 0 rgba(255,255,255,0.25)" : undefined,
            }}
          />
        ))}
      </div>
    </section>
  );
}
