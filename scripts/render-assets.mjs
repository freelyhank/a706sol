import sharp from 'sharp'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { brand } from '../src/data/brand.js'

// One source for the Lativox identity. Runs from website/ and writes both the site assets and
// the twitter/ kit. Everything visual is derived from the values below.
const scriptDir = dirname(fileURLToPath(import.meta.url))
const scriptWebsite = resolve(scriptDir, '..')
const workspace = resolve(scriptWebsite, '..')
const publicAssets = resolve(scriptWebsite, 'public/assets')
const socialAssets = resolve(workspace, 'twitter')

const colors = Object.freeze({
  ink: '#08070f',
  shell: '#0d0c1a',
  panel: '#12111f',
  panel2: '#171630',
  panel3: '#1d1c3c',
  text: '#f5f2e9',
  muted: '#a49fc4',
  faint: '#746e97',
  mint: '#4ff0c1',
  mintDeep: '#17b98d',
  plasma: '#a06bff',
  ember: '#ff7a59',
  gold: '#f2c14e',
  line: '#262446',
  lineSoft: '#1e1c39',
  lineHot: '#3a3770',
})

const sans = 'Arial, Helvetica, sans-serif'
const serifDisplay = 'Georgia, "Times New Roman", serif'
const mono = 'Consolas,monospace'

const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
const text = (x, y, value, size, fill = colors.text, extra = '', family = sans) => {
  // A caller may override the family through `extra`; never emit the attribute twice.
  const override = /font-family=/.test(extra)
  const attrs = override ? extra : `font-family="${family}"${extra ? ` ${extra}` : ''}`
  return `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" ${attrs}>${esc(value)}</text>`
}
// Numeric readouts are set in the monospace face; the family name carries no quotes so it can
// be embedded in an attribute payload safely.
const numeric = 'font-family="Consolas,monospace"'
const label = (x, y, value, size = 13, fill = colors.faint, extra = '') => text(x, y, value, size, fill, `letter-spacing="3.2"${extra ? ` ${extra}` : ''}`, mono)
const rule = (x, y, width, stroke = colors.line) => `<path d="M${x} ${y}h${width}" fill="none" stroke="${stroke}"/>`

const svg = (width, height, body, title, background = colors.ink) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title>${background ? `<rect width="${width}" height="${height}" fill="${background}"/>` : ''}${body}</svg>`

const glowDefs = `<defs>
  <filter id="soft" x="-70%" y="-70%" width="240%" height="240%"><feGaussianBlur stdDeviation="14"/></filter>
  <radialGradient id="auroraA" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="${colors.mintDeep}" stop-opacity=".55"/><stop offset="100%" stop-color="${colors.mintDeep}" stop-opacity="0"/></radialGradient>
  <radialGradient id="auroraB" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="${colors.plasma}" stop-opacity=".45"/><stop offset="100%" stop-color="${colors.plasma}" stop-opacity="0"/></radialGradient>
  <linearGradient id="beam" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="${colors.mintDeep}"/><stop offset="100%" stop-color="${colors.mint}"/></linearGradient>
</defs>`

// Dot survey paper: the backdrop language of the interface.
const dotDefs = (id, size = 26, opacity = 0.16, color = '#ffffff') => `<defs><pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="${color}" fill-opacity="${opacity}"/></pattern></defs>`
const dotField = (id, x, y, width, height) => `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="url(#${id})"/>`

const aurora = (x, y, r, which) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#${which})"/>`

