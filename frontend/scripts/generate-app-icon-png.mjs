/**
 * Raster app icons from `public/favicon.svg` for browsers that prefer PNG
 * (tab favicon, shortcut icon, apple-touch-icon, PWA install).
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, '..', 'public')
const svgPath = path.join(publicDir, 'favicon.svg')

const outputs = [
  { file: 'credential-dojo.png', size: 1024 },
  { file: 'pwa-512.png', size: 512 },
  { file: 'pwa-192.png', size: 192 },
  { file: 'pwa-180.png', size: 180 },
]

for (const { file, size } of outputs) {
  const outPath = path.join(publicDir, file)
  await sharp(svgPath)
    .resize(size, size, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toFile(outPath)
  console.log(`Wrote ${path.relative(path.join(__dirname, '..'), outPath)} (${size}×${size})`)
}
