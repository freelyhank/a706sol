import { computed, onMounted, onUnmounted, ref } from 'vue'
import { robinhoodConfig } from '../data/robinhood.js'

const ADDRESS_PATTERN = /^0x[\da-f]{40}$/i

export function useWallet() {
  const address = ref('')
  const chainId = ref('')
  const pending = ref(false)
  const networkPending = ref(false)
  const walletError = ref('')
  const networkMessage = ref('')
  let provider
  let sessionDisconnected = false
  let accountRevision = 0
  let chainRevision = 0
  let sessionRevision = 0
  let disposed = false

  const shortAddress = computed(() => address.value ? `${address.value.slice(0, 6)}...${address.value.slice(-4)}` : '')

  function updateAccounts(accounts) {
    if (!sessionDisconnected) address.value = Array.isArray(accounts) && ADDRESS_PATTERN.test(accounts[0] || '') ? accounts[0] : ''
  }
  function updateChain(value) { chainId.value = typeof value === 'string' ? value.toLowerCase() : '' }
  function clearError() { walletError.value = ''; networkMessage.value = '' }
  function accountsChanged(accounts) {
    accountRevision++
    updateAccounts(accounts)
    if (address.value) void readChain()
    else { chainRevision++; chainId.value = ''; networkMessage.value = '' }
  }
  function chainChanged(value) {
    chainRevision++
    if (!sessionDisconnected) updateChain(value)
    networkMessage.value = ''
  }
  function providerDisconnected() {
    accountRevision++
    chainRevision++
    sessionRevision++
    address.value = ''
    chainId.value = ''
    clearError()
  }
  function errorMessage(error, task) {
    if (error?.code === 4001 || /reject|denied|cancel/i.test(error?.message || '')) return `${task} was cancelled. You can try again whenever you are ready.`
    if (error?.code === -32002 || /already pending|already processing/i.test(error?.message || '')) return 'A request is already open in your wallet. Check the extension to continue.'
    return `${task} could not be completed. Check your EVM wallet and try again.`
  }
  function removeListeners() {
    provider?.removeListener?.('accountsChanged', accountsChanged)
    provider?.removeListener?.('chainChanged', chainChanged)
    provider?.removeListener?.('disconnect', providerDisconnected)
  }
  function findProvider({ reportError = true } = {}) {
    if (typeof window === 'undefined' || !window.ethereum?.request) {
      if (reportError) walletError.value = 'No browser wallet found. Install an EVM wallet, then reload this page to connect.'
      return null
    }
    if (provider !== window.ethereum) {
      removeListeners()
      accountRevision++
      chainRevision++
      sessionRevision++
      provider = window.ethereum
      provider.on?.('accountsChanged', accountsChanged)
      provider.on?.('chainChanged', chainChanged)
      provider.on?.('disconnect', providerDisconnected)
    }
    return provider
  }
  async function readChain() {
    const revision = chainRevision
    const requestProvider = provider
    try {
      const value = await requestProvider.request({ method: 'eth_chainId' })
      if (!disposed && provider === requestProvider && revision === chainRevision) updateChain(value)
    } catch {
      if (!disposed && provider === requestProvider && revision === chainRevision) chainId.value = ''
    }
  }
  async function connect() {
    if (pending.value) return
    clearError()
    const requestProvider = findProvider()
    if (!requestProvider) return
    pending.value = true
    sessionDisconnected = false
    const revision = ++accountRevision
    try {
      const accounts = await requestProvider.request({ method: 'eth_requestAccounts' })
      if (disposed || revision !== accountRevision || provider !== requestProvider) return
      updateAccounts(accounts)
      if (!address.value) walletError.value = 'No account was shared. Unlock your wallet and try again.'
      else await readChain()
    } catch (error) {
      if (!disposed && revision === accountRevision) walletError.value = errorMessage(error, 'Connection')
    } finally {
      pending.value = false
    }
  }
  async function addNetwork() {
    if (networkPending.value) return
    clearError()
    const requestProvider = findProvider()
    if (!requestProvider) return
    networkPending.value = true
    const revision = ++sessionRevision
    const isCurrentRequest = () => !disposed && revision === sessionRevision && provider === requestProvider
    try {
      await requestProvider.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: robinhoodConfig.chainIdHex,
          chainName: robinhoodConfig.name,
          nativeCurrency: robinhoodConfig.nativeCurrency,
          rpcUrls: [robinhoodConfig.rpcUrl],
          blockExplorerUrls: [robinhoodConfig.explorerUrl],
        }],
      })
      if (!isCurrentRequest()) return
      await readChain()
      if (!isCurrentRequest()) return
      networkMessage.value = chainId.value === robinhoodConfig.chainIdHex
        ? `${robinhoodConfig.name} is selected in your wallet.`
        : `Network added. Select ${robinhoodConfig.name} in your wallet to use it.`
    } catch (error) {
      if (isCurrentRequest()) walletError.value = errorMessage(error, 'Network request')
    } finally {
      networkPending.value = false
    }
  }
  function disconnect() {
    sessionDisconnected = true
    accountRevision++
    chainRevision++
    sessionRevision++
    address.value = ''
    chainId.value = ''
    clearError()
  }

  onMounted(async () => {
    const requestProvider = findProvider({ reportError: false })
    if (!requestProvider || disposed) return
    const revision = accountRevision
    try {
      const accounts = await requestProvider.request({ method: 'eth_accounts' })
      if (disposed || revision !== accountRevision || provider !== requestProvider) return
      updateAccounts(accounts)
      if (address.value) await readChain()
    } catch {
      // Silent restoration is optional and should not show an error.
    }
  })
  onUnmounted(() => {
    disposed = true
    removeListeners()
  })

  return { address, shortAddress, chainId, pending, networkPending, walletError, networkMessage, connect, addNetwork, disconnect, clearError }
}



