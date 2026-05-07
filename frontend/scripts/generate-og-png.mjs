/**
 * Raster preview image for link unfurling (Discord, Slack, etc.).
 * Text-rich asset: public/og-image.svg — this PNG is a gradient fallback many crawlers require.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PNG } from 'pngjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outPath = path.join(__dirname, '..', 'public', 'og-image.png')

const W = 1200
const H = 630

const png = new PNG({ width: W, height: H, colorType: 6, inputHasAlpha: true })

for (let y = 0; y < H; y++) {
  const t = H <= 1 ? 0 : y / (H - 1)
  const r = Math.round(7 + t * 18)
  const g = Math.round(9 + t * 28)
  const b = Math.round(16 + t * 40)
  for (let x = 0; x < W; x++) {
    const i = (W * y + x) << 2
    let rr = r
    let gg = g
    let bb = b
    if (x < 78 && x >= 72 && y >= 72 && y < H - 72) {
      const u = (y - 72) / (H - 144)
      rr = Math.round(90 + u * 90)
      gg = Math.round(232 - u * 40)
      bb = 255
    }
    const wave = Math.sin((x / W) * Math.PI * 2) * 12 + H * 0.67
    if (y > wave && y < H - 40) {
      rr = Math.min(255, rr + 25)
      gg = Math.min(255, gg + 15)
      bb = Math.min(255, bb + 35)
    }
    png.data[i] = rr
    png.data[i + 1] = gg
    png.data[i + 2] = bb
    png.data[i + 3] = 255
  }
}

fs.mkdirSync(path.dirname(outPath), { recursive: true })

await new Promise((resolve, reject) => {
  const stream = fs.createWriteStream(outPath)
  stream.on('finish', resolve)
  stream.on('error', reject)
  png.pack().pipe(stream)
})
