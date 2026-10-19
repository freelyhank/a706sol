// The shipped mark plus a favicon legibility board, rendered from the same geometry that
// scripts/render-assets.mjs uses.
import sharp from 'sharp'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const out = resolve(here, '..', '..', 'output', 'rebrand-2026-v3', 'design')
await mkdir(out, { recursive: true })

const INK = '#08070f'
const SHELL = '#0d0c1a'
const MINT = '#4ff0c1'
const PLASMA = '#a06bff'
const GOLD = '#f2c14e'
const PAPER = '#f5f2e9'
const PATH = 'M50 9.5 84.5 29.4v39.8L50 89.1 15.5 69.2V29.4Z'
const svg = (body, w = 100, h = 100) => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${body}</svg>`

const markSvg = (scale = 100, stroke = 15, bar = 11, shell = MINT, inscription = PLASMA) => `<svg xmlns="http://www.w3.org/2000/svg" width="${scale}" height="${scale}" viewBox="0 0 100 100"><defs><clipPath id="c"><path d="${PATH}"/></clipPath></defs><path d="${PATH}" fill="none" stroke="${shell}" stroke-width="${stroke}"/><g clip-path="url(#c)"><path d="M25 75 75 25" stroke="${inscription}" stroke-width="${bar}"/></g></svg>`

await writeFile(resolve(out, 'mark-geometry.svg'), markSvg(), 'utf8')

const at = (size, stroke = 15, bar = 11) => `data:image/svg+xml;base64,${Buffer.from(markSvg(size, stroke, bar)).toString('base64')}`
const tile = (size, stroke = 15, bar = 11) => `data:image/svg+xml;base64,${Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" rx="${size * 0.24}" fill="${SHELL}"/><image x="${size * 0.12}" y="${size * 0.12}" width="${size * 0.76}" height="${size * 0.76}" href="${at(size * 0.76, stroke, bar)}"/></svg>`,
).toString('base64')}`

const sizes = [72, 48, 32, 24, 16]
const rows = []
let y = 60
for (const size of sizes) {
  rows.push(`<text x="60" y="${y + size * 0.7}" font-family="Consolas, monospace" font-size="14" fill="${GOLD}">${size}px</text>`)
  rows.push(`<image x="150" y="${y}" width="${size}" height="${size}" href="${at(size)}"/>`)
  rows.push(`<image x="260" y="${y}" width="${size}" height="${size}" href="${tile(size)}"/>`)
  rows.push(`<rect x="380" y="${y}" width="${Math.max(size, 20) + 20}" height="${size}" rx="4" fill="${PAPER}"/>`)
  rows.push(`<image x="390" y="${y}" width="${size}" height="${size}" href="data:image/svg+xml;base64,${Buffer.from(markSvg(size, 15, 11, INK, '#6b3fc4')).toString('base64')}"/>`)
  y += Math.max(size, 26) + 26
}

const boardWidth = 620
const boardHeight = y + 40
const board = svg(`${rows.join('')}`, boardWidth, boardHeight)
await writeFile(resolve(out, 'favicon-legibility.svg'), board, 'utf8')
await sharp(Buffer.from(board)).png().toFile(resolve(out, 'favicon-legibility.png'))

// A polarity and surface sheet: mark on ink, on shell, on paper, and over the aurora.
const surfaces = `<svg xmlns="http://www.w3.org/2000/svg" width="1040" height="300" viewBox="0 0 1040 300">
  <defs><radialGradient id="a" cx="30%" cy="20%" r="70%"><stop offset="0%" stop-color="#17b98d" stop-opacity=".55"/><stop offset="100%" stop-color="#17b98d" stop-opacity="0"/></radialGradient><radialGradient id="b" cx="80%" cy="80%" r="70%"><stop offset="0%" stop-color="${PLASMA}" stop-opacity=".45"/><stop offset="100%" stop-color="${PLASMA}" stop-opacity="0"/></radialGradient></defs>
  <rect width="1040" height="300" fill="${INK}"/>
  <rect x="20" y="20" width="240" height="260" rx="16" fill="${SHELL}"/>
  <rect x="280" y="20" width="240" height="260" rx="16" fill="${PAPER}"/>
  <rect x="540" y="20" width="480" height="260" rx="16" fill="${INK}"/>
  <rect x="540" y="20" width="480" height="260" rx="16" fill="url(#a)"/>
  <rect x="540" y="20" width="480" height="260" rx="16" fill="url(#b)"/>
  <image x="100" y="110" width="80" height="80" href="${at(80)}"/>
  <image x="360" y="110" width="80" height="80" href="data:image/svg+xml;base64,${Buffer.from(markSvg(80, 15, 11, INK, '#6b3fc4')).toString('base64')}"/>
  <image x="700" y="110" width="80" height="80" href="${at(80)}"/>
  <text x="20" y="16" font-family="Consolas, monospace" font-size="11" fill="${GOLD}">SHELL</text>
  <text x="280" y="16" font-family="Consolas, monospace" font-size="11" fill="${GOLD}">PAPER / REVERSE</text>
  <text x="540" y="16" font-family="Consolas, monospace" font-size="11" fill="${GOLD}">AURORA</text>
  <text x="22" y="296" font-family="Consolas, monospace" font-size="11" fill="${GOLD}">MARK ON EVERY SHIPPING SURFACE</text>
</svg>`
await writeFile(resolve(out, 'mark-surfaces.svg'), surfaces, 'utf8')
await sharp(Buffer.from(surfaces)).png().toFile(resolve(out, 'mark-surfaces.png'))

console.log('wrote mark-geometry.svg, favicon-legibility.png, mark-surfaces.png')
