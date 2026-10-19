// Round 4: hexagon seal variants with a diagonal inscription notch, tested at 16 px.
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
  // hexagon ring with a diagonal inscription bar, clipped inside the ring
  S1: svg(`<clipPath id="c1"><path d="${HEX}"/></clipPath><path d="${HEX}" fill="none" stroke="${MINT}" stroke-width="14"/><g clip-path="url(#c1)"><path d="M22 78 78 22" stroke="${PLASMA}" stroke-width="13"/></g>`),
  S2: svg(`<clipPath id="c2"><path d="${HEX}"/></clipPath><path d="${HEX}" fill="none" stroke="${MINT}" stroke-width="14"/><g clip-path="url(#c2)"><path d="M26 74 74 26" stroke="${PLASMA}" stroke-width="17"/></g>`),
  S3: svg(`<clipPath id="c3"><path d="${HEX}"/></clipPath><path d="${HEX}" fill="none" stroke="${MINT}" stroke-width="14"/><g clip-path="url(#c3)"><path d="M50 26v48" stroke="${PLASMA}" stroke-width="13"/><path d="M30 50h40" stroke="${PLASMA}" stroke-width="13"/></g>`),
  // hexagon with solid inner hexagon and a plasma dot (double seal)
  S4: svg(`<path d="${HEX}" fill="none" stroke="${MINT}" stroke-width="13"/><path d="M50 26 70.8 38v24L50 74 29.2 62V38Z" fill="none" stroke="${PLASMA}" stroke-width="11"/>`),
  // hexagon ring, plasma bar angled the other way
  S5: svg(`<clipPath id="c5"><path d="${HEX}"/></clipPath><path d="${HEX}" fill="none" stroke="${MINT}" stroke-width="14"/><g clip-path="url(#c5)"><path d="M22 22 78 78" stroke="${PLASMA}" stroke-width="15"/></g>`),
  // hexagon ring with a short centred "rune" stroke pair
  S6: svg(`<clipPath id="c6"><path d="${HEX}"/></clipPath><path d="${HEX}" fill="none" stroke="${MINT}" stroke-width="14"/><g clip-path="url(#c6)"><path d="M36 62V40l14 10 14-10v22" fill="none" stroke="${PLASMA}" stroke-width="9"/></g>`),
  // hexagon ring with plasma diamond + mint pinhole (a "read" aperture)
  S7: svg(`<path d="${HEX}" fill="none" stroke="${MINT}" stroke-width="13"/><path d="M50 32 68 50 50 68 32 50Z" fill="${PLASMA}"/><circle cx="50" cy="50" r="6" fill="${INK}"/>`),
  // hexagon ring with three stacked plasma slabs (ledger)
  S8: svg(`<clipPath id="c8"><path d="${HEX}"/></clipPath><path d="${HEX}" fill="none" stroke="${MINT}" stroke-width="13"/><g clip-path="url(#c8)"><rect x="32" y="33" width="36" height="8" fill="${PLASMA}"/><rect x="32" y="46" width="26" height="8" fill="${PLASMA}"/><rect x="32" y="59" width="31" height="8" fill="${PLASMA}"/></g>`),
}

const order = Object.keys(marks)
const tiles = []
const labels = []
const cols = 4
const rows = Math.ceil(order.length / cols)
const sheetW = cols * 300 + 20
const sheetH = rows * 250 + 40
const at = (key, size) => `data:image/svg+xml;base64,${Buffer.from(marks[key].replace('width="100" height="100"', `width="${size}" height="${size}"`)).toString('base64')}`

order.forEach((key, index) => {
  const x = 10 + (index % cols) * 300
  const y = 20 + Math.floor(index / cols) * 250
  tiles.push(`<rect x="${x}" y="${y}" width="280" height="150" rx="10" fill="${INK}"/>`, `<rect x="${x}" y="${y + 150}" width="280" height="80" rx="10" fill="${PAPER}"/>`)
  let cursor = x + 16
  for (const size of [64, 40, 32, 22, 16]) {
    tiles.push(`<image x="${cursor}" y="${y + 43}" width="${size}" height="${size}" href="${at(key, size)}"/>`)
    cursor += size + 12
  }
  let cursor2 = x + 16
  for (const size of [40, 24, 16]) {
    tiles.push(`<image x="${cursor2}" y="${y + 168}" width="${size}" height="${size}" href="${at(key, size)}"/>`)
    cursor2 += size + 12
  }
  labels.push(`<text x="${x + 16}" y="${y + 138}" font-family="Consolas, monospace" font-size="13" fill="${GOLD}">${key}</text>`)
})

const sheet = svg(`${tiles.join('')}${labels.join('')}`, sheetW, sheetH)
await writeFile(resolve(out, 'seal-sheet.svg'), sheet, 'utf8')
await sharp(Buffer.from(sheet)).png().toFile(resolve(out, 'seal-sheet.png'))
console.log('wrote seal sheet', order.join(', '))
