// Static fixtures for the Lativox research atlas. Illustrative examples, never live quotes.
export const markets = [
  { symbol: 'NVDAx', name: 'NVIDIA Corp.', price: 180.42, change: 3.82, volume: '$18.4M', category: 'Stocks', score: 84.6, monogram: 'N', tone: 'nvidia', history: [30, 27, 32, 29, 35, 33, 44, 41, 47, 43, 49, 54, 50, 61, 57, 63, 70, 67, 76, 73, 83, 79, 88, 86] },
  { symbol: 'AAPLx', name: 'Apple Inc.', price: 229.16, change: 1.24, volume: '$11.8M', category: 'Stocks', score: 78.2, monogram: 'A', tone: 'apple', history: [35, 38, 32, 40, 37, 41, 35, 46, 40, 44, 51, 46, 48, 57, 51, 54, 62, 56, 60, 63, 60, 64, 59, 68] },
  { symbol: 'TSLAX', name: 'Tesla, Inc.', price: 342.78, change: -0.67, volume: '$9.2M', category: 'Stocks', score: 72.4, monogram: 'T', tone: 'tesla', history: [73, 68, 77, 72, 61, 68, 61, 64, 53, 59, 51, 55, 61, 49, 52, 44, 49, 43, 51, 44, 47, 39, 46, 42] },
  { symbol: 'ETH', name: 'Ether', price: 2501.9, change: 2.06, volume: '$26.1M', category: 'Crypto', score: 81.3, monogram: 'E', tone: 'ether', history: [29, 34, 28, 31, 42, 39, 46, 41, 52, 49, 43, 50, 59, 54, 66, 60, 71, 64, 68, 74, 68, 81, 77, 85] },
  { symbol: 'SPYx', name: 'S&P 500 ETF', price: 641.3, change: 0.48, volume: '$6.7M', category: 'ETFs', score: 68.9, monogram: 'S', tone: 'spy', history: [41, 42, 39, 43, 41, 46, 44, 47, 45, 48, 45, 51, 49, 52, 50, 55, 52, 56, 54, 58, 56, 60, 57, 61] },
]

export const categories = ['All', 'Stocks', 'ETFs', 'Crypto']

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 })
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })

export const money = value => currency.format(value)
export const compactMoney = value => `$${compact.format(value)}`
export const signed = value => `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
// Session extent of a fixture's sample history, used for the "range" readout.
export const range = history => {
  const low = Math.min(...history)
  const high = Math.max(...history)
  return { low, high, spread: high - low }
}
// Normalise a fixture to 0-100 within its own sample window so shapes can be compared.
export const normalized = history => {
  const low = Math.min(...history)
  const high = Math.max(...history)
  return history.map(value => (high === low ? 50 : ((value - low) / (high - low)) * 100))
}