// The mark: a hexagonal seal with a diagonal inscription bar clipped inside it.
const MARK_PATH = 'M50 9.5 84.5 29.4v39.8L50 89.1 15.5 69.2V29.4Z'
const markPath = ({ x = 0, y = 0, scale = 1 }) => {
  const s = scale / 100
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <clipPath id="mk${Math.round(x)}-${Math.round(y)}-${Math.round(scale * 1000)}"><path d="${MARK_PATH}"/></clipPath>
    <path d="${MARK_PATH}" fill="none" stroke="${colors.mint}" stroke-width="15"/>
    <g clip-path="url(#mk${Math.round(x)}-${Math.round(y)}-${Math.round(scale * 1000)})"><path d="M25 75 75 25" stroke="${colors.plasma}" stroke-width="11"/></g>
  </g>`
}
const reverseMarkPath = ({ x = 0, y = 0, scale = 1 }) => {
  const s = scale / 100
  const id = `rv${Math.round(x)}-${Math.round(y)}-${Math.round(scale * 1000)}`
  return `<g transform="translate(${x} ${y}) scale(${s})">
    <clipPath id="${id}"><path d="${MARK_PATH}"/></clipPath>
    <path d="${MARK_PATH}" fill="none" stroke="${colors.ink}" stroke-width="15"/>
    <g clip-path="url(#${id})"><path d="M25 75 75 25" stroke="#6b3fc4" stroke-width="11"/></g>
  </g>`
}
// A tile that carries the mark, used for favicons and avatars.
const markTile = ({ x = 0, y = 0, size = 100, fill = colors.shell, radius = null, glow = false }) => {
  const r = radius ?? size * 0.24
  const inner = size * 0.76
  const offset = (size - inner) / 2
  return `${glow ? `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${r}" fill="${colors.mint}" fill-opacity=".55" filter="url(#soft)"/>` : ''}
    <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${r}" fill="${fill}"/>
    <rect x="${x + 0.5}" y="${y + 0.5}" width="${size - 1}" height="${size - 1}" rx="${r}" fill="none" stroke="${colors.lineHot}" stroke-width="1"/>
    ${markPath({ x: x + offset, y: y + offset, scale: inner })}`
}
const wordmark = (x, y, size = 46, fill = colors.text) => text(x, y, brand.display, size, fill, `font-weight="700" letter-spacing="${size * 0.05}"`)
const footer = (width, height, note) => `${rule(60, height - 92, width - 120, colors.lineSoft)}${label(60, height - 46, note, 12, colors.faint)}${text(width - 60, height - 46, brand.domain, 15, colors.mint, 'text-anchor="end" font-weight="700" letter-spacing="1.6"')}`
const card = (x, y, width, height, stroke = colors.line) => `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="14" fill="${colors.panel}" stroke="${stroke}"/>`
const chip = (x, y, value, tone = 'mint') => {
  const width = value.length * 8.6 + 22
  const color = tone === 'mint' ? colors.mint : colors.gold
  const fill = tone === 'mint' ? '#4ff0c11a' : '#f2c14e1a'
  const stroke = tone === 'mint' ? '#4ff0c14d' : '#f2c14e4d'
  return `<rect x="${x}" y="${y}" width="${width}" height="26" rx="13" fill="${fill}" stroke="${stroke}"/>${text(x + 11, y + 18, value, 12, color, 'letter-spacing="1.4"', mono)}`
}
// A sparkline of a fixture history, normalised into the given box.
const spark = (x, y, width, height, history, stroke = colors.mint) => {
  const low = Math.min(...history)
  const high = Math.max(...history)
  const span = high - low || 1
  const points = history.map((value, index) => `${(x + (index / (history.length - 1)) * width).toFixed(1)},${(y + height - ((value - low) / span) * height).toFixed(1)}`).join(' ')
  return `<polyline points="${points}" fill="none" stroke="${stroke}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>`
}
// A score meter, the interface's inline signal readout.
const meter = (x, y, width, value, max = 100) => `<rect x="${x}" y="${y}" width="${width}" height="6" rx="3" fill="#ffffff1a"/><rect x="${x}" y="${y}" width="${(width * value) / max}" height="6" rx="3" fill="url(#beam)"/>`

