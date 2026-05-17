import { writeFileSync } from 'fs';
import { deflateSync } from 'zlib';

function makeChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      if (crc & 1) {
        crc = (crc >>> 1) ^ 0xedb88320;
      } else {
        crc = crc >>> 1;
      }
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function encodePNG(width, height, pixels) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rawData = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0;
    for (let x = 0; x < width * 4; x++) {
      rawData[y * (1 + width * 4) + 1 + x] = pixels[y * width * 4 + x];
    }
  }

  const compressed = deflateSync(rawData);
  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

function createIcon(size) {
  const pixels = new Uint8Array(size * size * 4);
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.4;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < radius * 0.55) {
        pixels[idx] = 130; pixels[idx + 1] = 202; pixels[idx + 2] = 157; pixels[idx + 3] = 255;
      } else if (dist < radius * 0.7) {
        pixels[idx] = 136; pixels[idx + 1] = 132; pixels[idx + 2] = 216; pixels[idx + 3] = 255;
      } else if (dist < radius) {
        pixels[idx] = 22; pixels[idx + 1] = 33; pixels[idx + 2] = 62; pixels[idx + 3] = 255;
      } else {
        pixels[idx] = 26; pixels[idx + 1] = 26; pixels[idx + 2] = 46; pixels[idx + 3] = 255;
      }
    }
  }

  return encodePNG(size, size, pixels);
}

const icon192 = createIcon(192);
writeFileSync('public/icons/icon-192.png', icon192);
console.log('Created public/icons/icon-192.png');

const icon512 = createIcon(512);
writeFileSync('public/icons/icon-512.png', icon512);
console.log('Created public/icons/icon-512.png');
