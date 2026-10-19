// Logo concept exploration for the v3 identity. Run from website/ so sharp resolves.
// Writes a contact sheet of candidate marks at 72 / 40 / 24 / 16 px on dark and light.
import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const out = resolve(here, '..', 'output', 'rebrand-2026-v3', 'design', 'concepts')
await mkdir(out, { recursive: true })

const INK = '#0b0a12'
const MINT = '#4ff0c1'
const PLASMA = '#a06bff'
const GOLD = '#f2b64c'
const PAPER = '#f4f1e8'

const svg = (body, w = 100, h = 100) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`

const concepts = {
  A: svg(`<path d="M50 8 86 29v42L50 92 14 71V29Z" fill="none" stroke="${MINT}" stroke-width="12"/><path d="M50 36 65 45v20L50 74 35 65V45Z" fill="${PLASMA}"/>`),
  B: svg(`<path d="M50 6 94 50 50 94 6 50Z" fill="none" stroke="${MINT}" stroke-width="11"/><path d="M50 30 70 50 50 70 30 50Z" fill="${PLASMA}"/>`),
  C: svg(`<rect x="14" y="18" width="72" height="14" rx="2" fill="${MINT}"/><rect x="22" y="42" width="56" height="14" rx="2" fill="${PLASMA}"/><rect x="30" y="66" width="40" height="14" rx="2" fill="${GOLD}"/>`),
  D: svg(`<circle cx="50" cy="50" r="34" fill="none" stroke="${MINT}" stroke-width="12"/><path d="M50 22v26M50 52l16 22" stroke="${PLASMA}" stroke-width="11"/>`),
  E: svg(`<rect x="8" y="8" width="84" height="84" rx="18" fill="none" stroke="${MINT}" stroke-width="10"/><path d="M30 72V40l20 16 20-16v32" fill="none" stroke="${PLASMA}" stroke-width="11"/>`),
  F: svg(`<path d="M50 12 92 84H8Z" fill="none" stroke="${MINT}" stroke-width="11"/><path d="M38 62h24" stroke="${PLASMA}" stroke-width="10"/><path d="M18 84h20M62 84h20" stroke="${GOLD}" stroke-width="8"/>`),
  G: svg(`<path d="M50 10 88 32v36L50 90 12 68V32Z" fill="none" stroke="${MINT}" stroke-width="9"/><path d="M12 32 50 54 88 32" fill="none" stroke="${PLASMA}" stroke-width="9"/><path d="M50 54v36" stroke="${PLASMA}" stroke-width="9"/>`),
  H: svg(`<circle cx="50" cy="50" r="36" fill="none" stroke="${MINT}" stroke-width="10" stroke-dasharray="56 12"/><rect x="34" y="34" width="32" height="32" rx="6" fill="${PLASMA}"/>`),
  I: svg(`<path d="M20 40 50 20l30 20" fill="none" stroke="${MINT}" stroke-width="11"/><path d="M20 70 50 50l30 20" fill="none" stroke="${PLASMA}" stroke-width="11"/>`),
  J: svg(`<circle cx="50" cy="50" r="30" fill="none" stroke="${MINT}" stroke-opacity=".5" stroke-width="3"/>${Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 2
    return `<circle cx="${(50 + Math.cos(a) * 30).toFixed(1)}" cy="${(50 + Math.sin(a) * 30).toFixed(1)}" r="${i === 0 ? 11 : 7}" fill="${i === 0 ? PLASMA : MINT}"/>`
  }).join('')}`),
  K: svg(`<g transform="translate(6 0) scale(.88)"><path d="M30 20 24 80M48 20 42 80M18 42h64M18 62h64" stroke="${MINT}" stroke-width="9"/></g>`),
  L: svg(`<circle cx="50" cy="50" r="38" fill="none" stroke="${MINT}" stroke-width="8"/><path d="M50 12 74 62H26Z" fill="${PLASMA}"/><circle cx="50" cy="50" r="9" fill="${INK}"/>`),
}

const order = Object.keys(concepts)
const cols = 4
const rows = Math.ceil(order.length / cols)
const sheetW = cols * 320 + 20
const sheetH = rows * 240 + 40
const tiles = []
const labels = []
const at = (key, size) => `data:image/svg+xml;base64,${Buffer.from(concepts[key].replace('width="100" height="100"', `width="${size}" height="${size}"`)).toString('base64')}`

order.forEach((key, index) => {
  const x = 10 + (index % cols) * 320
  const y = 20 + Math.floor(index / cols) * 240
  tiles.push(`<rect x="${x}" y="${y}" width="300" height="144" rx="10" fill="${INK}"/>`, `<rect x="${x}" y="${y + 144}" width="300" height="76" rx="10" fill="${PAPER}"/>`)
  let cursor = x + 16
  for (const size of [72, 40, 24, 16]) {
    tiles.push(`<image x="${cursor}" y="${y + 36}" width="${size}" height="${size}" href="${at(key, size)}"/>`)
    cursor += size + 14
  }
  let cursor2 = x + 16
  for (const size of [40, 24, 16]) {
    tiles.push(`<image x="${cursor2}" y="${y + 162}" width="${size}" height="${size}" href="${at(key, size)}"/>`)
    cursor2 += size + 14
  }
  labels.push(`<text x="${x + 16}" y="${y + 136}" font-family="Consolas, monospace" font-size="13" fill="${GOLD}">CONCEPT ${key}</text>`)
})
const sheet = svg(`${tiles.join('')}${labels.join('')}`, sheetW, sheetH)
await writeFile(resolve(out, 'concept-sheet.svg'), sheet, 'utf8')
await sharp(Buffer.from(sheet)).png().toFile(resolve(out, 'concept-sheet.png'))
console.log(`wrote concept sheet with ${order.length} marks -> ${out}`)
