// Generates the PWA PNG icons with zero external dependencies.
//
// We hand-encode valid PNGs (signature + IHDR + IDAT + IEND) using Node's
// built-in zlib. The icon is the Bill Split "B" mark: a brand-blue rounded
// square with a white "B" rendered from a small bitmap font. This keeps the
// repo install-free for icon generation while producing real, installable
// PNG assets.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");
mkdirSync(OUT_DIR, { recursive: true });

const BRAND = [37, 99, 235]; // #2563eb
const WHITE = [255, 255, 255];

// CRC32 table for PNG chunk checksums.
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

// Bitmap "B" glyph on a 5x7 grid (1 = white pixel).
const GLYPH_B = [
  [1, 1, 1, 1, 0],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 1, 1, 1, 0],
  [1, 0, 0, 0, 1],
  [1, 0, 0, 0, 1],
  [1, 1, 1, 1, 0],
];

function drawIcon(size, maskable) {
  // raw RGBA buffer
  const px = Buffer.alloc(size * size * 4);
  const radius = maskable ? size : Math.floor(size * 0.22); // maskable = full bleed
  const cx = size / 2;
  const cy = size / 2;

  const inRounded = (x, y) => {
    if (maskable) return true;
    const dx = Math.max(radius - x, x - (size - radius), 0);
    const dy = Math.max(radius - y, y - (size - radius), 0);
    return dx * dx + dy * dy <= radius * radius;
  };

  // Glyph placement (centered, ~52% of icon height).
  const gh = Math.floor(size * 0.52);
  const cellH = gh / 7;
  const gw = cellH * 5;
  const gx0 = cx - gw / 2;
  const gy0 = cy - gh / 2;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      let color = inRounded(x, y) ? BRAND : null;
      if (color) {
        const col = Math.floor((x - gx0) / cellH);
        const row = Math.floor((y - gy0) / cellH);
        if (
          row >= 0 &&
          row < 7 &&
          col >= 0 &&
          col < 5 &&
          GLYPH_B[row][col] === 1
        ) {
          color = WHITE;
        }
        px[i] = color[0];
        px[i + 1] = color[1];
        px[i + 2] = color[2];
        px[i + 3] = 255;
      } else {
        px[i + 3] = 0; // transparent corners
      }
    }
  }

  // Add the PNG filter byte (0 = none) at the start of each scanline.
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    px.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  // [10..12] compression/filter/interlace default 0

  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

const targets = [
  { name: "icon-192.png", size: 192, maskable: false },
  { name: "icon-512.png", size: 512, maskable: false },
  { name: "icon-maskable-512.png", size: 512, maskable: true },
  { name: "apple-touch-icon.png", size: 180, maskable: true },
];

for (const t of targets) {
  writeFileSync(join(OUT_DIR, t.name), drawIcon(t.size, t.maskable));
  console.log(`✓ ${t.name} (${t.size}x${t.size})`);
}
console.log("Icons written to public/icons");
