/**
 * Generates TileHub Pro launcher icons for all Android densities.
 * Uses only Node.js built-ins — no extra npm packages required.
 * Run: node generate-icon.js
 */
const fs = require('fs');
const path = require('path');

// Minimal PNG encoder — writes a solid-color PNG with text approximation via filled rects
function writePNG(filePath, size) {
  // We'll build the icon as raw RGBA pixel data then encode to PNG manually
  const pixels = new Uint8Array(size * size * 4);

  // Background: deep blue-teal gradient simulation (flat colour #1B4F72)
  const bgR = 27, bgG = 79, bgB = 114;

  for (let i = 0; i < size * size; i++) {
    pixels[i * 4]     = bgR;
    pixels[i * 4 + 1] = bgG;
    pixels[i * 4 + 2] = bgB;
    pixels[i * 4 + 3] = 255;
  }

  // Draw a white rounded square tile (tile motif) — top-left tile
  const tileSize  = Math.round(size * 0.28);
  const gap       = Math.round(size * 0.04);
  const startX    = Math.round(size * 0.18);
  const startY    = Math.round(size * 0.18);
  const radius    = Math.round(tileSize * 0.15);

  function drawRoundedRect(x, y, w, h, r, R, G, B, A) {
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) {
        if (px < 0 || py < 0 || px >= size || py >= size) continue;
        // Simple corner rounding check
        const inCorner =
          (px - x < r && py - y < r && Math.hypot(px - x - r, py - y - r) > r) ||
          (px - x >= w - r && py - y < r && Math.hypot(px - x - (w - r), py - y - r) > r) ||
          (px - x < r && py - y >= h - r && Math.hypot(px - x - r, py - y - (h - r)) > r) ||
          (px - x >= w - r && py - y >= h - r && Math.hypot(px - x - (w - r), py - y - (h - r)) > r);
        if (!inCorner) {
          const idx = (py * size + px) * 4;
          pixels[idx]     = R;
          pixels[idx + 1] = G;
          pixels[idx + 2] = B;
          pixels[idx + 3] = A;
        }
      }
    }
  }

  // 4 tiles in a 2×2 grid (top-left quadrant)
  const tileColors = [
    [255, 255, 255], // white
    [200, 230, 255], // light blue
    [200, 230, 255], // light blue
    [255, 255, 255], // white
  ];
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 2; col++) {
      const [R, G, B] = tileColors[row * 2 + col];
      drawRoundedRect(
        startX + col * (tileSize + gap),
        startY + row * (tileSize + gap),
        tileSize, tileSize, radius,
        R, G, B, 255
      );
    }
  }

  // Bottom band: white bar for "TH" text suggestion
  const barH  = Math.round(size * 0.22);
  const barY  = Math.round(size * 0.68);
  const barX  = Math.round(size * 0.12);
  const barW  = Math.round(size * 0.76);
  drawRoundedRect(barX, barY, barW, barH, Math.round(barH * 0.25), 255, 255, 255, 240);

  // Pixel-font "TH" in the white bar (each letter is a small grid of dark pixels)
  function drawPixelChar(charMap, offX, offY, scale, R, G, B) {
    charMap.forEach((row, ry) => {
      for (let cx = 0; cx < row.length; cx++) {
        if (row[cx]) {
          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) {
              const px = offX + cx * scale + sx;
              const py = offY + ry * scale + sy;
              if (px >= 0 && py >= 0 && px < size && py < size) {
                const idx = (py * size + px) * 4;
                pixels[idx] = R; pixels[idx+1] = G; pixels[idx+2] = B; pixels[idx+3] = 255;
              }
            }
          }
        }
      }
    });
  }

  const letterT = [
    [1,1,1,1,1],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
    [0,0,1,0,0],
  ];
  const letterH = [
    [1,0,0,0,1],
    [1,0,0,0,1],
    [1,1,1,1,1],
    [1,0,0,0,1],
    [1,0,0,0,1],
  ];

  const scale   = Math.max(1, Math.round(size / 48));
  const textW   = 5 * scale;
  const spacing = Math.round(scale * 1.5);
  const totalW  = textW * 2 + spacing;
  const textX   = Math.round((size - totalW) / 2);
  const textY   = barY + Math.round((barH - 5 * scale) / 2);

  drawPixelChar(letterT, textX,             textY, scale, bgR, bgG, bgB);
  drawPixelChar(letterH, textX + textW + spacing, textY, scale, bgR, bgG, bgB);

  // Encode to PNG
  encodePNG(filePath, pixels, size);
}

function encodePNG(filePath, pixels, size) {
  const zlib = require('zlib');

  function adler32(data) {
    let s1 = 1, s2 = 0;
    for (const b of data) { s1 = (s1 + b) % 65521; s2 = (s2 + s1) % 65521; }
    return (s2 << 16) | s1;
  }

  function crc32(data) {
    const table = crc32.table || (() => {
      const t = new Uint32Array(256);
      for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        t[i] = c;
      }
      return (crc32.table = t);
    })();
    let crc = 0xffffffff;
    for (const b of data) crc = table[(crc ^ b) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  function u32be(n) {
    return Buffer.from([n>>>24&255, n>>>16&255, n>>>8&255, n&255]);
  }

  function chunk(type, data) {
    const typeBytes = Buffer.from(type, 'ascii');
    const len = u32be(data.length);
    const crcVal = crc32(Buffer.concat([typeBytes, data]));
    return Buffer.concat([len, typeBytes, data, u32be(crcVal)]);
  }

  // PNG signature
  const sig = Buffer.from([137,80,78,71,13,10,26,10]);

  // IHDR
  const ihdr = Buffer.concat([u32be(size), u32be(size), Buffer.from([8,2,0,0,0])]);
  const ihdrChunk = chunk('IHDR', ihdr);

  // Raw image data: filter byte (0) + RGB per row (drop alpha for smaller file)
  const raw = Buffer.alloc(size * (1 + size * 3));
  for (let y = 0; y < size; y++) {
    raw[y * (1 + size * 3)] = 0; // filter type none
    for (let x = 0; x < size; x++) {
      const src = (y * size + x) * 4;
      const dst = y * (1 + size * 3) + 1 + x * 3;
      raw[dst]   = pixels[src];
      raw[dst+1] = pixels[src+1];
      raw[dst+2] = pixels[src+2];
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 6 });
  const idatChunk  = chunk('IDAT', compressed);
  const iendChunk  = chunk('IEND', Buffer.alloc(0));

  fs.writeFileSync(filePath, Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]));
}

// Android mipmap sizes
const densities = {
  'mipmap-mdpi':    48,
  'mipmap-hdpi':    72,
  'mipmap-xhdpi':   96,
  'mipmap-xxhdpi':  144,
  'mipmap-xxxhdpi': 192,
};

const resDir = path.join(__dirname, 'android', 'app', 'src', 'main', 'res');

for (const [folder, size] of Object.entries(densities)) {
  const dir = path.join(resDir, folder);
  writePNG(path.join(dir, 'ic_launcher.png'), size);
  writePNG(path.join(dir, 'ic_launcher_round.png'), size);
  console.log(`✓ ${folder} (${size}x${size})`);
}

console.log('\nAll icons generated. Ready to build!');
