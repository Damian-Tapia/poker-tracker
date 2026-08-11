/**
 * Generates PWA icons using only node:zlib and node:fs.
 * Draws a poker chip: brass ring, felt-green center, spade symbol.
 * Targets: icon-192, icon-512, icon-maskable-512, apple-touch-icon-180.
 */

import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, '..', 'public', 'icons');

mkdirSync(OUT, { recursive: true });

// Colors (RGBA)
const INK = [12, 13, 11, 255];
const FELT = [10, 46, 34, 255];
const BRASS = [184, 137, 42, 255];
const IVORY = [240, 234, 214, 255];

function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) {
    c ^= b;
    for (let i = 0; i < 8; i++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crcData = Buffer.concat([typeBytes, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData));
  return Buffer.concat([len, typeBytes, data, crc]);
}

function encodePNG(pixels, size) {
  const IHDR = Buffer.alloc(13);
  IHDR.writeUInt32BE(size, 0);
  IHDR.writeUInt32BE(size, 4);
  IHDR[8] = 8;   // bit depth
  IHDR[9] = 2;   // color type: RGB (we'll encode as RGBA via filter)
  // Use color type 6 (RGBA)
  IHDR[9] = 6;

  const raw = [];
  for (let y = 0; y < size; y++) {
    raw.push(0); // filter byte: None
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixels[y * size + x];
      raw.push(r, g, b, a);
    }
  }

  const rawBuf = Buffer.from(raw);
  const compressed = deflateSync(rawBuf, { level: 9 });

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
    chunk('IHDR', IHDR),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function dist(x1, y1, x2, y2) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

function lerp4(a, b, t) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t));
}

function drawChip(size, safePad = 0) {
  const pixels = new Array(size * size).fill(null).map(() => [...INK]);
  const cx = size / 2;
  const cy = size / 2;
  const safe = size * safePad;
  const r = (size / 2 - safe) * 0.95;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const d = dist(x + 0.5, y + 0.5, cx, cy);
      const idx = y * size + x;

      // outer ring (brass)
      if (d < r) {
        pixels[idx] = [...BRASS];
      }
      // inner felt circle
      if (d < r * 0.75) {
        pixels[idx] = [...FELT];
      }
      // dotted rim pattern (8 brass dashes around the ring)
      if (d >= r * 0.76 && d < r * 0.92) {
        const angle = Math.atan2(y + 0.5 - cy, x + 0.5 - cx);
        const seg = ((angle / Math.PI + 1) * 4) % 8;
        if (seg < 4.5) pixels[idx] = [...BRASS];
      }

      // Anti-alias outer edge
      if (d >= r - 1 && d < r + 1) {
        const t = Math.max(0, Math.min(1, (r + 1 - d) / 2));
        pixels[idx] = lerp4([...INK], pixels[idx], t);
      }
    }
  }

  // Draw spade symbol in the center
  const sp = r * 0.35;
  const spCx = cx;
  const spCy = cy - sp * 0.1;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (x + 0.5 - spCx) / sp;
      const dy = (y + 0.5 - spCy) / sp;
      const idx = y * size + x;

      // Spade: two circles (left lobe, right lobe) + top point triangle
      const dLeft = dist(dx, dy, -0.35, 0.2);
      const dRight = dist(dx, dy, 0.35, 0.2);
      const dTop = dist(dx, dy, 0, -0.55);

      // Stem
      const stemX = Math.abs(dx) < 0.12;
      const stemY = dy >= 0.6 && dy < 1.1;
      const stemFlare = Math.abs(dx) < 0.35 + (dy - 0.9) * 0.5 && dy >= 0.85 && dy < 1.1;

      if (dLeft < 0.5 || dRight < 0.5 || dTop < 0.55 || (stemX && stemY) || stemFlare) {
        if (pixels[idx][0] !== INK[0] || pixels[idx][1] !== INK[1]) {
          pixels[idx] = [...IVORY];
        }
      }
    }
  }

  return pixels;
}

const TARGETS = [
  { name: 'icon-192.png', size: 192, pad: 0 },
  { name: 'icon-512.png', size: 512, pad: 0 },
  { name: 'icon-maskable-512.png', size: 512, pad: 0.18 },
  { name: 'apple-touch-icon-180.png', size: 180, pad: 0 },
];

for (const { name, size, pad } of TARGETS) {
  const pixels = drawChip(size, pad);
  const png = encodePNG(pixels, size);
  writeFileSync(join(OUT, name), png);
  console.log(`Generated ${name} (${size}×${size})`);
}
