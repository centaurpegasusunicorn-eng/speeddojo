/*
 * THE SHAREABLE BELT CARD
 * Draws the "I earned my belt" image (1080 x 1350, the portrait size that
 * suits Instagram, Facebook and most apps) with the student's photo, the
 * belt worn across it, and their achievement. Everything happens on their
 * device: the photo is never uploaded.
 */

import { BRAND } from "@/lib/brand";

export const CARD_W = 1080;
export const CARD_H = 1350;
export const GOLD = "#F5C542";

// The belt drawing (same shape as the celebration), in a 600 x 290 box
export const BELT_PATHS = {
  band: "M10 62 Q300 96 590 62 L590 114 Q300 148 10 114 Z",
  tailL: "M266 126 L304 126 L274 272 L230 262 Z",
  tailR: "M296 126 L334 126 L370 262 L326 272 Z",
  knot: "M262 68 Q300 60 338 68 L347 142 Q300 153 253 142 Z",
  bandStitch: "M24 76 Q300 109 576 76 M24 100 Q300 133 576 100",
  knotStitch: "M267 83 Q300 76 333 83 M259 128 Q300 137 341 128",
  goldL: "M238 228 L282 232 L279 247 L235 243 Z",
  goldR: "M362 228 L318 232 L321 247 L365 243 Z",
};

/** The belt as a standalone SVG (for the card and the camera frame) */
export function beltSvg(color: string, opts: { light: boolean; black: boolean }): string {
  const P = BELT_PATHS;
  const edge = opts.light ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.25)";
  const stitch = opts.light ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.3)";
  const piece = (d: string) =>
    `<path d="${d}" fill="${color}" stroke="${edge}" stroke-width="2"/><path d="${d}" fill="url(#s)"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-20 -10 640 320" width="1280" height="640">
<defs>
<linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0.28"/><stop offset="0.5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="0.3"/></linearGradient>
<filter id="d" x="-20%" y="-20%" width="140%" height="160%"><feDropShadow dx="0" dy="8" stdDeviation="8" flood-color="#000" flood-opacity="0.45"/></filter>
</defs>
<g filter="url(#d)">
${piece(P.tailL)}${opts.black ? `<path d="${P.goldL}" fill="${GOLD}"/>` : ""}
${piece(P.tailR)}${opts.black ? `<path d="${P.goldR}" fill="${GOLD}"/>` : ""}
${piece(P.band)}<path d="${P.bandStitch}" stroke="${stitch}" stroke-width="2" stroke-dasharray="7 6" fill="none"/>
${piece(P.knot)}<path d="${P.knotStitch}" stroke="${stitch}" stroke-width="2" fill="none"/>
</g></svg>`;
}

