import sharp from 'sharp'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawnSync } from 'node:child_process'
import { brand } from '../src/data/brand.js'

// One source for the Chainquill Robinhood Chain identity. This file is independent of generated
// bundles and can run from website/ or website/a706/.
const scriptDir = dirname(fileURLToPath(import.meta.url))
const scriptWebsite = resolve(scriptDir, '..')
const isMirror = basename(scriptWebsite).toLowerCase() === 'a706'
const workspace = isMirror ? resolve(scriptWebsite, '..', '..') : resolve(scriptWebsite, '..')
const publicAssets = resolve(scriptWebsite, 'public/assets')
const socialAssets = resolve(workspace, 'twitter')
const videoAssets = resolve(workspace, 'output/rebrand-20261010-chainquill/assets')

const colors = Object.freeze({
  void: '#04060b', panel: '#0a1220', panel2: '#0d1727', rail: '#101d31',
  text: '#e8f1ff', muted: '#93a7c0', faint: '#6b87a6',
  accent: '#c8f24a', signal: '#8b5cf6', data: '#4fd8e8',
  line: '#17233a', lineStrong: '#2b3d5e',
})
const sans = 'Arial, Helvetica, sans-serif'
const monospace = 'Consolas, Courier New, monospace'
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;')
const text = (x, y, value, size, fill = colors.text, extra = '', family = sans) => `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" fill="${fill}"${extra ? ` ${extra}` : ''}>${esc(value)}</text>`
const mono = (x, y, value, size = 14, fill = colors.muted, extra = '') => text(x, y, value, size, fill, `letter-spacing="2.4"${extra ? ` ${extra}` : ''}`, monospace)
const rule = (x, y, width, stroke = colors.line) => `<path d="M${x} ${y}h${width}" fill="none" stroke="${stroke}"/>`
const svg = (width, height, body, title, background = colors.void) => `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(title)}"><title>${esc(title)}</title>${background ? `<rect width="${width}" height="${height}" fill="${background}"/>` : ''}${body}</svg>`
const glowDefs = `<defs><filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="6" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>`

// A faint block lattice sits behind every Chainquill surface: the chain is a grid of blocks.
const latticeDefs = (id, size, stroke = '#4a6ea6', opacity = 0.16) => `<defs><pattern id="${id}" width="${size}" height="${size}" patternUnits="userSpaceOnUse"><path d="M${size} 0H0V${size}" fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="1"/></pattern></defs>`
const lattice = (id, x, y, width, height) => `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="url(#${id})"/>`

// A row of linked blocks, used as a structural divider.
const blockChain = (x, y, count = 6, gap = 22, size = 8, active = 0) => Array.from({ length: count }, (_, index) => {
  const cx = x + index * gap
  const fill = index === active ? colors.accent : colors.rail
  const stroke = index === active ? colors.accent : colors.lineStrong
  return `<rect x="${cx}" y="${y}" width="${size}" height="${size}" rx="1.5" fill="${fill}" stroke="${stroke}"/>`
}).join('')

// A mono chip for chain facts, e.g. 0x1237.
const chip = (x, y, value, accent = false) => {
  const width = value.length * 8.4 + 18
  const stroke = accent ? '#c8f24a80' : colors.lineStrong
  const fill = accent ? '#c8f24a1f' : '#0b1424'
  const color = accent ? colors.accent : colors.data
  return `<rect x="${x}" y="${y}" width="${width}" height="24" rx="3" fill="${fill}" stroke="${stroke}"/>${text(x + 9, y + 16, value, 12, color, 'letter-spacing="1.6"', monospace)}`
}

// A small connected node cluster: the chain seen as linked pairs.
const nodeRun = (x, y, width, count = 5, color = colors.data) => {
  const step = width / (count - 1)
  const dots = Array.from({ length: count }, (_, index) => `<circle cx="${x + index * step}" cy="${y}" r="${index % 2 ? 3 : 4.5}" fill="${index % 2 ? colors.rail : color}" stroke="${index % 2 ? color : 'none'}"/>`).join('')
  return `<path d="M${x} ${y}h${width}" stroke="${colors.line}" stroke-width="1"/>${dots}`
}