const histories = {
  NVDAx: [30, 27, 32, 29, 35, 33, 44, 41, 47, 43, 49, 54, 50, 61, 57, 63, 70, 67, 76, 73, 83, 79, 88, 86],
  AAPLx: [35, 38, 32, 40, 37, 41, 35, 46, 40, 44, 51, 46, 48, 57, 51, 54, 62, 56, 60, 63, 60, 64, 59, 68],
  TSLAX: [73, 68, 77, 72, 61, 68, 61, 64, 53, 59, 51, 55, 61, 49, 52, 44, 49, 43, 51, 44, 47, 39, 46, 42],
  ETH: [29, 34, 28, 31, 42, 39, 46, 41, 52, 49, 43, 50, 59, 54, 66, 60, 71, 64, 68, 74, 68, 81, 77, 85],
}

if (brand.slug !== 'lativox' || brand.name !== 'Lativox') throw new Error('This renderer expects the Lativox identity configuration.')

await Promise.all([mkdir(publicAssets, { recursive: true }), mkdir(socialAssets, { recursive: true })])

// Retire every earlier identity's exports. Generic post names are overwritten below; source
// files outside the generated asset directories are never touched.
const retiredSlugs = ['chainquill', 'cadrivue', 'lensivane', 'kinetide']
const publicNames = ['og.svg', 'og.png', 'mark.svg', 'mark-light.svg', 'favicon.svg', 'favicon-32.png', 'apple-touch-icon.png']
const socialNames = ['avatar.svg', 'avatar.png', 'banner.svg', 'banner.png']
await Promise.all([
  ...retiredSlugs.flatMap(slug => publicNames.map(name => rm(resolve(publicAssets, `${slug}-${name}`), { force: true }))),
  ...retiredSlugs.flatMap(slug => socialNames.map(name => rm(resolve(socialAssets, `${slug}-${name}`), { force: true }))),
])

/* ------------------------------------------------------------------ site assets */
const favicon = svg(100, 100, `${glowDefs}${markTile({ size: 100, radius: 24, glow: true })}`, `${brand.name} hexagonal seal mark on a tile`)
const mark = svg(100, 100, markPath({}), `${brand.name} hexagonal seal mark`, null)
const markLight = svg(100, 100, reverseMarkPath({}), `${brand.name} mark for light surfaces`, null)

const og = svg(1200, 630, `${glowDefs}${dotDefs('ogd', 26, 0.15)}${aurora(190, 60, 460, 'auroraA')}${aurora(1080, 560, 420, 'auroraB')}${dotField('ogd', 0, 0, 1200, 630)}
  ${markTile({ x: 60, y: 46, size: 58, radius: 14 })}
  ${text(134, 86, brand.display, 30, colors.text, 'font-weight="700" letter-spacing="3.4"')}
  ${chip(946, 58, '0x1237')}
  ${label(1140, 76, 'MAINNET', 12, colors.mint, 'text-anchor="end"')}
  ${rule(60, 138, 1080, colors.lineSoft)}
  ${text(58, 268, 'Read wide.', 84, colors.text, 'font-weight="700" letter-spacing="-3"')}
  ${text(58, 356, 'Record the signal.', 84, colors.mint, 'font-weight="700" letter-spacing="-3"')}
  ${text(62, 420, 'An independent research atlas for Robinhood Chain markets.', 21, colors.muted)}
  ${spark(62, 452, 520, 78, histories.NVDAx)}${spark(62, 452, 520, 78, histories.ETH, colors.plasma)}
  ${card(744, 200, 396, 264)}
  ${label(776, 240, 'SAMPLE SET / FIVE ASSETS', 12, colors.faint)}
  ${text(776, 292, 'NVDAx', 22, colors.text, 'font-weight="700"')}${meter(776, 306, 200, 84.6)}${text(986, 308, '84.6', 14, colors.mint, `text-anchor="end" ${numeric}`)}
  ${text(776, 348, 'ETH', 22, colors.text, 'font-weight="700"')}${meter(776, 362, 200, 81.3)}${text(986, 364, '81.3', 14, colors.mint, `text-anchor="end" ${numeric}`)}
  ${text(776, 404, 'AAPLx', 22, colors.text, 'font-weight="700"')}${meter(776, 418, 200, 78.2)}${text(986, 420, '78.2', 14, colors.mint, `text-anchor="end" ${numeric}`)}
  ${text(776, 452, 'Fixed examples, not live scores.', 13, colors.faint)}
  ${footer(1200, 630, 'ROBINHOOD CHAIN PROTOTYPE / ILLUSTRATIVE DATA / NO ORDERS ARE SENT')}`, `${brand.name} | ${brand.tagline}`)