export function svgDataUrl(svg: string) {
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

const withAlpha = (hex: string, a: number) =>
  hex.length === 7 ? hex + Math.round(a * 255).toString(16).padStart(2, "0") : hex;

export type CardInfo = {
  beltName: string;
  beltColor: string;
  beltIndex: number; // 0 = first
  allBelts: { name: string; color: string }[];
  line: string; // e.g. "Silent Step mastered at 90 BPM"
  photo: HTMLCanvasElement | null; // square, already mirrored
  /** their Day 1 photo, shown next to today's when there is one */
  day1?: HTMLCanvasElement | null;
};

/** Draws the card and returns it as a canvas */
export async function drawBeltCard(info: CardInfo): Promise<HTMLCanvasElement> {
  const c = document.createElement("canvas");
  c.width = CARD_W;
  c.height = CARD_H;
  const ctx = c.getContext("2d")!;
  const isBlack = info.beltIndex === info.allBelts.length - 1;
  const glow = isBlack ? GOLD : info.beltColor;
  const light = info.beltName === "White" || info.beltName === "Silver";
  const cx = CARD_W / 2;
  const cy = info.photo ? 430 : 470;

  // Background: dark, lit in the belt's colour, with light rays
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, 950);
  bg.addColorStop(0, withAlpha(glow, 0.45));
  bg.addColorStop(0.55, withAlpha(glow, 0.08));
  bg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, CARD_W, CARD_H);
  const rays = ctx.createRadialGradient(cx, cy, 0, cx, cy, 900);
  rays.addColorStop(0, withAlpha(glow, 0.35));
  rays.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = rays;
  for (let a = 0; a < 360; a += 18) {
    const r0 = (a * Math.PI) / 180;
    const r1 = ((a + 6) * Math.PI) / 180;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(r0) * 1600, cy + Math.sin(r0) * 1600);
    ctx.lineTo(cx + Math.cos(r1) * 1600, cy + Math.sin(r1) * 1600);
    ctx.closePath();
    ctx.fill();
  }

  // A sprinkle of confetti (same every time for a given belt)
  let seed = info.beltIndex * 9301 + 49297;
  const rand = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  const confetti = isBlack ? [GOLD, "#FFFFFF", "#FFE9A8"] : [info.beltColor, GOLD, "#FFFFFF", "#CC1010"];
  for (let i = 0; i < 70; i++) {
    const x = rand() * CARD_W;
    const y = rand() * CARD_H;
    if (Math.abs(x - cx) < 360 && y > 60 && y < 1000) continue; // keep the middle clear
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rand() * Math.PI);
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = confetti[Math.floor(rand() * confetti.length)];
    ctx.fillRect(-8, -4, 16, 8);
    ctx.restore();
  }

  // The photo, framed in the belt's colour and gold
  const belt = await loadImage(svgDataUrl(beltSvg(info.beltColor, { light, black: isBlack })));
  if (info.photo && info.day1) {
    // Day 1 and Today side by side, the belt tying them together
    const s = 440, y = 225, r = 40;
    const spots = [
      { x: cx - 20 - s, img: info.day1, label: "DAY 1", fade: true },
      { x: cx + 20, img: info.photo, label: "TODAY", fade: false },
    ];
    for (const p of spots) {
      ctx.save();
      ctx.shadowColor = withAlpha(glow, 0.7);
      ctx.shadowBlur = 40;
      roundRect(ctx, p.x - 11, y - 11, s + 22, s + 22, r + 9);
      ctx.fillStyle = GOLD;
      ctx.fill();
      ctx.restore();
      roundRect(ctx, p.x - 5, y - 5, s + 10, s + 10, r + 4);
      ctx.fillStyle = info.beltColor;
      ctx.fill();
      ctx.save();
      roundRect(ctx, p.x, y, s, s, r);
      ctx.clip();
      if (p.fade) ctx.filter = "grayscale(0.7) contrast(0.95)";
      ctx.drawImage(p.img, p.x, y, s, s);
      ctx.restore();
      ctx.filter = "none";
      (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "10px";
      ctx.textAlign = "center";
      ctx.fillStyle = p.fade ? "rgba(255,255,255,0.7)" : GOLD;
      ctx.font = 'bold 30px Arial, "Helvetica Neue", Helvetica, sans-serif';
      ctx.fillText(p.label, p.x + s / 2 + 5, y - 32);
    }
    (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = "0px";
    ctx.drawImage(belt, cx - 495, 460, 990, 495);
  } else if (info.photo) {
    const s = 640, x = cx - s / 2, y = 110, r = 56;
    ctx.save();
    ctx.shadowColor = withAlpha(glow, 0.8);
    ctx.shadowBlur = 60;
    roundRect(ctx, x - 14, y - 14, s + 28, s + 28, r + 12);
    ctx.fillStyle = GOLD;
    ctx.fill();
    ctx.restore();
    roundRect(ctx, x - 7, y - 7, s + 14, s + 14, r + 6);
    ctx.fillStyle = info.beltColor;
    ctx.fill();
    ctx.save();
    roundRect(ctx, x, y, s, s, r);
    ctx.clip();
    ctx.drawImage(info.photo, x, y, s, s);
    ctx.restore();
    // the belt worn across the lower part of the photo
    ctx.drawImage(belt, cx - 495, 520, 990, 495);
  } else {
    ctx.drawImage(belt, cx - 520, 190, 1040, 520);
  }

  // Words
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const spaced = (px: number) => {
    (ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${px}px`;
  };
  const font = 'Arial, "Helvetica Neue", Helvetica, sans-serif';

  spaced(14);
  ctx.fillStyle = GOLD;
  ctx.font = `bold 30px ${font}`;
  ctx.fillText(isBlack ? "MASTERY" : "BELT EARNED", cx + 7, 1040);

  spaced(-3);
  ctx.fillStyle = "#FFFFFF";
  ctx.shadowColor = withAlpha(glow, 0.9);
  ctx.shadowBlur = 40;
  let size = 124;
  ctx.font = `900 ${size}px ${font}`;
  const title = `${info.beltName} Belt`;
  while (ctx.measureText(title).width > CARD_W - 120 && size > 60) {
    size -= 4;
    ctx.font = `900 ${size}px ${font}`;
  }
  ctx.fillText(title, cx, 1150);
  ctx.shadowBlur = 0;

  spaced(0);
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  let lineSize = 34;
  ctx.font = `${lineSize}px ${font}`;
  while (ctx.measureText(info.line).width > CARD_W - 100 && lineSize > 22) {
    lineSize -= 2;
    ctx.font = `${lineSize}px ${font}`;
  }
  ctx.fillText(info.line, cx, 1208);

  // The 12-belt count
  const n = info.allBelts.length, w = 52, gap = 12, h = 14;
  const startX = cx - (n * w + (n - 1) * gap) / 2;
  info.allBelts.forEach((b, i) => {
    const x = startX + i * (w + gap);
    roundRect(ctx, x, 1244, w, h, h / 2);
    ctx.fillStyle = i <= info.beltIndex ? b.color : "rgba(255,255,255,0.14)";
    ctx.fill();
    if (i === info.beltIndex) {
      ctx.lineWidth = 4;
      ctx.strokeStyle = GOLD;
      roundRect(ctx, x - 4, 1240, w + 8, h + 8, (h + 8) / 2);
      ctx.stroke();
    }
  });

  // Brand
  spaced(12);
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = `28px ${font}`;
  // the website once it's set (lib/brand.ts), otherwise the name; plus your
  // Instagram handle so people know who to tag
  const name = BRAND.website ? BRAND.website.toUpperCase() : BRAND.name.toUpperCase();
  const handle = BRAND.instagram ? (BRAND.instagram.startsWith("@") ? BRAND.instagram : "@" + BRAND.instagram) : "";
  if (!handle) {
    ctx.fillText(name, cx + 6, 1316);
  } else {
    // name (spaced out) · @handle (normal spacing, so it's easy to read)
    ctx.textAlign = "left";
    const nameW = ctx.measureText(name).width;
    spaced(0);
    ctx.font = `bold 30px ${font}`;
    const handleW = ctx.measureText(handle).width;
    const gap = 46;
    const x0 = cx - (nameW + gap + handleW) / 2;
    spaced(12);
    ctx.font = `28px ${font}`;
    ctx.fillText(name, x0, 1316);
    spaced(0);
    ctx.fillText("·", x0 + nameW + gap / 2 - 5, 1316);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = `bold 30px ${font}`;
    ctx.fillText(handle, x0 + nameW + gap, 1316);
    ctx.textAlign = "center";
  }
  spaced(0);

  return c;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Square-crop a video frame or picture, mirrored like a selfie */
export function squareFrom(source: HTMLVideoElement | HTMLImageElement, mirror: boolean): HTMLCanvasElement {
  const sw = source instanceof HTMLVideoElement ? source.videoWidth : source.naturalWidth;
  const sh = source instanceof HTMLVideoElement ? source.videoHeight : source.naturalHeight;
  const side = Math.min(sw, sh);
  const c = document.createElement("canvas");
  c.width = c.height = 900;
  const ctx = c.getContext("2d")!;
  if (mirror) {
    ctx.translate(900, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(source, (sw - side) / 2, (sh - side) / 2, side, side, 0, 0, 900, 900);
  return c;
}