// The primary mark: a block ring, a chain node and a quill nib tail. Non-letter silhouette
// that still reads as the Chainquill "Q" at favicon sizes.
const quillMark = ({ x = 0, y = 0, scale = 1, tile = colors.panel, light = false, glow = false } = {}) => {
  const ring = light ? colors.void : colors.accent
  const tail = light ? colors.void : colors.signal
  const node = light ? colors.signal : colors.data
  const slit = tile === 'none' ? (light ? colors.text : colors.void) : tile
  const blur = glow ? ' filter="url(#glow)"' : ''
  const tileShape = tile === 'none' ? '' : `<rect x="3" y="3" width="94" height="94" rx="26" fill="${tile}"/>`
  return `<g transform="translate(${x} ${y}) scale(${scale})">${tileShape}<rect x="12" y="12" width="61" height="61" rx="20" fill="none" stroke="${ring}" stroke-width="15"${blur}/><circle cx="43" cy="43" r="8" fill="${node}"${blur}/><path d="M55 77 78 54 94 94Z" fill="${tail}"${blur}/><path d="M72 76 88 90" stroke="${slit}" stroke-width="6" stroke-linecap="round"${blur}/></g>`
}
const wordmark = (x, y, scale = 1) => `${quillMark({ x, y, scale: 0.62 * scale, tile: colors.panel2 })}${text(x + 74 * scale, y + 45 * scale, brand.name, 38 * scale, colors.text, 'font-weight="700" letter-spacing="-1.2"')}`
const footer = (width, height, note) => `${rule(64, height - 94, width - 128)}${mono(64, height - 47, note, 13, colors.faint)}${text(width - 64, height - 47, brand.name, 17, colors.text, 'text-anchor="end" font-weight="700"')}`
const card = (x, y, width, height, stroke = colors.line) => `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="6" fill="${colors.panel}" stroke="${stroke}"/>`
const brackets = (x, y, width, height, size = 16, stroke = colors.lineStrong) => `<path d="M${x} ${y + size}V${y}h${size}M${x + width - size} ${y}h${size}v${size}M${x} ${y + height - size}v${size}h${size}M${x + width} ${y + height - size}v${size}h-${size}" fill="none" stroke="${stroke}" stroke-width="1.4"/>`

if (brand.slug !== 'chainquill' || brand.name !== 'Chainquill') throw new Error('This renderer expects the Chainquill identity configuration.')
await Promise.all([mkdir(publicAssets, { recursive: true }), mkdir(socialAssets, { recursive: true }), mkdir(videoAssets, { recursive: true })])

// Remove exports from every preceding identity. Generic post names are overwritten below;
// source files outside the generated asset directories stay untouched.
const retiredSlugs = ['cadrivue', 'lensivane', 'kinetide']
const publicNames = ['og.svg', 'og.png', 'mark.svg', 'mark-light.svg', 'favicon.svg', 'favicon-32.png', 'apple-touch-icon.png']
const socialNames = ['avatar.svg', 'avatar.png', 'banner.svg', 'banner.png']
await Promise.all([
  ...retiredSlugs.flatMap(slug => publicNames.map(name => rm(resolve(publicAssets, `${slug}-${name}`), { force: true }))),
  ...retiredSlugs.flatMap(slug => socialNames.map(name => rm(resolve(socialAssets, `${slug}-${name}`), { force: true }))),
])

const favicon = svg(100, 100, `${glowDefs}${quillMark({ tile: colors.void, glow: true })}`, `${brand.name} block ring and quill nib mark`)
const mark = svg(100, 100, quillMark({ tile: 'none' }), `${brand.name} block ring and quill nib mark`, null)
const markLight = svg(100, 100, quillMark({ tile: 'none', light: true }), `${brand.name} light quill nib mark`, null)
await Promise.all([
  writeFile(resolve(publicAssets, `${brand.slug}-mark.svg`), mark, 'utf8'),
  writeFile(resolve(publicAssets, `${brand.slug}-mark-light.svg`), markLight, 'utf8'),
  writeFile(resolve(publicAssets, `${brand.slug}-favicon.svg`), favicon, 'utf8'),
  sharp(Buffer.from(favicon, 'utf8')).resize(32, 32).png().toFile(resolve(publicAssets, `${brand.slug}-favicon-32.png`)),
  sharp(Buffer.from(favicon, 'utf8')).resize(180, 180).png().toFile(resolve(publicAssets, `${brand.slug}-apple-touch-icon.png`)),
])