await Promise.all([
  writeFile(resolve(publicAssets, `${brand.slug}-mark.svg`), mark, 'utf8'),
  writeFile(resolve(publicAssets, `${brand.slug}-mark-light.svg`), markLight, 'utf8'),
  writeFile(resolve(publicAssets, `${brand.slug}-favicon.svg`), favicon, 'utf8'),
  sharp(Buffer.from(favicon, 'utf8')).resize(32, 32).png().toFile(resolve(publicAssets, `${brand.slug}-favicon-32.png`)),
  sharp(Buffer.from(favicon, 'utf8')).resize(180, 180).png().toFile(resolve(publicAssets, `${brand.slug}-apple-touch-icon.png`)),
  writeFile(resolve(publicAssets, `${brand.slug}-og.svg`), og, 'utf8'),
  sharp(Buffer.from(og, 'utf8')).png().toFile(resolve(publicAssets, `${brand.slug}-og.png`)),
])

/* ------------------------------------------------------------------ social assets */
const avatar = svg(800, 800, `${glowDefs}${dotDefs('avd', 40, 0.13)}${aurora(160, 130, 420, 'auroraA')}${aurora(660, 690, 380, 'auroraB')}${dotField('avd', 0, 0, 800, 800)}
  ${markTile({ x: 150, y: 150, size: 500, radius: 120, glow: true })}
  ${label(60, 726, brand.display, 20, colors.faint)}
  ${text(740, 726, brand.domain, 18, colors.mint, 'text-anchor="end" font-weight="700"')}`, `${brand.name} X avatar`)

const banner = svg(1500, 500, `${glowDefs}${dotDefs('bnd', 30, 0.14)}${aurora(210, 90, 500, 'auroraA')}${aurora(1340, 470, 430, 'auroraB')}${dotField('bnd', 0, 0, 1500, 500)}
  ${markTile({ x: 64, y: 52, size: 62, radius: 15 })}
  ${text(144, 94, brand.display, 32, colors.text, 'font-weight="700" letter-spacing="3.6"')}
  ${chip(1196, 62, '0x1237')}
  ${label(1436, 80, 'ROBINHOOD CHAIN', 12, colors.mint, 'text-anchor="end"')}
  ${rule(64, 148, 1372, colors.lineSoft)}
  ${text(62, 286, 'Read wide.', 82, colors.text, 'font-weight="700" letter-spacing="-3"')}
  ${text(62, 376, 'Record the signal.', 82, colors.mint, 'font-weight="700" letter-spacing="-3"')}
  ${label(66, 438, 'FIVE SAMPLE ASSETS / NORMALISED SHAPES / LOCAL WATCHLIST / AMOUNT PREVIEW', 14, colors.muted)}
  ${card(1010, 196, 426, 216)}
  ${label(1042, 236, 'SAMPLE SIGNAL READOUT', 12, colors.faint)}
  ${text(1042, 292, 'NVDAx', 24, colors.text, 'font-weight="700"')}${meter(1042, 308, 250, 84.6)}${text(1292, 310, '84.6', 15, colors.mint, `text-anchor="end" ${numeric}`)}
  ${text(1042, 348, 'ETH', 24, colors.text, 'font-weight="700"')}${meter(1042, 364, 250, 81.3)}${text(1292, 366, '81.3', 15, colors.mint, `text-anchor="end" ${numeric}`)}
  ${text(1042, 396, 'Illustrative fixtures only.', 12, colors.faint)}`, `${brand.name} | ${brand.tagline}`)

