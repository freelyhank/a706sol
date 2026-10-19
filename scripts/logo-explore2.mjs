// Round 2: refine the hexagon-family marks at real UI sizes, with a wordmark test.
import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const out = resolve(here, '..', '..', 'output', 'rebrand-2026-v3', 'design', 'concepts')
await mkdir(out, { recursive: true })

const INK = '#0b0a12'
const MINT = '#4ff0c1'
const PLASMA = '#a06bff'
const GOLD = '#f2b64c'
const PAPER = '#f4f1e8'

const svg = (body, w = 100, h = 100) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`
const HEX = 'M50 9 85.5 29.5v41L50 91 14.5 70.5v-41Z'

const marks = {
  // G1: hexagon shell (thick) + solid facet diamond
  G1: svg(`<path d="${HEX}" fill="none" stroke="${MINT}" stroke-width="14"/><path d="M50 34 66 50 50 66 34 50Z" fill="${PLASMA}"/>`),
  // G2: hexagon shell + chevron facet (rune stroke)
  G2: svg(`<path d="${HEX}" fill="none" stroke="${MINT}" stroke-width="14"/><path d="M35 58V44l15 10 15-10v14" fill="none" stroke="${PLASMA}" stroke-width="9"/>`),
  // G3: filled hexagon with a cut facet (negative space diamond)
  G3: svg(`<path d="${HEX}" fill="${MINT}"/><path d="M50 33 67 50 50 67 33 50Z" fill="${INK}"/><path d="M50 40 60 50 50 60 40 50Z" fill="${PLASMA}"/>`),
  // G4: hexagon shell + notch cut from the top edge (aperture)
  G4: svg(`<path d="${HEX}" fill="none" stroke="${MINT}" stroke-width="14"/><path d="M40 9h20v13l-10 8-10-8Z" fill="${INK}"/><path d="M50 52 64 62v14l-14 8-14-8V62Z" fill="${PLASMA}"/>`),
  // G5: hexagon ring + centered square node (block in a seal)
  G5: svg(`<path d="${HEX}" fill="none" stroke="${MINT}" stroke-width="14"/><rect x="34" y="34" width="32" height="32" rx="5" fill="${PLASMA}"/>`),
  // G6: double hexagon (shell + inner shell), open centre
  G6: svg(`<path d="${HEX}" fill="none" stroke="${MINT}" stroke-width="12"/><path d="M50 27 70 39v22L50 73 30 61V39Z" fill="none" stroke="${PLASMA}" stroke-width="12"/>`),
  // A2: hexagon aperture, but with a rotated double facet
  A2: svg(`<path d="${HEX}" fill="none" stroke="${MINT}" stroke-width="13"/><path d="M50 33 67 50 50 67 33 50Z" fill="${PLASMA}"/><path d="M41 49h18" stroke="${INK}" stroke-width="6"/>`),
  // A3: hexagon shell with a downward keystone (stamped record)
  A3: svg(`<path d="${HEX}" fill="none" stroke="${MINT}" stroke-width="13"/><path d="M38 40h24l-12 22Z" fill="${PLASMA}"/>`),
  // G7: hexagon shell with a corner cut and a small square node (chain link)
  G7: svg(`<path d="M50 11 84 30.5v40L50 90 16 70.5v-40Z" fill="none" stroke="${MINT}" stroke-width="12"/><rect x="41" y="41" width="18" height="18" rx="3" fill="${PLASMA}"/><circle cx="50" cy="50" r="3.5" fill="${MINT}"/>`),
  // G8: 3D prism with simplified facets (one front face + top face)
  G8: svg(`<path d="M50 12 86 32v32L50 88 14 64V32Z" fill="none" stroke="${MINT}" stroke-width="11"/><path d="M14 32 50 52l36-20" fill="none" stroke="${PLASMA}" stroke-width="11"/><path d="M50 52v36" stroke="${PLASMA}" stroke-width="11"/>`),
}

const order = Object.keys(marks)
const tiles = []
const labels = []
const cols = 5
const rows = Math.ceil(order.length / cols)
const sheetW = cols * 320 + 20
const sheetH = rows * 252 + 40
const at = (key, size) => `data:image/svg+xml;base64,${Buffer.from(marks[key].replace('width="100" height="100"', `width="${size}" height="${size}"`)).toString('base64')}`

order.forEach((key, index) => {
  const x = 10 + (index % cols) * 320
  const y = 20 + Math.floor(index / cols) * 252
  tiles.push(`<rect x="${x}" y="${y}" width="300" height="152" rx="10" fill="${INK}"/>`, `<rect x="${x}" y="${y + 152}" width="300" height="80" rx="10" fill="${PAPER}"/>`)
  let cursor = x + 16
  for (const size of [64, 40, 32, 22, 16]) {
    tiles.push(`<image x="${cursor}" y="${y + 44}" width="${size}" height="${size}" href="${at(key, size)}"/>`)
    cursor += size + 12
  }
  let cursor2 = x + 16
  for (const size of [40, 24, 16]) {
    tiles.push(`<image x="${cursor2}" y="${y + 170}" width="${size}" height="${size}" href="${at(key, size)}"/>`)
    cursor2 += size + 12
  }
  labels.push(`<text x="${x + 16}" y="${y + 140}" font-family="Consolas, monospace" font-size="13" fill="${GOLD}">${key}</text>`)
})

// wordmark row: mark + invented word at 3 sizes
const word = 'RUNEVOX'
const wm = (x, y, scale, dark = true) => {
  const markSize = 46 * scale
  return `<image x="${x}" y="${y}" width="${markSize}" height="${markSize}" href="${at('G1', markSize)}"/><text x="${x + markSize + 12 * scale}" y="${y + markSize * 0.72}" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="${34 * scale}" letter-spacing="${-1.1 * scale}" fill="${dark ? '#f4f1e8' : '#14121c'}">${word}</text>`
}
const wmRow = `<rect x="10" y="${sheetH - 10}" width="0" height="0" fill="none"/>`
const wordSheet = svg(`${wm(30, 26, 1.5)}${wm(30, 120, 1)}${wm(30, 190, .62)}`, 900, 280)
await writeFile(resolve(out, 'wordmark-test.svg'), wordSheet, 'utf8')
await sharp(Buffer.from(wordSheet)).png().toFile(resolve(out, 'wordmark-test.png'))

const sheet = svg(`${tiles.join('')}${labels.join('')}${wmRow}`, sheetW, sheetH)
await writeFile(resolve(out, 'refine-sheet.svg'), sheet, 'utf8')
await sharp(Buffer.from(sheet)).png().toFile(resolve(out, 'refine-sheet.png'))
console.log('wrote refine sheet', order.join(', '))
