// Robinhood Chain network settings for the client wallet integration.
// The app only reads network metadata; it never signs or submits transactions.
const env = import.meta.env || {}
const configuredRpcUrl = String(env.VITE_ROBINHOOD_RPC_URL || '').trim()
const useTestnet = String(env.VITE_ROBINHOOD_NETWORK || 'mainnet').toLowerCase() === 'testnet'

export const ROBINHOOD_NETWORKS = Object.freeze({
  mainnet: Object.freeze({
    id: 'mainnet',
    chainId: 4663,
    chainIdHex: '0x1237',
    name: 'Robinhood Chain',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrl: configuredRpcUrl || 'https://rpc.mainnet.chain.robinhood.com',
    explorerUrl: 'https://robinhoodchain.blockscout.com',
    docsUrl: 'https://docs.robinhood.com/chain/connecting',
  }),
  testnet: Object.freeze({
    id: 'testnet',
    chainId: 46630,
    chainIdHex: '0xb626',
    name: 'Robinhood Chain Testnet',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'ETH', decimals: 18 },
    rpcUrl: configuredRpcUrl || 'https://rpc.testnet.chain.robinhood.com/rpc',
    explorerUrl: 'https://explorer.testnet.chain.robinhood.com',
    docsUrl: 'https://docs.robinhood.com/chain/connecting',
  }),
})

export const robinhoodConfig = Object.freeze({
  ...(useTestnet ? ROBINHOOD_NETWORKS.testnet : ROBINHOOD_NETWORKS.mainnet),
  network: useTestnet ? 'testnet' : 'mainnet',
  transactionsEnabled: false,
})