/* ------------------------------------------------------------------ post artwork */
const postOne = svg(1200, 1200, `${glowDefs}${dotDefs('p1d', 30, 0.15)}${aurora(200, 120, 560, 'auroraA')}${aurora(1080, 1080, 500, 'auroraB')}${dotField('p1d', 0, 0, 1200, 1200)}
  ${markTile({ x: 64, y: 58, size: 62, radius: 15 })}
  ${text(144, 100, brand.display, 32, colors.text, 'font-weight="700" letter-spacing="3.6"')}
  ${label(1136, 100, 'POST 01 / INTRODUCTION', 13, colors.mint, 'text-anchor="end"')}
  ${rule(64, 156, 1072, colors.lineSoft)}
  ${text(60, 336, 'Read wide.', 108, colors.text, 'font-weight="700" letter-spacing="-4"')}
  ${text(60, 452, 'Record the signal.', 108, colors.mint, 'font-weight="700" letter-spacing="-4"')}
  ${text(64, 534, brand.positioning, 25, colors.muted)}
  ${label(64, 592, 'INDEPENDENT / NO ORDERS / NO SIGNATURES', 14, colors.plasma)}
  ${card(64, 640, 520, 400)}
  ${label(96, 690, 'THE WHOLE SAMPLE SET, ONE TABLE', 12, colors.faint)}
  ${text(96, 760, 'NVDAx', 30, colors.text, 'font-weight="700"')}${spark(320, 736, 232, 34, histories.NVDAx)}${text(96, 806, '$180.42', 17, colors.muted, 'font-family="Consolas,monospace"')}${text(552, 806, '+3.82%', 17, colors.mint, `text-anchor="end" ${numeric}`)}
  ${text(96, 874, 'TSLAX', 30, colors.text, 'font-weight="700"')}${spark(320, 850, 232, 34, histories.TSLAX, colors.ember)}${text(96, 920, '$342.78', 17, colors.muted, 'font-family="Consolas,monospace"')}${text(552, 920, '-0.67%', 17, colors.ember, `text-anchor="end" ${numeric}`)}
  ${text(96, 984, 'Fixtures, not quotes.', 14, colors.faint)}
  ${rule(636, 700, 500, colors.lineSoft)}
  ${text(636, 772, 'Five assets side by side.', 36, colors.text, 'font-weight="700" letter-spacing="-1"')}
  ${text(636, 826, 'Stocks, an ETF and crypto, all normalised', 20, colors.muted)}
  ${text(636, 858, 'inside their own window so shapes compare.', 20, colors.muted)}
  ${rule(636, 906, 500, colors.lineSoft)}
  ${text(636, 968, 'A watchlist and a note that stay in', 20, colors.muted)}
  ${text(636, 1000, 'your browser. Nothing is uploaded.', 20, colors.muted)}
  ${footer(1200, 1200, 'ROBINHOOD CHAIN PROTOTYPE / ILLUSTRATIVE DATA')}`, `${brand.name} introduction`)

