// Final mark refinement: hexagon seal with a clipped diagonal inscription, plus polarity and
// favicon-tile tests at the sizes the product actually ships.
import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const out = resolve(here, '..', '..', 'output', 'rebrand-2026-v3', 'design', 'concepts')
await mkdir(out, { recursive: true })

const INK = '#08070f'
const PANEL = '#12111f'
const MINT = '#4ff0c1'
const PLASMA = '#a06bff'
const GOLD = '#f2c14e'
const PAPER = '#f5f2e9'
const svg = (body, w = 100, h = 100) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`
const HEX = 'M50 9.5 84.5 29.4v39.8L50 89.1 15.5 69.2V29.4Z'

// V1: shell 13 + bar 12, clipped  (candidate)
const V1 = svg(`<clipPath id="v1"><path d="${HEX}"/></clipPath><path d="${HEX}" fill="none" stroke="${MINT}" stroke-width="13"/><g clip-path="url(#v1)"><path d="M24 76 76 24" stroke="${PLASMA}" stroke-width="12"/></g>`)
// V2: shell 15 + bar 11
const V2 = svg(`<clipPath id="v2"><path d="${HEX}"/></clipPath><path d="${HEX}" fill="none" stroke="${MINT}" stroke-width="15"/><g clip-path="url(#v2)"><path d="M25 75 75 25" stroke="${PLASMA}" stroke-width="11"/></g>`)
// V3: shell 14 + bar 14 with square ends
const V3 = svg(`<clipPath id="v3"><path d="${HEX}"/></clipPath><path d="${HEX}" fill="none" stroke="${MINT}" stroke-width="14"/><g clip-path="url(#v3)"><path d="M23 77 77 23" stroke="${PLASMA}" stroke-width="14"/></g>`)
// V4: shell as a filled hexagon plate with the bar knocked out
const V4 = svg(`<path d="${HEX}" fill="${MINT}"/><path d="M26 74 74 26" stroke="${INK}" stroke-width="13"/><path d="M30 70 70 30" stroke="${PLASMA}" stroke-width="7"/>`)
// V5: shell 14, bar 10, dot terminal
const V5 = svg(`<clipPath id="v5"><path d="${HEX}"/></clipPath><path d="${HEX}" fill="none" stroke="${MINT}" stroke-width="14"/><g clip-path="url(#v5)"><path d="M25 75 75 25" stroke="${PLASMA}" stroke-width="10"/><circle cx="74" cy="26" r="9" fill="${PLASMA}"/><circle cx="26" cy="74" r="6" fill="${PLASMA}"/></g>`)
// V6: shell 14, bar 12 the other diagonal
const V6 = svg(`<clipPath id="v6"><path d="${HEX}"/></clipPath><path d="${HEX}" fill="none" stroke="${MINT}" stroke-width="14"/><g clip-path="url(#v6)"><path d="M24 24 76 76" stroke="${PLASMA}" stroke-width="12"/></g>`)

const variants = { V1, V2, V3, V4, V5, V6 }
const order = Object.keys(variants)
const at = (key, size) => `data:image/svg+xml;base64,${Buffer.from(variants[key].replace('width="100" height="100"', `width="${size}" height="${size}"`)).toString('base64')}`

const tiles = []
const labels = []
const cols = 3
const rows = Math.ceil(order.length / cols)
const sheetW = cols * 360 + 20
const sheetH = rows * 250 + 420

order.forEach((key, index) => {
  const x = 10 + (index % cols) * 360
  const y = 20 + Math.floor(index / cols) * 250
  tiles.push(`<rect x="${x}" y="${y}" width="340" height="150" rx="10" fill="${INK}"/>`, `<rect x="${x}" y="${y + 150}" width="340" height="80" rx="10" fill="${PAPER}"/>`)
  let cursor = x + 18
  for (const size of [72, 40, 32, 22, 16]) {
    tiles.push(`<image x="${cursor}" y="${y + 39}" width="${size}" height="${size}" href="${at(key, size)}"/>`)
    cursor += size + 12
  }
  let cursor2 = x + 18
  for (const size of [40, 24, 16]) {
    tiles.push(`<image x="${cursor2}" y="${y + 170}" width="${size}" height="${size}" href="${at(key, size)}"/>`)
    cursor2 += size + 12
  }
  labels.push(`<text x="${x + 18}" y="${y + 138}" font-family="Consolas, monospace" font-size="13" fill="${GOLD}">${key}</text>`)
})

// polarity + favicon tile test on the leading variant
const tile = (size, bg, mark) => `<rect width="${size}" height="${size}" rx="${size * 0.22}" fill="${bg}"/><image x="${size * 0.1}" y="${size * 0.1}" width="${size * 0.8}" height="${size * 0.8}" href="${mark}"/>`
const faviconSizes = [64, 32, 16]
const faviconRow = faviconSizes.map((size, index) => {
  const x = 1100 + index * 0
  return `<image x="${40 + index * 90}" y="${sheetH - 250}" width="${size}" height="${size}" href="data:image/svg+xml;base64,${Buffer.from(svg(tile(size, INK, at('V2', size * 0.8)))).toString('base64')}"/>`
}).join('')

const lockup = (x, y, scale) => {
  const size = 48 * scale
  return `<image x="${x}" y="${y}" width="${size}" height="${size}" href="${at('V2', size)}"/><text x="${x + size + 12 * scale}" y="${y + size * 0.74}" font-family="Arial, sans-serif" font-weight="700" font-size="${34 * scale}" letter-spacing="${1.2 * scale}" fill="${PAPER}">LATIVOX</text>`
}

const extras = `
  <rect x="10" y="${sheetH - 420}" width="${sheetW - 20}" height="180" rx="12" fill="${PANEL}"/>
  <text x="30" y="${sheetH - 392}" font-family="Consolas, monospace" font-size="12" fill="${GOLD}">FAVICON TILES / 64 - 32 - 16</text>
  ${faviconRow}
  <rect x="10" y="${sheetH - 226}" width="${sheetW - 20}" height="212" rx="12" fill="${PANEL}"/>
  <text x="30" y="${sheetH - 200}" font-family="Consolas, monospace" font-size="12" fill="${GOLD}">WORDMARK LOCKUP</text>
  ${lockup(40, sheetH - 180, 1.5)}
  ${lockup(40, sheetH - 112, 1)}
  ${lockup(40, sheetH - 54, 0.62)}
  <text x="${sheetW - 40}" y="${sheetH - 24}" text-anchor="end" font-family="Consolas, monospace" font-size="12" fill="${MINT}">LATIVOX.XYZ</text>
`
const sheet = svg(`${tiles.join('')}${labels.join('')}${extras}`, sheetW, sheetH)
await writeFile(resolve(out, 'final-sheet.svg'), sheet, 'utf8')
await sharp(Buffer.from(sheet)).png().toFile(resolve(out, 'final-sheet.png'))
console.log('wrote final sheet:', order.join(', '))
