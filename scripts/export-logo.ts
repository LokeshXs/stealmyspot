/**
 * Rasterises the logo mark to PNG for places that can't take SVG — the Dodo
 * Payments checkout branding slot, app stores, press kits.
 *
 *   pnpm tsx scripts/export-logo.ts
 *
 * Geometry comes from `LOGO_PATHS`, the same constant the app icon and the
 * social card use, so an exported PNG can never drift from the live mark.
 * Re-run this after any change to the mark.
 */
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { LOGO_PATHS } from "../src/components/icons";

const OUT_DIR = path.join(process.cwd(), "public");
const SIZE = 1024;

/** Matches the app tokens so the exports are the same violet as the site. */
const VIOLET_LIGHT = "#6d5cf6"; // --primary, light theme
const VIOLET_DARK = "#8b7bff"; // --primary, dark theme
const INK = "#17171f"; // --foreground, light theme
const PAPER = "#f4f4f7"; // --foreground, dark theme
const TILE = "#0e0e13"; // --background, dark theme

/**
 * The mark spans x 5→27, y 3→29 of a 32-unit grid. Standalone it needs air
 * around it, so the artwork is inset into a larger canvas rather than bleeding
 * to the edge the way the favicon does.
 */
function markSvg({
  riser,
  faller,
  fallerOpacity,
  background,
  cornerRadius,
}: {
  riser: string;
  faller: string;
  fallerOpacity: number;
  background?: string;
  cornerRadius?: number;
}) {
  const pad = 6; // 32-unit grid → 44-unit canvas, ~14% padding each side
  const canvas = 32 + pad * 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvas} ${canvas}" width="${SIZE}" height="${SIZE}">
  ${
    background
      ? `<rect width="${canvas}" height="${canvas}" rx="${cornerRadius ?? 0}" fill="${background}"/>`
      : ""
  }
  <g transform="translate(${pad} ${pad})">
    <path d="${LOGO_PATHS.up}" fill="${riser}"/>
    <path d="${LOGO_PATHS.down}" fill="${faller}" opacity="${fallerOpacity}"/>
  </g>
</svg>`;
}

const VARIANTS = [
  {
    file: "logo-mark.png",
    note: "transparent · for light backgrounds",
    svg: markSvg({ riser: VIOLET_LIGHT, faller: INK, fallerOpacity: 0.35 }),
  },
  {
    file: "logo-mark-on-dark.png",
    note: "transparent · for dark backgrounds",
    svg: markSvg({ riser: VIOLET_DARK, faller: PAPER, fallerOpacity: 0.4 }),
  },
  {
    file: "logo-icon.png",
    note: "solid dark tile · square avatar slots",
    svg: markSvg({
      riser: VIOLET_DARK,
      faller: PAPER,
      fallerOpacity: 0.4,
      background: TILE,
      cornerRadius: 8,
    }),
  },
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  for (const variant of VARIANTS) {
    const png = await sharp(Buffer.from(variant.svg)).png({ compressionLevel: 9 }).toBuffer();
    await writeFile(path.join(OUT_DIR, variant.file), png);
    const { width, height } = await sharp(png).metadata();
    console.log(`public/${variant.file.padEnd(22)} ${width}×${height}  ${variant.note}`);
  }
}

void main();