const rows = [
  ['01', 'Normalise first', 'Each asset is scaled inside its own seven-sample window.'],
  ['02', 'Then compare', 'Overlay every shape at once, or pull one out of the set.'],
  ['03', 'Then record', 'Star what matters and write the note beside it.'],
  ['04', 'Never trade', 'No signature, no routing, no order, anywhere in the build.'],
]
const postTwoRows = rows.map(([index, title, note], position) => {
  const y = 640 + position * 130
  return `${rule(64, y, 1072, colors.lineSoft)}${label(68, y + 44, index, 14, colors.mint)}${text(146, y + 50, title, 34, colors.text, 'font-weight="700" letter-spacing="-1.2"')}${text(150, y + 88, note, 19, colors.muted)}`
}).join('')
const postTwo = svg(1200, 1200, `${glowDefs}${dotDefs('p2d', 30, 0.15)}${aurora(150, 130, 520, 'auroraA')}${aurora(1120, 1020, 470, 'auroraB')}${dotField('p2d', 0, 0, 1200, 1200)}
  ${markTile({ x: 64, y: 58, size: 62, radius: 15 })}
  ${text(144, 100, brand.display, 32, colors.text, 'font-weight="700" letter-spacing="3.6"')}
  ${label(1136, 100, 'POST 02 / METHOD', 13, colors.mint, 'text-anchor="end"')}
  ${rule(64, 156, 1072, colors.lineSoft)}
  ${text(60, 344, 'How to read', 92, colors.text, 'font-weight="700" letter-spacing="-3.4"')}
  ${text(60, 448, 'five shapes at once.', 92, colors.mint, 'font-weight="700" letter-spacing="-3.4"')}
  ${text(64, 528, 'A short method for comparing sample market shapes without fooling yourself.', 24, colors.muted)}
  ${label(64, 586, 'CONTEXT BEFORE SIGNAL', 14, colors.plasma)}
  ${postTwoRows}
  ${footer(1200, 1200, 'ILLUSTRATIVE FIXTURES / NO TRANSACTION IS EVER SENT')}`, `${brand.name} research method`)

const postThree = svg(1200, 1200, `${glowDefs}${dotDefs('p3d', 30, 0.15)}${aurora(1060, 140, 520, 'auroraB')}${aurora(180, 1060, 480, 'auroraA')}${dotField('p3d', 0, 0, 1200, 1200)}
  ${markTile({ x: 64, y: 58, size: 62, radius: 15 })}
  ${text(144, 100, brand.display, 32, colors.text, 'font-weight="700" letter-spacing="3.6"')}
  ${label(1136, 100, 'POST 03 / THE WORKSPACE', 13, colors.mint, 'text-anchor="end"')}
  ${rule(64, 156, 1072, colors.lineSoft)}
  ${text(60, 336, 'One screen,', 100, colors.text, 'font-weight="700" letter-spacing="-3.6"')}
  ${text(60, 444, 'five stops.', 100, colors.mint, 'font-weight="700" letter-spacing="-3.6"')}
  ${text(64, 522, 'The workspace is a console, not a feed. Every view answers one question.', 24, colors.muted)}
  ${card(64, 580, 1072, 452)}
  ${label(104, 630, 'VIEW 01 OVERVIEW', 13, colors.faint)}${text(104, 686, 'Where the whole sample set stands.', 28, colors.text, 'font-weight="700"')}${spark(880, 652, 200, 46, histories.AAPLx)}
  ${rule(104, 722, 992, colors.lineSoft)}
  ${label(104, 766, 'VIEW 02 MARKETS', 13, colors.faint)}${text(104, 822, 'The full table, filterable and sortable.', 28, colors.text, 'font-weight="700"')}${meter(880, 806, 200, 78.2)}
  ${rule(104, 858, 992, colors.lineSoft)}
  ${label(104, 902, 'VIEW 03 COMPARE', 13, colors.faint)}${text(104, 958, 'Five normalised shapes, overlaid.', 28, colors.text, 'font-weight="700"')}${spark(880, 934, 200, 46, histories.ETH, colors.plasma)}
  ${text(104, 1010, 'Watchlist and network continue below the fold.', 18, colors.muted)}
  ${footer(1200, 1200, 'STATIC FIXTURES / ILLUSTRATIVE DATA ONLY')}`, `${brand.name} research workspace`)

async function render(directory, name, artwork, format = 'png') {
  await writeFile(resolve(directory, `${name}.svg`), artwork, 'utf8')
  const pipeline = sharp(Buffer.from(artwork, 'utf8'))
  await (format === 'jpg' ? pipeline.jpeg({ quality: 94 }) : pipeline.png()).toFile(resolve(directory, `${name}.${format}`))
}

