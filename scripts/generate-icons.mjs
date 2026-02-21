/**
 * Generates PWA icon PNGs from scratch using pure Node.js.
 * Run: node scripts/generate-icons.mjs
 */

import { writeFileSync, mkdirSync } from 'fs';
import { deflateSync } from 'zlib';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dir = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dir, '../public/icons');

// CRC32 table
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (const b of buf) crc = CRC_TABLE[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const tb = Buffer.from(type, 'ascii');
  const lb = Buffer.alloc(4);
  lb.writeUInt32BE(data.length);
  const cb = Buffer.alloc(4);
  cb.writeUInt32BE(crc32(Buffer.concat([tb, data])));
  return Buffer.concat([lb, tb, data, cb]);
}

function setPixel(pixels, size, x, y, r, g, b) {
  if (x < 0 || x >= size || y < 0 || y >= size) return;
  const i = (Math.round(y) * size + Math.round(x)) * 3;
  pixels[i] = r;
  pixels[i + 1] = g;
  pixels[i + 2] = b;
}

function lerp(a, b, t) { return a + (b - a) * t; }

function drawLine(pixels, size, x1, y1, x2, y2, r, g, b, thickness = 1) {
  const dx = x2 - x1, dy = y2 - y1;
  const steps = Math.max(Math.abs(dx), Math.abs(dy)) * 2 || 1;
  for (let t = 0; t <= steps; t++) {
    const px = x1 + dx * (t / steps);
    const py = y1 + dy * (t / steps);
    for (let ty = -thickness; ty <= thickness; ty++) {
      for (let tx = -thickness; tx <= thickness; tx++) {
        if (tx * tx + ty * ty <= thickness * thickness + 0.5)
          setPixel(pixels, size, Math.round(px + tx), Math.round(py + ty), r, g, b);
      }
    }
  }
}

function drawIcon(size) {
  const pixels = new Uint8Array(size * size * 3);

  // Background: #0f172a
  const BG = [15, 23, 42];
  // Card bg: #1e293b
  const CARD = [30, 41, 59];
  // Indigo: #6366f1
  const INDIGO = [99, 102, 241];
  // Cyan: #22d3ee
  const CYAN = [34, 211, 238];
  // Axis: #334155
  const AXIS = [51, 65, 85];

  // Fill background
  for (let i = 0; i < size * size; i++) {
    pixels[i * 3] = BG[0];
    pixels[i * 3 + 1] = BG[1];
    pixels[i * 3 + 2] = BG[2];
  }

  const pad = size * 0.15;
  const w = size - pad * 2;
  const chartBottom = size - pad * 1.1;
  const chartTop = pad * 0.8;

  // Bar definitions (relative x, height as fraction of chart area)
  const barDefs = [
    { rx: 0.0,  rh: 0.48 },
    { rx: 0.25, rh: 0.70 },
    { rx: 0.5,  rh: 0.54 },
    { rx: 0.75, rh: 0.88 },
  ];
  const barW = w * 0.17;

  // Draw bars
  for (const { rx, rh } of barDefs) {
    const bx = pad + rx * w;
    const bh = (chartBottom - chartTop) * rh;
    const by = chartBottom - bh;
    for (let y = Math.floor(by); y <= Math.floor(chartBottom); y++) {
      for (let x = Math.floor(bx); x <= Math.floor(bx + barW); x++) {
        // Slight gradient: lighter at top
        const t = (y - by) / bh;
        const r = Math.round(lerp(INDIGO[0] + 30, INDIGO[0], t));
        const g = Math.round(lerp(INDIGO[1] + 30, INDIGO[1], t));
        const b = Math.round(lerp(INDIGO[2] + 30, INDIGO[2], t));
        setPixel(pixels, size, x, y, r, g, b);
      }
    }
  }

  // Trend line points (center of each bar top)
  const points = barDefs.map(({ rx, rh }) => ({
    x: pad + rx * w + barW / 2,
    y: chartBottom - (chartBottom - chartTop) * rh,
  }));

  const th = Math.max(1, Math.round(size / 64));
  for (let i = 0; i < points.length - 1; i++) {
    drawLine(pixels, size, points[i].x, points[i].y, points[i + 1].x, points[i + 1].y, ...CYAN, th);
  }

  // Dots at each point
  const dotR = Math.max(2, Math.round(size / 36));
  for (const { x, y } of points) {
    for (let dy = -dotR; dy <= dotR; dy++) {
      for (let dx = -dotR; dx <= dotR; dx++) {
        if (dx * dx + dy * dy <= dotR * dotR + 0.5)
          setPixel(pixels, size, Math.round(x + dx), Math.round(y + dy), ...CYAN);
      }
    }
  }

  // Axis line
  drawLine(pixels, size, pad, chartBottom + 2, size - pad, chartBottom + 2, ...AXIS, 1);

  return pixels;
}

function generatePng(size) {
  const pixels = drawIcon(size);
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 2;  // color type: RGB

  // Build scanlines (filter byte = 0 + RGB data)
  const raw = Buffer.alloc(size * (1 + size * 3));
  for (let y = 0; y < size; y++) {
    raw[y * (1 + size * 3)] = 0;
    for (let x = 0; x < size; x++) {
      const si = (y * size + x) * 3;
      const di = y * (1 + size * 3) + 1 + x * 3;
      raw[di] = pixels[si];
      raw[di + 1] = pixels[si + 1];
      raw[di + 2] = pixels[si + 2];
    }
  }

  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', deflateSync(raw, { level: 6 })),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(outDir, { recursive: true });
for (const size of [192, 512]) {
  writeFileSync(join(outDir, `icon-${size}.png`), generatePng(size));
  console.log(`✓ Generated public/icons/icon-${size}.png`);
}
console.log('Done!');
