import "@fontsource-variable/archivo/wdth.css";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Check, Fish, Guitar, PawPrint, Play } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import HeroVideo from "@/components/home/HeroVideo";
import BeltBand from "@/components/home/BeltBand";
import HeroFull from "@/components/home/HeroFull";
import TryIt from "@/components/home/TryIt";
import DialHero from "@/components/home/DialHero";
import { createClient } from "@/lib/supabase/server";
import { priceLabel } from "@/lib/stripe";
import { PRICING } from "@/lib/pricing";
import { BRAND } from "@/lib/brand";
import { HOME } from "@/lib/homepage";

/*
 * The public homepage / sales page. Signed-in students skip straight to
 * practice. All the words live in lib/homepage.ts.
 */

export const metadata: Metadata = {
  title: `${BRAND.name}: ${HOME.metaTitle}`,
  description: HOME.metaDescription,
};

const SIGN_UP = "/login?mode=signup";
const SIGN_UP_THEN_BUY = "/login?mode=signup&next=/unlock";

type HeroLayout = "dial" | "try" | "split" | "bottom" | "center";
const LAYOUTS: HeroLayout[] = ["dial", "try", "split", "bottom", "center"];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims) redirect("/dashboard");

  // The hero layout is set in lib/homepage.ts; ?hero=try|split|bottom|center
  // previews another one without changing anything
  const { hero } = await searchParams;
  const layout: HeroLayout = LAYOUTS.includes(hero as HeroLayout)
    ? (hero as HeroLayout)
    : HOME.heroLayout;
  const fullScreen = layout === "bottom" || layout === "center";

  const price = await priceLabel();
  const h = HOME;

  const ctas = (
    <>
      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Link
          href={SIGN_UP}
          className="rounded-xl px-7 py-4 text-lg font-bold bg-[#CC1010] text-white hover:bg-[#B00D0D] active:scale-[0.98] transition"
        >
          {h.hero.primary}
        </Link>
        <a href="#pricing" className="rounded-xl px-6 py-4 text-lg font-semibold border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-900 transition">
          {h.hero.secondary}
        </a>
      </div>
      <p className="mt-4 text-[15px] text-neutral-500 dark:text-neutral-400">{h.hero.note}</p>
    </>
  );

  return (
    <div className="home w-full text-neutral-900 dark:text-neutral-100">
      {fullScreen ? (
        <HeroFull variant={layout} signUp={SIGN_UP} />
      ) : (
      <>
      {/* ── nav ── */}
      <header className="px-4 sm:px-8 h-20 flex items-center justify-between max-w-7xl mx-auto">
        <span className="text-lg sm:text-xl tracking-[0.3em] font-light text-neutral-800 dark:text-neutral-200">
          {BRAND.name.toUpperCase()}
        </span>
        <nav className="flex items-center gap-2 sm:gap-4">
          <ThemeToggle className="hidden sm:block" />
          <Link href="/login" className="px-2 text-[15px] font-medium hover:underline">
            {h.nav.signIn}
          </Link>
          <Link
            href={SIGN_UP}
            className="rounded-lg px-4 py-2.5 text-[15px] font-semibold bg-[#CC1010] text-white hover:bg-[#B00D0D] transition"
          >
            {h.nav.start}
          </Link>
        </nav>
      </header>

      <div>
        {layout === "dial" ? (
          <DialHero
            headline={h.hero.headline}
            body={h.hero.body}
            primary={h.hero.primary}
            primaryHref={SIGN_UP}
            note={h.hero.note}
            hint={h.hero.dialHint}
          />
        ) : layout === "try" ? (
          /* ── hero: words, then the working practice player ── */
          <section className="px-4 sm:px-8 max-w-7xl mx-auto pt-8 sm:pt-12 pb-12 sm:pb-16">
            <div className="grid lg:grid-cols-[1.15fr_1fr] gap-6 lg:gap-14 items-end">
              <h1 className="wide text-[2.4rem] leading-[1.03] sm:text-6xl lg:text-[4.2rem] font-extrabold tracking-[-0.02em]">
                {h.hero.headline}
              </h1>
              <div>
                <p className="text-lg sm:text-xl leading-relaxed text-neutral-600 dark:text-neutral-400 max-w-[34rem]">
                  {h.hero.body}
                </p>
                {ctas}
              </div>
            </div>
            <div className="mt-10 sm:mt-14">
              <TryIt />
            </div>
          </section>
        ) : (
          /* ── hero: words beside a looping clip ── */
          <section className="px-4 sm:px-8 max-w-7xl mx-auto pt-8 sm:pt-14 pb-12 sm:pb-16 grid lg:grid-cols-[1fr_1.05fr] gap-10 lg:gap-14 items-center">
            <div>
              <h1 className="wide text-[2.6rem] leading-[1.02] sm:text-6xl lg:text-[4.4rem] font-extrabold tracking-[-0.02em]">
                {h.hero.headline}
              </h1>
              <p className="mt-6 text-lg sm:text-xl leading-relaxed text-neutral-600 dark:text-neutral-400 max-w-[34rem]">
                {h.hero.body}
              </p>
              {ctas}
            </div>
            <div className="rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.35)]">
              <HeroVideo />
            </div>
          </section>
        )}

        {/* ── the belt band: the whole path in one line ── */}
        <section className={`px-4 sm:px-8 max-w-7xl mx-auto ${layout === "dial" ? "pt-16 sm:pt-24" : ""}`}>
          <BeltBand />
          <p className="mt-5 text-lg text-neutral-700 dark:text-neutral-300">{h.band.caption}</p>
        </section>
      </div>
      </>
      )}

      <main>
        {/* full-screen heroes carry the belts along their bottom edge */}
        {fullScreen && (
          <p className="px-4 sm:px-8 max-w-7xl mx-auto pt-10 text-lg text-neutral-700 dark:text-neutral-300">
            {h.band.caption}
          </p>
        )}

        {/* ── Rach's video, full width ── */}
        <section className="mt-16 sm:mt-24">
          {h.video.url ? (
            <video
              src={h.video.url}
              poster={h.video.poster || undefined}
              controls
              playsInline
              preload="metadata"
              className="block w-full max-h-[90vh] aspect-video bg-black"
            />
          ) : (
            <div className="w-full aspect-video max-h-[80vh] bg-neutral-900 text-white flex flex-col items-center justify-center gap-4 px-6 text-center">
              <span className="w-20 h-20 rounded-full bg-[#CC1010] flex items-center justify-center">
                <Play size={34} fill="currentColor" className="ml-1" aria-hidden />
              </span>
              <p className="text-lg text-white/70">{h.video.placeholder}</p>
            </div>
          )}
          {h.video.caption && (
            <p className="px-4 sm:px-8 max-w-7xl mx-auto mt-4 text-[15px] text-neutral-500 dark:text-neutral-400">
              {h.video.caption}
            </p>
          )}
        </section>

        {/* ── how a belt is earned (a real sequence, so it's numbered) ── */}
        <section className="px-4 sm:px-8 max-w-7xl mx-auto pt-24 sm:pt-32">
          <h2 className="wide text-3xl sm:text-5xl font-extrabold tracking-[-0.015em]">{h.steps.heading}</h2>
          <ol className="mt-10 grid md:grid-cols-3 gap-10 md:gap-8">
            {h.steps.items.map((s, i) => (
              <li key={s.title}>
                <span className="wide block text-6xl font-extrabold text-[#CC1010] leading-none">{i + 1}</span>
                <h3 className="mt-4 text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-[17px] leading-relaxed text-neutral-600 dark:text-neutral-400 max-w-sm">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── views ── */}
        <section className="px-4 sm:px-8 max-w-7xl mx-auto pt-24 sm:pt-32 grid lg:grid-cols-[1fr_1.2fr] gap-10 items-center">
          <div>
            <h2 className="wide text-3xl sm:text-5xl font-extrabold tracking-[-0.015em]">{h.views.heading}</h2>
            <p className="mt-5 text-lg leading-relaxed text-neutral-600 dark:text-neutral-400 max-w-[34rem]">{h.views.body}</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Guitar, style: { backgroundImage: "url(/home/hero.jpg)", backgroundSize: "cover", backgroundPosition: "center" } },
              { icon: Fish, style: { background: "radial-gradient(ellipse at 50% 40%, #1f6f78 0%, #0e3b4a 60%, #072430 100%)" } },
              { icon: PawPrint, style: { background: "linear-gradient(180deg, #2d4a3e 0%, #3f5f4a 38%, #4f6b73 52%, #2c4f63 100%)" } },
            ].map((v, i) => (
              <figure key={i}>
                <div className="aspect-[3/4] rounded-xl border border-neutral-200 dark:border-neutral-800" style={v.style} />
                <figcaption className="mt-2 flex items-center gap-1.5 text-[15px] font-medium">
                  <v.icon size={16} aria-hidden /> {h.views.labels[i]}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* ── belt card ── */}
        <section className="mt-24 sm:mt-32 bg-black text-white">
          <div className="px-4 sm:px-8 max-w-7xl mx-auto py-16 sm:py-24 grid md:grid-cols-[1fr_auto] gap-10 md:gap-16 items-center">
            <div>
              <h2 className="wide text-3xl sm:text-5xl font-extrabold tracking-[-0.015em]">{h.card.heading}</h2>
              <p className="mt-5 text-lg leading-relaxed text-white/70 max-w-[32rem]">{h.card.body}</p>
            </div>
            <figure className="justify-self-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/home/belt-card.jpg" alt="An example belt card for the Blue belt" className="w-[min(78vw,340px)] rounded-xl shadow-[0_20px_60px_rgba(37,99,235,0.35)]" />
              <figcaption className="mt-3 text-center text-[14px] text-white/50">{h.card.caption}</figcaption>
            </figure>
          </div>
        </section>

        {/* ── a note from Rach ── */}
        <section className="px-4 sm:px-8 max-w-3xl mx-auto pt-24 sm:pt-32">
          <div className="flex items-center gap-4">
            {h.founder.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={h.founder.photo} alt={h.founder.signature} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <span className="w-16 h-16 rounded-full bg-[#CC1010] text-white flex items-center justify-center text-2xl font-bold">
                {h.founder.signature.charAt(0)}
              </span>
            )}
            <h2 className="wide text-2xl sm:text-3xl font-extrabold">{h.founder.heading}</h2>
          </div>
          <p className="mt-6 text-xl leading-relaxed text-neutral-700 dark:text-neutral-300">{h.founder.body}</p>
          <p className="mt-4 text-lg font-semibold">{h.founder.signature}</p>
        </section>

        {/* ── testimonials: only when there are real ones ── */}
        {h.testimonials.length > 0 && (
          <section className="px-4 sm:px-8 max-w-7xl mx-auto pt-24 grid md:grid-cols-3 gap-8">
            {h.testimonials.map((t) => (
              <blockquote key={t.name}>
                <p className="text-lg leading-relaxed">&ldquo;{t.quote}&rdquo;</p>
                <footer className="mt-3 text-[15px] text-neutral-500 dark:text-neutral-400">
                  {t.name}, {t.detail}
                </footer>
              </blockquote>
            ))}
          </section>
        )}

        {/* ── pricing ── */}
        <section id="pricing" className="px-4 sm:px-8 max-w-5xl mx-auto pt-24 sm:pt-32 scroll-mt-8">
          <h2 className="wide text-3xl sm:text-5xl font-extrabold tracking-[-0.015em]">{h.pricing.heading}</h2>
          <div className="mt-10 grid md:grid-cols-2 gap-5">
            <Plan
              name={h.pricing.free.name}
              price={h.pricing.free.price}
              points={h.pricing.free.points}
              cta={h.pricing.free.cta}
              href={SIGN_UP}
              stripe="#FFFFFF"
            />
            <Plan
              name={h.pricing.full.name}
              price={price?.text ?? PRICING.priceFallback}
              note={price ? (price.recurring ? h.pricing.recurringNote : h.pricing.oneOffNote) : undefined}
              points={h.pricing.full.points}
              cta={h.pricing.full.cta}
              href={SIGN_UP_THEN_BUY}
              stripe="#111111"
              featured
            />
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="px-4 sm:px-8 max-w-3xl mx-auto pt-24 sm:pt-32">
          <h2 className="wide text-3xl sm:text-4xl font-extrabold">{h.faq.heading}</h2>
          <div className="mt-6 divide-y divide-neutral-200 dark:divide-neutral-800 border-y border-neutral-200 dark:border-neutral-800">
            {h.faq.items.map((f) => (
              <details key={f.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="text-2xl leading-none text-neutral-400 transition-transform group-open:rotate-45" aria-hidden>
                    +
                  </span>
                </summary>
                <p className="mt-3 text-[17px] leading-relaxed text-neutral-600 dark:text-neutral-400">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ── last call ── */}
        <section className="px-4 sm:px-8 max-w-7xl mx-auto py-24 sm:py-32 text-center">
          <h2 className="wide text-4xl sm:text-6xl font-extrabold tracking-[-0.02em]">{h.final.heading}</h2>
          <p className="mt-4 text-lg text-neutral-600 dark:text-neutral-400">{h.final.body}</p>
          <Link
            href={SIGN_UP}
            className="mt-8 inline-block rounded-xl px-8 py-4 text-lg font-bold bg-[#CC1010] text-white hover:bg-[#B00D0D] active:scale-[0.98] transition shadow-[0_8px_24px_rgba(204,16,16,0.3)]"
          >
            {h.final.cta}
          </Link>
        </section>
      </main>

      <footer className="border-t border-neutral-200 dark:border-neutral-800">
        <div className="px-4 sm:px-8 max-w-7xl mx-auto py-8 flex flex-wrap items-center justify-between gap-4 text-[15px] text-neutral-500 dark:text-neutral-400">
          <span>
            © {new Date().getFullYear()} {BRAND.name}
            {BRAND.instagram && <> · {BRAND.instagram}</>}
          </span>
          <nav className="flex gap-6">
            {h.footer.links.map((l) => (
              <Link key={l.href} href={l.href} className="hover:underline">
                {l.label}
              </Link>
            ))}
            <ThemeToggle className="sm:hidden" />
          </nav>
        </div>
      </footer>
    </div>
  );
}

function Plan({
  name,
  price,
  note,
  points,
  cta,
  href,
  stripe,
  featured = false,
}: {
  name: string;
  price: string;
  note?: string;
  points: string[];
  cta: string;
  href: string;
  stripe: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-7 sm:p-8 flex flex-col ${
        featured
          ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
          : "border border-neutral-200 dark:border-neutral-800"
      }`}
    >
      {/* the belt this plan gets you to */}
      <span
        aria-hidden
        className="block h-2.5 w-16 rounded-full"
        style={{ background: stripe, boxShadow: "inset 0 0 0 1px rgba(128,128,128,0.45)" }}
      />
      <h3 className="mt-5 text-xl font-bold">{name}</h3>
      <p className="wide mt-2 text-4xl font-extrabold">{price}</p>
      {note && <p className={`mt-1 text-[15px] ${featured ? "opacity-70" : "text-neutral-500"}`}>{note}</p>}
      <ul className="mt-6 space-y-3 flex-1">
        {points.map((p) => (
          <li key={p} className="flex gap-3 text-[17px]">
            <Check size={20} className="shrink-0 mt-0.5 text-[#CC1010]" aria-hidden />
            {p}
          </li>
        ))}
      </ul>
      <Link
        href={href}
        className={`mt-8 rounded-xl px-6 py-3.5 text-center text-lg font-bold transition active:scale-[0.98] ${
          featured
            ? "bg-[#CC1010] text-white hover:bg-[#B00D0D]"
            : "border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-900"
        }`}
      >
        {cta}
      </Link>
    </div>
  );
}
