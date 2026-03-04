const sharp = require('sharp');
const fs = require('fs');

const svg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#facc15;stop-opacity:1" />
      <stop offset="50%" style="stop-color:#f97316;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#ef4444;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#grad)" />
  <g transform="translate(109.6, 109.6) scale(12.2)">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  </g>
</svg>
`;

// Save the raw SVG just in case
fs.writeFileSync('public/icon.svg', svg);

const b = Buffer.from(svg);

async function generate() {
    await sharp(b).png().toFile('public/icon-512.png');
    console.log('512x512 created');

    await sharp(b).resize(192, 192).png().toFile('public/icon-192.png');
    console.log('192x192 created');

    await sharp(b).resize(180, 180).png().toFile('apple-icon.png');
    console.log('apple-icon created');
}

generate().catch(console.error);