/* ------------------------------------------------------------------ post 04: compare */
const compareBox = { x: 64, y: 700, width: 1072, height: 340 }
const compareSeries = [
  { history: histories.NVDAx, color: colors.mint, name: 'NVDAx' },
  { history: histories.AAPLx, color: colors.plasma, name: 'AAPLx' },
  { history: histories.TSLAX, color: colors.ember, name: 'TSLAX' },
  { history: histories.ETH, color: colors.gold, name: 'ETH' },
  { history: [41, 42, 39, 43, 41, 46, 44, 47, 45, 48, 45, 51, 49, 52, 50, 55, 52, 56, 54, 58, 56, 60, 57, 61], color: '#6fa8ff', name: 'SPYx' },
]
const plot = { x: compareBox.x + 40, y: compareBox.y + 34, width: compareBox.width - 80, height: compareBox.height - 96 }
const compareLines = compareSeries.map(series => {
  const low = Math.min(...series.history)
  const high = Math.max(...series.history)
  const span = high - low || 1
  const points = series.history.map((value, index) => `${(plot.x + (index / (series.history.length - 1)) * plot.width).toFixed(1)},${(plot.y + plot.height - ((value - low) / span) * plot.height).toFixed(1)}`).join(' ')
  const endY = plot.y + plot.height - ((series.history.at(-1) - low) / span) * plot.height
  return `<polyline points="${points}" fill="none" stroke="${series.color}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${plot.x + plot.width}" cy="${endY.toFixed(1)}" r="4" fill="${series.color}"/>`
}).join('')
const compareKey = compareSeries.map((series, index) => {
  const x = compareBox.x + 40 + index * 200
  return `<rect x="${x}" y="${compareBox.y + compareBox.height - 42}" width="20" height="4" rx="2" fill="${series.color}"/>${text(x + 28, compareBox.y + compareBox.height - 36, series.name, 17, colors.muted)}`
}).join('')

const postFour = svg(1200, 1200, `${glowDefs}${dotDefs('p4d', 30, 0.15)}${aurora(1080, 160, 520, 'auroraB')}${aurora(200, 1080, 500, 'auroraA')}${dotField('p4d', 0, 0, 1200, 1200)}
  ${markTile({ x: 64, y: 58, size: 62, radius: 15 })}
  ${text(144, 100, brand.display, 32, colors.text, 'font-weight="700" letter-spacing="3.6"')}
  ${label(1136, 100, 'POST 04 / COMPARE', 13, colors.mint, 'text-anchor="end"')}
  ${rule(64, 156, 1072, colors.lineSoft)}
  ${text(60, 340, 'Same market.', 100, colors.text, 'font-weight="700" letter-spacing="-3.6"')}
  ${text(60, 452, 'Five different stories.', 100, colors.mint, 'font-weight="700" letter-spacing="-3.6"')}
  ${text(64, 530, 'Normalise every sample shape inside its own window, then compare them side by side.', 24, colors.muted)}
  ${card(compareBox.x, compareBox.y, compareBox.width, compareBox.height)}
  ${label(compareBox.x + 40, compareBox.y + 30, 'NORMALISED 0-100 / SEVEN SAMPLES', 12, colors.faint)}
  ${compareLines}
  ${compareKey}
  ${text(64, 1120, 'Every line is a fixed example. This is a reading tool, not a quote.', 20, colors.muted)}
  ${footer(1200, 1200, 'ILLUSTRATIVE FIXTURES / NO ORDERS ARE SENT')}`, `${brand.name} shape comparison`)

await render(publicAssets, `${brand.slug}-og`, og)
await render(socialAssets, `${brand.slug}-avatar`, avatar)
await render(socialAssets, `${brand.slug}-banner`, banner)
await render(socialAssets, 'post-01-introduction', postOne, 'jpg')
await render(socialAssets, 'post-02-method', postTwo, 'jpg')
await render(socialAssets, 'post-03-workspace', postThree, 'jpg')
await render(socialAssets, 'post-04-compare', postFour, 'jpg')

