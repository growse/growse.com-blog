// Runs after webpack has copied the images into ../assets/img. For every
// PNG/JPEG it writes, next to the original:
//
//   foo.jpg.webp, foo.jpg.avif         picked by nginx from the Accept header
//   foo-480w.jpg (+ .webp, .avif)      narrower copies for srcset, at each of
//   foo-800w.jpg ...                   responsive_image_widths in _config.yml
//                                      that is smaller than the original
//
// A .webp is only kept if it beats the original, and an .avif only if it
// beats whatever it would otherwise fall back to, so nginx never serves a
// bigger file than it would have without them.

import sharp from "sharp";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const blogRoot = path.resolve(here, "..", "..");
const imgRoot = path.join(blogRoot, "assets", "img");

const config = await readFile(path.join(blogRoot, "_config.yml"), "utf8");
const widthsMatch = config.match(/^responsive_image_widths:\s*\[([^\]]*)\]/m);
if (widthsMatch == null) {
  throw new Error("responsive_image_widths is missing from _config.yml");
}
const WIDTHS = widthsMatch[1].split(",").map((w) => Number(w.trim()));

const SOURCE = /\.(png|jpe?g)$/i;

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      yield* walk(full);
    } else if (SOURCE.test(entry.name)) {
      yield full;
    }
  }
}

const totals = { files: 0, webp: 0, avif: 0, resized: 0 };

/** Write .webp and .avif siblings of a PNG/JPEG, if they're smaller. */
async function encodeModern(file, input) {
  let fallback = input.length;
  // rotate() with no arguments applies EXIF orientation, which the output
  // would otherwise lose along with the rest of the metadata.
  const webp = await sharp(input).rotate().webp({ quality: 75 }).toBuffer();
  if (webp.length < fallback) {
    await writeFile(`${file}.webp`, webp);
    fallback = webp.length;
    totals.webp++;
  }
  const avif = await sharp(input)
    .rotate()
    .avif({ quality: 55, effort: 4 })
    .toBuffer();
  if (avif.length < fallback) {
    await writeFile(`${file}.avif`, avif);
    totals.avif++;
  }
}

async function processImage(file) {
  const input = await readFile(file);
  const { width, format } = await sharp(input).metadata();
  totals.files++;
  await encodeModern(file, input);

  const ext = path.extname(file);
  const base = file.slice(0, -ext.length);
  for (const w of WIDTHS) {
    if (width == null || w >= width) {
      continue;
    }
    const resizer = sharp(input).rotate().resize({ width: w });
    const resized =
      format === "png"
        ? await resizer.png({ compressionLevel: 9 }).toBuffer()
        : await resizer.jpeg({ quality: 82, mozjpeg: true }).toBuffer();
    const out = `${base}-${w}w${ext}`;
    await writeFile(out, resized);
    totals.resized++;
    await encodeModern(out, resized);
  }
}

const files = [];
for await (const file of walk(imgRoot)) {
  files.push(file);
}
// Each sharp pipeline is already multi-threaded; a few at a time is plenty.
const queue = [...files];
await Promise.all(
  Array.from({ length: 4 }, async () => {
    for (let f = queue.shift(); f != null; f = queue.shift()) {
      await processImage(f);
    }
  }),
);
console.log(
  `images: ${totals.files} originals, ${totals.resized} resized copies, ` +
    `${totals.webp} webp, ${totals.avif} avif`,
);
