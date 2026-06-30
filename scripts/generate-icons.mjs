// Generates the PWA PNG icons with zero external dependencies.
//
// We hand-encode valid PNGs (signature + IHDR + IDAT + IEND) using Node's
// built-in zlib. The mark is the BILL SPILT motif: a knocked-over mason jar
// with gold coins pouring out onto a brand-blue rounded square — a visual pun
// on "spilt". Shapes are drawn from signed-distance fields with 3x3
// supersampling for clean edges, so the repo stays install-free while
// producing real PNG assets.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");
mkdirSync(OUT_DIR, { recursive: true });

// Palette.
const BG_TOP = [59, 130, 246]; // #3b82f6
const BG_BOT = [29, 78, 216]; // #1d4ed8
const GLASS = [244, 248, 253]; // jar glass (near-white, faint cool tint)
const GLASS_HI = [255, 255, 255]; // sheen highlight
const GLASS_IN = [206, 219, 235]; // shaded jar interior / mouth
const NECK = [148, 163, 184]; // thread/rim detail (slate)
const COIN = [245, 197, 24]; // #f5c518 gold
const COIN_EDGE = [194, 134, 8]; // darker gold ring detail
const RIM = [255, 255, 255]; // coin rim
const INK = [29, 78, 216]; // $ on the lead coin (brand blue)

// "$" centreline as a polyline (units = fraction of coin radius, y down) — an
// S-curve drawn as smooth strokes, with a vertical bar overlaid.
const DOLLAR_PTS = [
  [0.34, -0.3],
  [0.06, -0.42],
  [-0.26, -0.3],
  [-0.3, -0.07],
  [-0.05, 0.03],
  [0.05, 0.03],
  [0.3, 0.13],
  [0.26, 0.36],
  [-0.06, 0.46],
  [-0.34, 0.34],
];

// Distance from point p to segment a-b.
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
}

const lerp = (a, b, t) => a + (b - a) * t;
const mix = (c1, c2, t) => [
  lerp(c1[0], c2[0], t),
  lerp(c1[1], c2[1], t),
  lerp(c1[2], c2[2], t),
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
  return Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r;
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
  const U = size;
  const radius = Math.floor(size * 0.22);

  // Knocked-over mason jar, axis tilted so the mouth pours to the lower-right.
  const jar = {
    cx: 0.36 * U,
    cy: 0.36 * U,
    ang: 0.52, // ~30°
    bodyHalf: 0.18 * U, // half-length along the axis
    bodyR: 0.135 * U, // half-height (glass radius)
    corner: 0.06 * U,
    mouthU: 0.18 * U, // +u face = the open mouth
    threads: [0.085 * U, 0.115 * U, 0.145 * U], // neck rings near the mouth
  };

  // Coins pouring along a diagonal from the jar mouth toward the corner.
  const start = [0.52 * U, 0.49 * U];
  const end = [0.84 * U, 0.84 * U];
  const coins = [
    { t: 0.92, r: 0.055 * U },
    { t: 0.66, r: 0.085 * U },
    { t: 0.38, r: 0.112 * U },
    { t: 0.06, r: 0.138 * U, dollar: true },
  ].map((c) => ({
    x: lerp(start[0], end[0], c.t),
    y: lerp(start[1], end[1], c.t),
    r: c.r,
    dollar: c.dollar,
  }));

  // Is point (x,y) on the "$" stamp of coin c?
  function dollarInk(x, y, c) {
    const lx = (x - c.x) / c.r;
    const ly = (y - c.y) / c.r;
    if (Math.abs(lx) < 0.075 && Math.abs(ly) < 0.52) return true; // vertical bar
    for (let i = 0; i < DOLLAR_PTS.length - 1; i++) {
      const [ax, ay] = DOLLAR_PTS[i];
      const [bx, by] = DOLLAR_PTS[i + 1];
      if (segDist(lx, ly, ax, ay, bx, by) < 0.12) return true;
    }
    return false;
  }

  const inRounded = (x, y) => {
    if (maskable) return true;
    const dx = Math.max(radius - x, x - (size - radius), 0);
    const dy = Math.max(radius - y, y - (size - radius), 0);
    return dx * dx + dy * dy <= radius * radius;
  };

  function sampleAt(x, y) {
    if (!inRounded(x, y)) return null;
    let color = mix(BG_TOP, BG_BOT, y / size);

    // Mason jar (drawn first; coins pour over the mouth).
    const rp = rot(x, y, jar.cx, jar.cy, -jar.ang);
    const u = rp[0] - jar.cx; // along axis (+ = toward mouth)
    const v = rp[1] - jar.cy; // perpendicular
    if (sdRoundRect(u, v, 0, 0, jar.bodyHalf, jar.bodyR, jar.corner) < 0) {
      color = GLASS;
      // Sheen highlight along the upper-back of the glass.
      if (v < -jar.bodyR * 0.4 && u < jar.bodyHalf * 0.35) color = GLASS_HI;
      // Shaded open interior near the mouth end.
      if (u > jar.bodyHalf - 0.085 * U) color = GLASS_IN;
      // Neck threads near the mouth.
      for (const tu of jar.threads) {
        if (Math.abs(u - (jar.bodyHalf - tu)) < 0.012 * U && Math.abs(v) < jar.bodyR * 0.92) {
          color = NECK;
        }
      }
    }

    // Coins, back-to-front (largest, nearest the mouth, ends up on top).
    for (const c of coins) {
      const cd = Math.hypot(x - c.x, y - c.y);
      if (cd <= c.r) {
        if (cd > c.r - 0.02 * U) {
          color = RIM;
        } else if (c.dollar) {
          // Lead coin: gold face stamped with a clean $.
          color = dollarInk(x, y, c) ? INK : COIN;
        } else if (Math.abs(cd - c.r * 0.62) < 0.013 * U) {
          color = COIN_EDGE;
        } else {
          color = COIN;
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
      let cov = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const c = sampleAt(x + (sx + 0.5) / SS, y + (sy + 0.5) / SS);
          if (c) {
            r += c[0];
            g += c[1];
            b += c[2];
            cov += 1;
          }
        }
      }
      const i = (y * size + x) * 4;
      px[i] = cov ? Math.round(r / cov) : 0;
      px[i + 1] = cov ? Math.round(g / cov) : 0;
      px[i + 2] = cov ? Math.round(b / cov) : 0;
      px[i + 3] = Math.round((cov / (SS * SS)) * 255);
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