const avatar = svg(800, 800, `${glowDefs}${latticeDefs('av', 40, '#4a6ea6', 0.14)}${lattice('av', 0, 0, 800, 800)}${quillMark({ x: 24, y: 24, scale: 7.5, tile: colors.panel, glow: true })}${brackets(28, 28, 744, 744, 46)}${mono(60, 740, 'CHAINQUILL', 20, colors.faint)}${blockChain(660, 726, 5, 22, 9, 2)}`, `${brand.name} X avatar`)

const banner = svg(1500, 500, `${glowDefs}${latticeDefs('bn', 50)}${lattice('bn', 0, 0, 1500, 500)}${wordmark(56, 44, 0.9)}${chip(1176, 60, '0x1237', true)}${mono(1440, 78, 'ROBINHOOD CHAIN', 13, colors.data, 'text-anchor="end"')}${rule(56, 132, 1384)}${text(60, 262, 'Read the chain.', 76, colors.text, 'font-weight="700" letter-spacing="-2.6"')}${text(60, 348, 'Note the signal.', 76, colors.accent, 'font-weight="700" letter-spacing="-2.6"')}${mono(64, 424, 'ASSETS / WATCHLIST / ORDER PREVIEWS', 15, colors.muted)}${nodeRun(64, 452, 690, 12)}${card(1092, 168, 316, 236)}${brackets(1092, 168, 316, 236)}${quillMark({ x: 1150, y: 208, scale: 1.9, tile: 'none', glow: true })}${mono(1120, 384, 'SAMPLE FIXTURES ONLY', 13, colors.faint)}`, `${brand.name} | ${brand.tagline}`)

const og = svg(1200, 630, `${glowDefs}${latticeDefs('og', 44)}${lattice('og', 0, 0, 1200, 630)}${wordmark(54, 34)}${chip(886, 52, '0x1237', true)}${mono(1136, 70, 'ROBINHOOD CHAIN', 12, colors.data, 'text-anchor="end"')}${rule(64, 120, 1072)}${text(60, 250, 'Read the chain.', 78, colors.text, 'font-weight="700" letter-spacing="-2.6"')}${text(60, 338, 'Note the signal.', 78, colors.accent, 'font-weight="700" letter-spacing="-2.6"')}${text(64, 402, brand.positioning, 22, colors.muted)}${nodeRun(64, 442, 560, 10)}${card(846, 176, 290, 250)}${brackets(846, 176, 290, 250)}${quillMark({ x: 904, y: 214, scale: 1.85, tile: 'none', glow: true })}${mono(876, 400, 'NO TRADES ARE SENT', 12, colors.faint)}${footer(1200, 630, 'ROBINHOOD CHAIN PROTOTYPE / ILLUSTRATIVE DATA')}`, `${brand.name} | ${brand.tagline}`)

const post1 = svg(1200, 1200, `${glowDefs}${latticeDefs('p1', 50)}${lattice('p1', 0, 0, 1200, 1200)}${wordmark(53, 40)}${mono(1136, 82, 'BLOCK 001 / GENESIS NOTE', 13, colors.data, 'text-anchor="end"')}${rule(64, 126, 1072)}${text(57, 286, 'Read the chain.', 100, colors.text, 'font-weight="700" letter-spacing="-3.4"')}${text(57, 396, 'Note the signal.', 100, colors.accent, 'font-weight="700" letter-spacing="-3.4"')}${text(64, 470, brand.positioning, 26, colors.muted)}${mono(64, 522, 'AN INDEPENDENT RESEARCH ATLAS', 14, colors.signal)}${card(64, 556, 468, 428)}${brackets(64, 556, 468, 428)}${mono(96, 602, 'SAMPLE FIXTURES / NO SIGNING', 13, colors.faint)}${quillMark({ x: 158, y: 640, scale: 2.9, tile: 'none', glow: true })}${rule(600, 620, 536)}${text(600, 690, 'Scan markets', 40, colors.text, 'font-weight="700" letter-spacing="-1.2"')}${text(600, 742, 'Keep a watchlist', 40, colors.accent, 'font-weight="700" letter-spacing="-1.2"')}${text(600, 794, 'Compare flows', 40, colors.text, 'font-weight="700" letter-spacing="-1.2"')}${text(600, 846, 'Preview a what-if', 40, colors.signal, 'font-weight="700" letter-spacing="-1.2"')}${rule(600, 892, 536)}${nodeRun(600, 936, 536, 8)}${text(600, 1000, 'Five illustrative assets on Robinhood Chain.', 22, colors.muted)}${footer(1200, 1200, 'ROBINHOOD CHAIN PROTOTYPE / ILLUSTRATIVE DATA')}`, `${brand.name} Robinhood Chain introduction`)

