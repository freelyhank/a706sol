// Product identity is independent from the underlying network and Robinhood Markets, Inc.
export const brand = Object.freeze({
  name: 'Chainquill',
  slug: 'chainquill',
  tagline: 'Read the chain. Note the signal.',
  positioning: 'An independent research atlas for Robinhood Chain markets.',
  network: 'Robinhood Chain',
  chainId: 4663,
  domain: 'chainquill.xyz',
  handle: '@chainquill',
  website: 'https://chainquill.xyz',
  social: 'https://x.com/chainquill',
  channelsActive: false,
  mark: '/assets/chainquill-mark.svg',
  markLight: '/assets/chainquill-mark-light.svg',
  disclaimer: 'Independent prototype. Not affiliated with Robinhood Markets, Inc.',
})

export const storageKeys = Object.freeze({
  watchlist: 'chainquill-watchlist',
  memo: 'chainquill-memo-saved',
})

// Read-only compatibility with earlier browser data. Never displayed as product identity.
export const legacyStorageKeys = Object.freeze({
  watchlist: ['cadrivue-watchlist', 'kinetide-watchlist', 'lensivane-watchlist', 'clariweft-watchlist', 'cernivue-watchlist', 'loometric-watchlist', 'siftider-watchlist', 'siftide-watchlist'],
  memo: ['cadrivue-memo-saved', 'kinetide-memo-saved', 'lensivane-memo-saved', 'clariweft-memo-saved', 'cernivue-memo-saved', 'loometric-memo-saved', 'siftider-memo-saved', 'siftide-memo-saved'],
})
