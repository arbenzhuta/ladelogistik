import sharp from 'sharp';
import { writeFileSync } from 'fs';

const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#1e3a5f"/>
  <g transform="translate(56, 100)">
    <!-- Truck body -->
    <rect x="0" y="60" width="260" height="160" rx="12" fill="#4a90d9"/>
    <!-- Truck cabin -->
    <rect x="260" y="100" width="100" height="120" rx="12" fill="#3b7dd8"/>
    <!-- Windshield -->
    <rect x="275" y="110" width="70" height="50" rx="8" fill="#a8d4ff"/>
    <!-- Cargo lines -->
    <rect x="20" y="80" width="220" height="8" rx="4" fill="#2c6bb5"/>
    <rect x="20" y="100" width="220" height="8" rx="4" fill="#2c6bb5"/>
    <rect x="20" y="120" width="220" height="8" rx="4" fill="#2c6bb5"/>
    <!-- Wheels -->
    <circle cx="80" cy="230" r="30" fill="#333"/>
    <circle cx="80" cy="230" r="15" fill="#666"/>
    <circle cx="300" cy="230" r="30" fill="#333"/>
    <circle cx="300" cy="230" r="15" fill="#666"/>
  </g>
  <!-- Text -->
  <text x="256" y="420" text-anchor="middle" font-family="Arial,sans-serif" font-size="48" font-weight="bold" fill="white">LADE</text>
</svg>`;

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

for (const size of sizes) {
  const buf = await sharp(Buffer.from(svgIcon)).resize(size, size).png().toBuffer();
  writeFileSync(`public/icon-${size}x${size}.png`, buf);
  console.log(`Generated icon-${size}x${size}.png`);
}

// Also generate apple-touch-icon (180x180)
const appleBuf = await sharp(Buffer.from(svgIcon)).resize(180, 180).png().toBuffer();
writeFileSync('public/apple-touch-icon.png', appleBuf);
console.log('Generated apple-touch-icon.png');

console.log('Done!');
