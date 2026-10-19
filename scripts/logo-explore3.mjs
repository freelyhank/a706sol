// Round 3: finalists — hexagon seal family with inner-node variations, plus wordmark lockups.
import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const out = resolve(here, '..', '..', 'output', 'rebrand-2026-v3', 'design', 'concepts')
await mkdir(out, { recursive: true })

const INK = '#0b0a12'
const PANEL = '#141428'
const MINT = '#4ff0c1'
const PLASMA = '#a06bff'
const GOLD = '#f2b64c'
const PAPER = '#f4f1e8'

const svg = (body, w = 100, h = 100) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`
const HEX = 'M50 9 85.5 29.5v41L50 91 14.5 70.5v-41Z'
const HEX_IN = 'M50 30 67.3 40v20L50 70 32.7 60V40Z'

const marks = {
  F1: svg(`<path d="${HEX}" fill="none" stroke="${MINT}" stroke-width="14"/><path d="${HEX_IN}" fill="${PLASMA}"/>`),
  F2: svg(`<path d="${HEX}" fill="none" stroke="${MINT}" stroke-width="14"/><circle cx="50" cy="50" r="15" fill="${PLASMA}"/>`),
  F3: svg(`<path d="${HEX}" fill="none" stroke="${MINT}" stroke-width="14"/><rect x="35" y="35" width="30" height="30" rx="7" fill="${PLASMA}"/>`),
  F4: svg(`<path d="${HEX}" fill="none" stroke="${MINT}" stroke-width="14"/><path d="M50 34 66 50 50 66 34 50Z" fill="${PLASMA}"/>`),
  F5: svg(`<path d="${HEX}" fill="none" stroke="${MINT}" stroke-width="15"/><path d="M50 41 58 50 50 59 42 50Z" fill="${PLASMA}"/>`),
  F6: svg(`<path d="${HEX}" fill="${MINT}"/><path d="${HEX_IN}" fill="${INK}"/><circle cx="50" cy="50" r="7" fill="${PLASMA}"/>`),
  F7: svg(`<path d="${HEX}" fill="none" stroke="${MINT}" stroke-width="14"/><path d="${HEX_IN}" fill="none" stroke="${PLASMA}" stroke-width="10"/>`),
  F8: svg(`<path d="${HEX}" fill="none" stroke="${MINT}" stroke-width="14"/><path d="M36 61V44l14 10 14-10v17" fill="none" stroke="${PLASMA}" stroke-width="10"/>`),
  F9: svg(`<path d="${HEX}" fill="none" stroke="${MINT}" stroke-width="13" stroke-dasharray="104 12"/><circle cx="50" cy="50" r="14" fill="${PLASMA}"/>`),
  F10: svg(`<path d="${HEX}" fill="none" stroke="${MINT}" stroke-width="14"/><path d="M50 33v17l13 13" fill="none" stroke="${PLASMA}" stroke-width="9"/><circle cx="50" cy="50" r="6" fill="${PLASMA}"/>`),
}

const order = Object.keys(marks)
const tiles = []
const labels = []
const cols = 5
const rows = Math.ceil(order.length / cols)
const sheetW = cols * 300 + 20
const sheetH = rows * 250 + 240
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

// lockup rows using the provisional word; the final word is set in src/data/brand.js
const PROVISIONAL = 'RUNIVOX'
const lockup = (x, y, scale, word) => {
  const size = 46 * scale
  return `<image x="${x}" y="${y}" width="${size}" height="${size}" href="${at('F4', size)}"/><text x="${x + size + 11 * scale}" y="${y + size * 0.73}" font-family="Arial, sans-serif" font-weight="700" font-size="${33 * scale}" letter-spacing="${1.6 * scale}" fill="${PAPER}">${word}</text>`
}
const lockups = `
  <rect x="10" y="${sheetH - 210}" width="${sheetW - 20}" height="196" rx="12" fill="${PANEL}"/>
  ${lockup(40, sheetH - 186, 1.35, PROVISIONAL)}
  ${lockup(40, sheetH - 118, 0.92, PROVISIONAL)}
  ${lockup(40, sheetH - 60, 0.62, PROVISIONAL)}
  ${lockup(430, sheetH - 186, 1.35, PROVISIONAL)}
  ${lockup(430, sheetH - 118, 0.92, PROVISIONAL)}
  ${lockup(430, sheetH - 60, 0.62, PROVISIONAL)}
  <text x="${sheetW - 40}" y="${sheetH - 30}" text-anchor="end" font-family="Consolas, monospace" font-size="12" fill="${GOLD}">WORDMARK TEST / PLACEHOLDER WORD</text>
`
const sheet = svg(`${tiles.join('')}${labels.join('')}${lockups}`, sheetW, sheetH)
await writeFile(resolve(out, 'finalist-sheet.svg'), sheet, 'utf8')
await sharp(Buffer.from(sheet)).png().toFile(resolve(out, 'finalist-sheet.png'))
console.log('wrote finalist sheet', order.join(', '))
