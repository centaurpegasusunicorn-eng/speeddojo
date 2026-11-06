import { BELTS } from "@/lib/belts";

/*
 * The 12 belt colours as one full-width band. On load it fills from White
 * to Black (once; skipped with reduced motion). The page's signature image.
 */
export default function BeltBand() {
  return (
    <div className="relative" aria-hidden>
      <div className="flex h-5 sm:h-7">
        {BELTS.map((b, i) => (
          <span
            key={b.name}
            className="belt-fill flex-1 origin-left"
            style={{
              background: b.color,
              animationDelay: `${0.25 + i * 0.07}s`,
              // edges for the two belts that can blend into the page
              boxShadow:
                b.name === "White"
                  ? "inset 0 0 0 1px rgba(0,0,0,0.12)"
                  : b.name === "Black"
                  ? "inset 0 0 0 1px rgba(255,255,255,0.22)"
                  : undefined,
            }}
          />
        ))}
      </div>
      <div className="hidden md:flex mt-2 text-[12px] text-neutral-500 dark:text-neutral-400">
        {BELTS.map((b) => (
          <span key={b.name} className="flex-1 pl-1.5">
            {b.name}
          </span>
        ))}
      </div>
    </div>
  );
}
