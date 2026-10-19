// Product identity. Independent of the underlying network and of Robinhood Markets, Inc.
export const brand = Object.freeze({
  name: 'Lativox',
  display: 'LATIVOX',
  slug: 'lativox',
  tagline: 'Read wide. Record the signal.',
  positioning: 'An independent research atlas for tokenized markets on Robinhood Chain.',
  network: 'Robinhood Chain',
  chainId: 4663,
  domain: 'lativox.xyz',
  handle: '@lativox',
  website: 'https://lativox.xyz',
  social: 'https://x.com/lativox',
  channelsActive: false,
  mark: '/assets/lativox-mark.svg',
  markLight: '/assets/lativox-mark-light.svg',
  disclaimer: 'Independent prototype. Not affiliated with Robinhood Markets, Inc.',
})

// The skin's palette lives in src/style.css; these are the canonical values that the asset
// renderer (scripts/render-assets.mjs) shares with the stylesheet.
export const palette = Object.freeze({
  ink: '#08070f',
  void: '#08070f',
  surface: '#12111f',
  surface2: '#191830',
  mint: '#4ff0c1',
  plasma: '#a06bff',
  ember: '#ff7a59',
  gold: '#f2c14e',
  paper: '#f5f2e9',
})

export const storageKeys = Object.freeze({
  watchlist: 'lativox-watchlist',
  memo: 'lativox-memo-saved',
})

// Read-only compatibility with earlier browser data. Never displayed as product identity.
export const legacyStorageKeys = Object.freeze({
  watchlist: ['chainquill-watchlist', 'cadrivue-watchlist', 'kinetide-watchlist', 'lensivane-watchlist', 'clariweft-watchlist', 'cernivue-watchlist', 'loometric-watchlist', 'siftider-watchlist', 'siftide-watchlist'],
  memo: ['chainquill-memo-saved', 'cadrivue-memo-saved', 'kinetide-memo-saved', 'lensivane-memo-saved', 'clariweft-memo-saved', 'cernivue-memo-saved', 'loometric-memo-saved', 'siftider-memo-saved', 'siftide-memo-saved'],
})