const rows = [['01', 'Scan wider.', 'Search five sample assets by name or symbol.'], ['02', 'Keep a note.', 'Save a watchlist and a research note locally.'], ['03', 'Change the route.', 'Compare two normalised sample trends.']]
const post2Rows = rows.map(([number, title, note], index) => {
  const y = 592 + index * 156
  return `${rule(64, y, 1072)}${mono(67, y + 58, number, 15, colors.accent)}<circle cx="152" cy="${y + 52}" r="6" fill="${colors.rail}" stroke="${colors.data}" stroke-width="1.5"/>${text(184, y + 62, title, 42, colors.text, 'font-weight="700" letter-spacing="-1.2"')}${text(188, y + 104, note, 21, colors.muted)}<path d="M1080 ${y + 62}h40m-13-12 13 12-13 12" fill="none" stroke="${colors.accent}" stroke-width="2"/>`
}).join('')
const post2 = svg(1200, 1200, `${glowDefs}${latticeDefs('p2', 50)}${lattice('p2', 0, 0, 1200, 1200)}${wordmark(53, 40)}${mono(1136, 82, 'BLOCK 002 / METHOD', 13, colors.data, 'text-anchor="end"')}${rule(64, 126, 1072)}${text(57, 282, 'A method for', 90, colors.text, 'font-weight="700" letter-spacing="-3"')}${text(57, 386, 'reading a move.', 90, colors.accent, 'font-weight="700" letter-spacing="-3"')}${text(64, 468, 'Three habits for reading an illustrative market move.', 25, colors.muted)}${mono(64, 522, 'CONTEXT BEFORE SIGNAL', 14, colors.signal)}${post2Rows}${footer(1200, 1200, 'EVM PROTOTYPE / ILLUSTRATIVE DATA')}`, `${brand.name} research method`)

const terminalRows = [['01', 'Markets', 'Find an asset. Follow the sample flow.'], ['02', 'Watchlist', 'Keep a focused list on your device.'], ['03', 'Comparison', 'Compare two normalised sample trends.'], ['04', 'Order preview', 'Export a local, illustrative preview.']]
const post3Rows = terminalRows.map(([number, title, note], index) => {
  const y = 574 + index * 112
  return `${rule(468, y, 668)}${mono(470, y + 42, number, 13, colors.data)}${text(524, y + 47, title, 29, colors.text, 'font-weight="700" letter-spacing="-.8"')}${text(527, y + 84, note, 19, colors.muted)}`
}).join('')
const post3 = svg(1200, 1200, `${glowDefs}${latticeDefs('p3', 50)}${lattice('p3', 0, 0, 1200, 1200)}${wordmark(53, 40)}${mono(1136, 82, 'BLOCK 003 / WORKSPACE', 13, colors.data, 'text-anchor="end"')}${rule(64, 126, 1072)}${text(57, 282, 'Your market view,', 86, colors.text, 'font-weight="700" letter-spacing="-2.8"')}${text(57, 382, 'block by block.', 86, colors.accent, 'font-weight="700" letter-spacing="-2.8"')}${text(64, 466, 'One desk for scanning, saving and reviewing.', 25, colors.muted)}${card(64, 552, 356, 460)}${brackets(64, 552, 356, 460)}${mono(92, 602, 'THE RESEARCH DESK', 13, colors.signal)}${quillMark({ x: 152, y: 640, scale: 2.6, tile: 'none', glow: true })}${chip(96, 926, '0x1237', true)}${post3Rows}${footer(1200, 1200, 'ILLUSTRATIVE DATA / NO TRADES ARE SENT')}`, `${brand.name} research workspace`)

