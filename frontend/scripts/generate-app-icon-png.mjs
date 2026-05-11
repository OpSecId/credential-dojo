/**
 * Raster app icons from `public/favicon.svg` for browsers that prefer PNG
 * (tab favicon, shortcut icon, apple-touch-icon). Keeps PNG in sync when the SVG mark changes.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const publicDir = path.join(__dirname, '..', 'public')
const svgPath = path.join(publicDir, 'favicon.svg')
const pngPath = path.join(publicDir, 'credential-dojo.png')

const SIZE = 1024

await sharp(svgPath)
  .resize(SIZE, SIZE, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png({ compressionLevel: 9 })
  .toFile(pngPath)

console.log(`Wrote ${path.relative(path.join(__dirname, '..'), pngPath)} (${SIZE}×${SIZE}, from favicon.svg)`)
