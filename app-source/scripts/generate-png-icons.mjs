import fs from 'fs';
import zlib from 'zlib';

function createPng(width, height, r, g, b, innerR, innerG, innerB) {
  // Simple uncompressed or deflate-compressed raw truecolor PNG generator
  function crc32(buf) {
    let table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c;
    }
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
  }

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(4 + 4 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4);
    data.copy(buf, 8);
    const crcBuf = Buffer.alloc(4 + len);
    crcBuf.write(type, 0);
    data.copy(crcBuf, 4);
    const crc = crc32(crcBuf);
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bits per channel
  ihdr[9] = 2; // RGB
  ihdr[10] = 0; // Deflate
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Scanlines: width * 3 bytes + 1 filter byte per line
  const rawData = Buffer.alloc((width * 3 + 1) * height);
  let pos = 0;
  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.42;

  for (let y = 0; y < height; y++) {
    rawData[pos++] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Icon drawing: warm chocolate background (#3D2314), with gold cupcake motif
      if (dist < radius * 0.72) {
        // Frosting & cup area
        const isCup = dy > radius * 0.1 && Math.abs(dx) < radius * (0.5 - dy * 0.002);
        const isCherry = Math.sqrt(dx * dx + (dy + radius * 0.5) * (dy + radius * 0.5)) < radius * 0.14;
        const isFrosting = !isCup && !isCherry && dist < radius * 0.58;

        if (isCherry) {
          rawData[pos++] = 229; // Gold star / cherry
          rawData[pos++] = 178;
          rawData[pos++] = 93;
        } else if (isCup) {
          rawData[pos++] = 200; // Warm gold/caramel cup
          rawData[pos++] = 150;
          rawData[pos++] = 75;
        } else if (isFrosting) {
          rawData[pos++] = 255; // Cream frosting
          rawData[pos++] = 248;
          rawData[pos++] = 240;
        } else {
          rawData[pos++] = innerR;
          rawData[pos++] = innerG;
          rawData[pos++] = innerB;
        }
      } else if (dist < radius) {
        // Gold border ring
        rawData[pos++] = 229;
        rawData[pos++] = 178;
        rawData[pos++] = 93;
      } else {
        // Base chocolate background
        rawData[pos++] = r;
        rawData[pos++] = g;
        rawData[pos++] = b;
      }
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

// Generate icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png
const png192 = createPng(192, 192, 61, 35, 20, 74, 40, 24);
const png512 = createPng(512, 512, 61, 35, 20, 74, 40, 24);
const pngApple = createPng(180, 180, 61, 35, 20, 74, 40, 24);

fs.writeFileSync('public/icon-192.png', png192);
fs.writeFileSync('public/icon-512.png', png512);
fs.writeFileSync('public/icon-maskable-512.png', png512);
fs.writeFileSync('public/apple-touch-icon.png', pngApple);

console.log('PWA PNG icons generated successfully!');
