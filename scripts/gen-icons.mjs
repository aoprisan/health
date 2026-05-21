// Regenerates the PWA icons in public/ from the water-drop mark.
// One-off tooling: run `npm i -D sharp` first, then `node scripts/gen-icons.mjs`.
import sharp from 'sharp'
import { mkdirSync } from 'node:fs'

const PAPER = '#f3ece0'

// Square app icon (purpose: "any") — paper field with the water drop centered.
const iconAny = `<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512' viewBox='0 0 512 512'>
  <defs>
    <linearGradient id='w' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='#4a7ba6'/>
      <stop offset='1' stop-color='#1f4368'/>
    </linearGradient>
  </defs>
  <rect width='512' height='512' fill='${PAPER}'/>
  <g transform='translate(64,52) scale(6)'>
    <path d='M32 4 C 18 24, 12 36, 12 44 a 20 20 0 0 0 40 0 c 0 -8 -6 -20 -20 -40 z' fill='url(#w)'/>
    <path d='M22 38 c 0 6 4 10 10 10' fill='none' stroke='${PAPER}' stroke-width='3' stroke-linecap='round' opacity='0.9'/>
  </g>
</svg>`

// Maskable icon — full-bleed paper, drop kept inside the 80% safe zone.
const iconMaskable = `<svg xmlns='http://www.w3.org/2000/svg' width='512' height='512' viewBox='0 0 512 512'>
  <defs>
    <linearGradient id='w' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0' stop-color='#4a7ba6'/>
      <stop offset='1' stop-color='#1f4368'/>
    </linearGradient>
  </defs>
  <rect width='512' height='512' fill='${PAPER}'/>
  <g transform='translate(108.8,99.6) scale(4.6)'>
    <path d='M32 4 C 18 24, 12 36, 12 44 a 20 20 0 0 0 40 0 c 0 -8 -6 -20 -20 -40 z' fill='url(#w)'/>
    <path d='M22 38 c 0 6 4 10 10 10' fill='none' stroke='${PAPER}' stroke-width='3' stroke-linecap='round' opacity='0.9'/>
  </g>
</svg>`

mkdirSync('public', { recursive: true })

const jobs = [
  { svg: iconAny, size: 192, out: 'public/pwa-192x192.png' },
  { svg: iconAny, size: 512, out: 'public/pwa-512x512.png' },
  { svg: iconMaskable, size: 512, out: 'public/maskable-512x512.png' },
  { svg: iconAny, size: 180, out: 'public/apple-touch-icon.png' },
]

for (const { svg, size, out } of jobs) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(out)
  console.log('wrote', out)
}