async function render(directory, name, artwork, format = 'png') {
  await writeFile(resolve(directory, `${name}.svg`), artwork, 'utf8')
  const pipeline = sharp(Buffer.from(artwork, 'utf8'))
  await (format === 'jpg' ? pipeline.jpeg({ quality: 95 }) : pipeline.png()).toFile(resolve(directory, `${name}.${format}`))
}
await render(publicAssets, `${brand.slug}-og`, og)
await render(socialAssets, `${brand.slug}-avatar`, avatar)
await render(socialAssets, `${brand.slug}-banner`, banner)
await render(socialAssets, 'post-01-introduction', post1, 'jpg')
await render(socialAssets, 'post-02-method', post2, 'jpg')
await render(socialAssets, 'post-03-workspace', post3, 'jpg')

const kit = `# ${brand.name} brand kit

**${brand.tagline}**

${brand.name} is an independent research atlas for scanning sample markets, keeping a local watchlist, comparing flows, and reviewing illustrative order previews on Robinhood Chain.

## Identity

- Display name: **${brand.name}**
- URL slug: **${brand.slug}**
- Tagline: **${brand.tagline}**
- Primary color: \`${colors.accent}\` acid lime
- Chain accent: \`${colors.signal}\` violet
- Data trace: \`${colors.data}\` cyan
- Background: \`${colors.void}\` void black

The mark is a block ring with a chain node and a quill nib tail: a blockchain block rendered as a letterform Q for Chainquill, with the nib as the writing instrument. The mark is a single flat silhouette with three flat colors, so it keeps its shape from 16 px to billboard size. Keep the clear space of one block ring on all sides. Use the reverse mark on light surfaces. ${brand.name} is an independent prototype and is not affiliated with Robinhood Markets, Inc.

## Channels

Target domain: **${brand.domain}**  
Target X handle: **${brand.handle}**

The domain and account are **not registered or owned by this project**. Availability checks are recorded in the rebrand research notes; no profile confirms ownership. Availability can change immediately. Do not publish links or imply ownership until authorised registrations are complete. These local drafts are unpublished.

## Generated assets

- \`website/public/assets/${brand.slug}-mark.svg\`, \`${brand.slug}-mark-light.svg\`
- \`website/public/assets/${brand.slug}-favicon.svg\`, \`${brand.slug}-favicon-32.png\`, \`${brand.slug}-apple-touch-icon.png\`
- \`website/public/assets/${brand.slug}-og.svg\`, \`${brand.slug}-og.png\` (1200 x 630)
- \`twitter/${brand.slug}-avatar.svg/.png\` (800 x 800)
- \`twitter/${brand.slug}-banner.svg/.png\` (1500 x 500)
- \`twitter/post-01-introduction.svg/.jpg\`, \`post-02-method.svg/.jpg\`, \`post-03-workspace.svg/.jpg\` (1200 x 1200)

Run \`npm run assets\` inside \`website/\` to regenerate every file from \`website/src/data/brand.js\`.

All promoted values are static illustrative data. Wallet access remains optional, no transaction is signed or sent, and this prototype makes no investment or return claim.
`
await writeFile(resolve(socialAssets, 'brand-kit.md'), kit, 'utf8')

if (process.argv.includes('--video')) {
  const videoPath = resolve(videoAssets, `${brand.slug}-intro.mp4`)
  const result = spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-loop', '1', '-i', resolve(socialAssets, 'post-01-introduction.jpg'), '-vf', "scale=2400:2400,zoompan=z='1+0.000055*on':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=240:s=1200x1200:fps=30,format=yuv420p", '-t', '8', '-c:v', 'libx264', '-preset', 'medium', '-crf', '19', '-movflags', '+faststart', '-an', videoPath], { stdio: 'inherit' })
  if (result.error) throw result.error
  if (result.status !== 0) throw new Error(`FFmpeg exited with ${result.status}`)
  console.log(`Rendered ${videoPath}`)
}
console.log(`Rendered ${brand.name} Robinhood Chain identity, OG card, social assets, and brand kit.`)
