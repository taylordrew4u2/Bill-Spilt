// Generates the PWA PNG icons with zero external dependencies.
//
// We hand-encode valid PNGs (signature + IHDR + IDAT + IEND) using Node's
// built-in zlib. The mark is the BILL SPILT motif: gold coins spilling out of a
// tipped white cup on a brand-blue rounded square — a visual pun on "spilt".
// Shapes are drawn from signed-distance fields with 3x3 supersampling for clean
// edges, so the repo stays install-free while producing real PNG assets.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");
mkdirSync(OUT_DIR, { recursive: true });

// Palette.
const BG_TOP = [59, 130, 246]; // #3b82f6
const BG_BOT = [29, 78, 216]; // #1d4ed8
const WHITE = [255, 255, 255];
const CUP_SHADE = [219, 226, 239]; // soft shadow inside the cup mouth
const COIN = [245, 197, 24]; // #f5c518 gold
const COIN_EDGE = [194, 134, 8]; // darker gold rim detail
const INK = [29, 78, 216]; // $ on the lead coin (brand blue)

const lerp = (a, b, t) => a + (b - a) * t;
const mix = (c1, c2, t) => [
  lerp(c1[0], c2[0], t),
  lerp(c1[1], c2[1], t),
  lerp(c1[2], c2[2], t),
];

// "$" glyph, 7 wide x 11 tall (1 = ink), stroked through a central bar.
const DOLLAR = [
  [0, 0, 0, 1, 0, 0, 0],
  [0, 1, 1, 1, 1, 1, 0],
  [1, 0, 1, 1, 0, 0, 1],
  [1, 0, 1, 1, 0, 0, 0],
  [0, 1, 1, 1, 0, 0, 0],
  [0, 0, 1, 1, 1, 0, 0],
  [0, 0, 0, 1, 1, 1, 0],
  [1, 0, 0, 1, 1, 0, 1],
  [1, 0, 0, 1, 1, 0, 1],
  [0, 1, 1, 1, 1, 1, 0],
  [0, 0, 0, 1, 0, 0, 0],
];

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

// Signed distance to an axis-aligned rounded rectangle.
function sdRoundRect(px, py, cx, cy, hw, hh, r) {
  const qx = Math.abs(px - cx) - (hw - r);
  const qy = Math.abs(py - cy) - (hh - r);
  const ax = Math.max(qx, 0);
  const ay = Math.max(qy, 0);
  return Math.hypot(ax, ay) + Math.min(Math.max(qx, qy), 0) - r;
}

// Rotate (px,py) by `ang` around (cx,cy).
function rot(px, py, cx, cy, ang) {
  const s = Math.sin(ang);
  const c = Math.cos(ang);
  const dx = px - cx;
  const dy = py - cy;
  return [cx + dx * c - dy * s, cy + dx * s + dy * c];
}

function drawIcon(size, maskable) {
  const U = size; // shapes are defined in normalized units * size
  const radius = Math.floor(size * 0.22);

  // Tipped cup: a rounded rectangle rotated so its mouth pours toward the
  // lower-right corner.
  const cup = {
    cx: 0.39 * U,
    cy: 0.37 * U,
    hw: 0.145 * U,
    hh: 0.2 * U,
    r: 0.07 * U,
    ang: 0.78, // ~45° clockwise
    mouthY: -0.2 * U, // local-y of the open rim
  };

  // Coins spilling along a diagonal from the cup mouth to the corner.
  const start = [0.52 * U, 0.46 * U];
  const end = [0.83 * U, 0.83 * U];
  const coins = [
    { t: 0.88, r: 0.06 * U },
    { t: 0.62, r: 0.088 * U },
    { t: 0.34, r: 0.115 * U },
    { t: 0.0, r: 0.142 * U, dollar: true },
  ].map((c) => ({
    x: lerp(start[0], end[0], c.t),
    y: lerp(start[1], end[1], c.t),
    r: c.r,
    dollar: c.dollar,
  }));

  const inRounded = (x, y) => {
    if (maskable) return true;
    const dx = Math.max(radius - x, x - (size - radius), 0);
    const dy = Math.max(radius - y, y - (size - radius), 0);
    return dx * dx + dy * dy <= radius * radius;
  };

  // Colour of a single sample point (alpha 0 or 255).
  function sampleAt(x, y) {
    if (!inRounded(x, y)) return null;
    let color = mix(BG_TOP, BG_BOT, y / size);

    // Cup (drawn first; coins pour over its mouth).
    const [lx, ly] = rot(x, y, cup.cx, cup.cy, -cup.ang);
    const d = sdRoundRect(lx, ly, cup.cx, cup.cy, cup.hw, cup.hh, cup.r);
    if (d < 0) {
      color = WHITE;
      // Hollow rim shading near the open (mouth) end.
      const rimY = cup.cy + cup.mouthY;
      if (ly < rimY + 0.07 * U) color = CUP_SHADE;
    }

    // Coins, back-to-front (lead coin with the $ ends up on top).
    for (const c of coins) {
      const cd = Math.hypot(x - c.x, y - c.y);
      if (cd <= c.r) {
        color = COIN;
        // Rim ring + inner detail ring for a struck-coin look.
        if (cd > c.r - 0.02 * U) color = WHITE;
        else if (Math.abs(cd - c.r * 0.66) < 0.012 * U) color = COIN_EDGE;
        else if (c.dollar) {
          // Stamp a "$" into the lead coin.
          const gh = c.r * 1.5;
          const cell = gh / 11;
          const gw = cell * 7;
          const col = Math.floor((x - (c.x - gw / 2)) / cell);
          const row = Math.floor((y - (c.y - gh / 2)) / cell);
          if (row >= 0 && row < 11 && col >= 0 && col < 7 && DOLLAR[row][col]) {
            color = INK;
          }
        }
      }
    }
    return color;
  }

  // Render with 3x3 supersampling for anti-aliased edges.
  const px = Buffer.alloc(size * size * 4);
  const SS = 3;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const c = sampleAt(x + (sx + 0.5) / SS, y + (sy + 0.5) / SS);
          if (c) {
            r += c[0];
            g += c[1];
            b += c[2];
            a += 255;
          }
        }
      }
      const n = SS * SS;
      const i = (y * size + x) * 4;
      // Average over covered samples so colour stays crisp at edges.
      const cov = a / 255;
      px[i] = cov ? Math.round(r / cov) : 0;
      px[i + 1] = cov ? Math.round(g / cov) : 0;
      px[i + 2] = cov ? Math.round(b / cov) : 0;
      px[i + 3] = Math.round(a / n);
    }
  }

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