/* ------------------------------------------------------------------ brand kit */
const kit = `# ${brand.name} brand kit

**${brand.tagline}**

${brand.name} is an independent research atlas for illustrative markets on Robinhood Chain. It reads five sample assets in one table, compares normalised seven-sample shapes, keeps a watchlist and a research note in the browser, and builds an illustrative amount preview. No transaction is ever signed, routed or sent.

## Identity

- Display name: **${brand.name}**
- Wordmark: **${brand.display}**
- URL slug: **${brand.slug}**
- Tagline: **${brand.tagline}**
- Positioning: ${brand.positioning}

| Token | Hex | Role |
| --- | --- | --- |
| Ink | \`${colors.ink}\` | Page base |
| Shell / Panel | \`${colors.shell}\` / \`${colors.panel}\` | Rails, panels, table frames |
| Raised | \`${colors.panel2}\` | Sheets, dialogs, drawer |
| Paper text | \`${colors.text}\` | Primary text |
| Muted / Faint | \`${colors.muted}\` / \`${colors.faint}\` | Secondary text, meta |
| Mint | \`${colors.mint}\` | Primary signal, primary action, positive change |
| Plasma | \`${colors.plasma}\` | Secondary series, secondary structure |
| Ember | \`${colors.ember}\` | Negative change, errors |
| Brass | \`${colors.gold}\` | Saved state, chain ids, annotations |

## The mark

A **hexagonal seal with a diagonal inscription bar**. The hexagon shell is the block; the plasma bar is the mark recorded inside it; the diagonal is what stops the silhouette from reading as a generic concentric-hexagon logo. Three flat shapes, one silhouette, drawn on a 100 x 100 artboard:

- hexagon shell: centre (50, 50), circumradius 40.5, stroke 15, corner joins mitred;
- inscription bar: a 50-unit diagonal from (25, 75) to (75, 25), stroke 11, clipped to the shell.

Clear space is one shell stroke on all sides. The mark holds from 16 px up in both polarities; below 16 px use the favicon tile. Never recolour the shell and the bar independently.

## Channels

Target domain: **${brand.domain}**  
Target X handle: **${brand.handle}**

The domain and the handle are **not registered and not owned by this project**. Availability evidence is in \`output/rebrand-2026-v3/brand-research/availability.md\` (\`.xyz\`, \`.com\`, \`.io\` and \`.app\` were all unregistered on 2026-10-11, and the handle returned the not-found response). Availability can change at any moment. Do not publish links or imply ownership until authorised registrations are complete. Everything here is an unpublished local draft.

## Generated assets

Site:

- \`website/public/assets/${brand.slug}-mark.svg\`, \`${brand.slug}-mark-light.svg\`
- \`website/public/assets/${brand.slug}-favicon.svg\`, \`${brand.slug}-favicon-32.png\`, \`${brand.slug}-apple-touch-icon.png\`
- \`website/public/assets/${brand.slug}-og.svg\`, \`${brand.slug}-og.png\` (1200 x 630)

Social:

- \`twitter/${brand.slug}-avatar.svg\` / \`.png\` (800 x 800)
- \`twitter/${brand.slug}-banner.svg\` / \`.png\` (1500 x 500)
- \`twitter/post-01-introduction.svg\` / \`.jpg\`, \`post-02-method\`, \`post-03-workspace\`, \`post-04-compare\` (1200 x 1200)
- \`twitter/posts.md\` - the posting plan, copy and per-image notes

Run \`npm run assets\` inside \`website/\` to regenerate every file from \`website/src/data/brand.js\`.

All promoted values are static illustrative data. Wallet access is optional, no transaction is signed or sent, and this prototype makes no investment, profit or return claim.
`
await writeFile(resolve(socialAssets, 'brand-kit.md'), kit, 'utf8')

console.log(`Rendered the ${brand.name} mark set, OG card, social assets and brand kit.`)
