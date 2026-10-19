<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import {
  ArrowDown, ArrowDownRight, ArrowRight, ArrowUpRight, BookOpen, Check, CheckCheck, Copy, Download,
  Gauge, LayoutGrid, Layers, ListFilter, Plus, Search, ShieldCheck, Sparkles, Star, Table2, Wallet, X,
} from 'lucide-vue-next'
import UiDialog from './components/UiDialog.vue'
import AssetDrawer from './components/AssetDrawer.vue'
import TrendField from './components/TrendField.vue'
import SignalGauge from './components/SignalGauge.vue'
import { brand, storageKeys, legacyStorageKeys } from './data/brand.js'
import { categories, markets, money, normalized, range, signed } from './data/markets.js'
import { robinhoodConfig } from './data/robinhood.js'
import { useWallet } from './composables/useWallet.js'

const { address, shortAddress, chainId, pending, networkPending, walletError, networkMessage, connect, addNetwork, disconnect, clearError } = useWallet()

/* ------------------------------------------------------------------ navigation */
const views = [
  { id: 'overview', index: '01', label: 'Overview', icon: LayoutGrid },
  { id: 'markets', index: '02', label: 'Markets', icon: Table2 },
  { id: 'compare', index: '03', label: 'Compare', icon: Gauge },
  { id: 'watchlist', index: '04', label: 'Watchlist', icon: Star },
  { id: 'network', index: '05', label: 'Network', icon: Layers },
]
const view = ref('overview')
const railOpen = ref(false)
function go(id) {
  view.value = id
  railOpen.value = false
  nextTick(() => document.getElementById(`view-${id}`)?.focus?.({ preventScroll: true }))
}

/* ------------------------------------------------------------------ market state */
const query = ref('')
const category = ref('All')
const sort = ref('signal')
const savedOnly = ref(false)
const saved = ref([])
const selected = ref(markets[0])
const amount = ref('1000')
const compareWith = ref('')
const memoText = ref('')
const memo = ref(false)
const dialog = ref('')
const toast = ref('')
const undoAction = ref(null)
const storageAvailable = ref(true)
let toastTimer

const visible = computed(() => markets
  .filter(m => (category.value === 'All' || m.category === category.value)
    && (!savedOnly.value || saved.value.includes(m.symbol))
    && `${m.symbol} ${m.name}`.toLowerCase().includes(query.value.trim().toLowerCase()))
  .sort((a, b) => (sort.value === 'signal' ? b.score - a.score : sort.value === 'change' ? b.change - a.change : a.name.localeCompare(b.name))))

const featured = computed(() => markets[0])
const featuredCurve = computed(() => normalized(featured.value.history))
const featuredRange = computed(() => range(featured.value.history))
const comparison = computed(() => markets.find(m => m.symbol === compareWith.value) || null)
const movers = computed(() => [...markets].sort((a, b) => b.change - a.change))
const spread = computed(() => Math.max(...markets.map(m => m.score)) - Math.min(...markets.map(m => m.score)))
const averageChange = computed(() => markets.reduce((total, m) => total + m.change, 0) / markets.length)

const amountValue = computed(() => Number(amount.value))
const amountError = computed(() => {
  if (!amount.value.trim()) return 'Enter an amount to see an estimate.'
  if (!/^\d+(\.\d{0,2})?$/.test(amount.value.trim()) || !Number.isFinite(amountValue.value) || amountValue.value <= 0) return 'Enter a positive amount with up to 2 decimal places.'
  if (amountValue.value > 1000000) return 'Use an amount of $1,000,000 or less for this preview.'
  return ''
})
const quantity = computed(() => (amountError.value ? '...' : (amountValue.value / selected.value.price).toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })))
const isSaved = computed(() => saved.value.includes(selected.value.symbol))
const chainLabel = computed(() => (!address.value ? 'Wallet not connected' : chainId.value === robinhoodConfig.chainIdHex ? robinhoodConfig.name : 'Another network'))
const watchlistValue = computed(() => markets.filter(m => saved.value.includes(m.symbol)).reduce((total, m) => total + m.price, 0))
const savedChange = computed(() => {
  const held = markets.filter(m => saved.value.includes(m.symbol))
  return held.length ? held.reduce((total, m) => total + m.change, 0) / held.length : 0
})

/* ------------------------------------------------------------------ behaviour */
function notify(message, undo = null) {
  undoAction.value = undo
  toast.value = message
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => { toast.value = '' }, 6500)
}
function persist(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); storageAvailable.value = true; return true }
  catch { storageAvailable.value = false; notify('Browser storage is unavailable. Changes last for this session only.'); return false }
}
function toggleSaved(market) {
  const exists = saved.value.includes(market.symbol)
  saved.value = exists ? saved.value.filter(s => s !== market.symbol) : [...saved.value, market.symbol]
  if (persist(storageKeys.watchlist, saved.value)) notify(`${market.symbol} ${exists ? 'removed from' : 'added to'} the watchlist`, () => {
    saved.value = exists ? [...new Set([...saved.value, market.symbol])] : saved.value.filter(s => s !== market.symbol)
    if (persist(storageKeys.watchlist, saved.value)) notify('Watchlist change undone')
  })
}
function inspect(market) { selected.value = market; drawer.value = true }
const drawer = ref(false)
function resetFilters() { query.value = ''; category.value = 'All'; savedOnly.value = false }
function saveMemo() {
  memo.value = memoText.value.trim().length > 0
  if (persist(storageKeys.memo, memoText.value)) notify(memo.value ? 'Research note saved on this device' : 'Research note cleared')
}
function openPreview(market) {
  if (market) selected.value = market
  drawer.value = false
  if (!amountError.value) dialog.value = 'preview'
}
function exportPreview() {
  const lines = [
    `${brand.name} - illustrative amount preview`,
    '',
    `Asset: ${selected.value.symbol} (${selected.value.name})`,
    `Amount considered: ${money(amountValue.value)} USD`,
    `Sample reference price: ${money(selected.value.price)}`,
    `Illustrative quantity: ${quantity.value} ${selected.value.symbol}`,
    `Signal score: ${selected.value.score.toFixed(1)} / 100 (illustrative)`,
    'Fees and slippage: not included',
    'Data: static demonstration fixture, not a live quote',
    'No transaction has been signed, submitted or routed.',
    'Asset access depends on issuer, venue, jurisdiction and eligibility.',
  ].join('\n')
  const url = URL.createObjectURL(new Blob([lines], { type: 'text/plain;charset=utf-8' }))
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${brand.slug}-${selected.value.symbol.toLowerCase()}-preview.txt`
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  notify('Preview downloaded')
}
const copied = ref('')
async function copyValue(value, key) {
  try {
    await navigator.clipboard.writeText(value)
    copied.value = key
    window.setTimeout(() => { if (copied.value === key) copied.value = '' }, 2200)
  } catch { notify('Clipboard access is unavailable in this browser.') }
}
function focusSearch() {
  go('markets')
  nextTick(() => document.getElementById('market-search')?.focus({ preventScroll: false }))
}
function onKey(event) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); focusSearch(); return }
  if (event.key !== 'Escape') return
  // The dialogs handle their own Escape through the native <dialog> cancel event.
  if (document.querySelector('dialog[open]')) return
  if (drawer.value) drawer.value = false
  else if (railOpen.value) railOpen.value = false
}
onMounted(() => {
  try {
    const readLegacy = keys => keys.map(key => localStorage.getItem(key)).find(value => value !== null)
    const currentWatchlist = localStorage.getItem(storageKeys.watchlist)
    const raw = currentWatchlist ?? readLegacy(legacyStorageKeys.watchlist)
    try {
      const stored = JSON.parse(raw || '[]')
      saved.value = Array.isArray(stored) ? [...new Set(stored.filter(s => markets.some(m => m.symbol === s)))] : []
    } catch { saved.value = [] }
    const currentMemo = localStorage.getItem(storageKeys.memo)
    const legacyMemo = currentMemo ?? readLegacy(legacyStorageKeys.memo)
    if (legacyMemo) {
      try {
        const stored = JSON.parse(legacyMemo)
        memoText.value = typeof stored === 'string' ? stored : ''
      } catch { memoText.value = '' }
    }
    memo.value = memoText.value.trim().length > 0
    if (currentWatchlist === null && raw != null) localStorage.setItem(storageKeys.watchlist, JSON.stringify(saved.value))
    if (currentMemo === null && legacyMemo != null) localStorage.setItem(storageKeys.memo, JSON.stringify(memoText.value))
  } catch { storageAvailable.value = false }
  window.addEventListener('keydown', onKey)
})
onUnmounted(() => { window.clearTimeout(toastTimer); window.removeEventListener('keydown', onKey) })
</script>

<template>
  <a class="skip-link" href="#workspace">Skip to the workspace</a>
  <div class="backdrop" aria-hidden="true">
    <span class="backdrop-dots"></span>
    <span class="backdrop-aurora backdrop-aurora-a"></span>
    <span class="backdrop-aurora backdrop-aurora-b"></span>
    <span class="backdrop-rule"></span>
  </div>

  <div class="console">
    <!-- ============================================================ navigation rail -->
    <aside class="rail" :class="{ open: railOpen }" aria-label="Workspace sections">
      <a class="rail-brand" href="#workspace" @click="go('overview')">
        <img :src="brand.mark" alt="" width="40" height="40" />
        <span class="rail-brand-text">
          <strong>{{ brand.display }}</strong>
          <small>{{ brand.tagline }}</small>
        </span>
      </a>
      <nav class="rail-nav">
        <button v-for="item in views" :key="item.id" :data-nav="item.id" class="rail-stop" :class="{ current: view === item.id }" :aria-current="view === item.id ? 'page' : undefined" @click="go(item.id)">
          <span class="rail-index">{{ item.index }}</span>
          <component :is="item.icon" :size="16" />
          <span class="rail-label">{{ item.label }}</span>
          <span v-if="item.id === 'watchlist' && saved.length" class="rail-count">{{ saved.length }}</span>
        </button>
      </nav>
      <div class="rail-foot">
        <div class="rail-stat"><span>Signal spread</span><strong>{{ spread.toFixed(1) }}</strong></div>
        <div class="rail-stat"><span>Sample set</span><strong>{{ markets.length }} assets</strong></div>
        <button class="rail-note" @click="saveMemo">
          <component :is="memo ? CheckCheck : BookOpen" :size="15" />
          {{ memo ? 'Note saved' : 'Save a research note' }}
        </button>
        <p class="rail-legal">Static illustrations. Not investment advice. {{ brand.disclaimer }}</p>
      </div>
    </aside>

    <div class="workspace" id="workspace">
      <!-- ============================================================ command bar -->
      <header class="bar">
        <button class="icon-button bar-menu" :aria-expanded="railOpen" aria-label="Toggle sections" @click="railOpen = !railOpen">
          <component :is="railOpen ? X : ListFilter" :size="19" />
        </button>
        <div class="bar-view">
          <span class="bar-index">{{ views.find(v => v.id === view).index }}</span>
          <span class="bar-name">{{ views.find(v => v.id === view).label }}</span>
        </div>
        <label class="bar-search">
          <Search :size="16" />
          <input id="market-search" v-model="query" type="search" autocomplete="off" placeholder="Filter assets by symbol or name" @focus="view = 'markets'" />
          <kbd>Ctrl K</kbd>
        </label>
        <div class="bar-actions">
          <span class="chain-pill"><i class="chain-dot"></i>{{ robinhoodConfig.name }} <b>{{ robinhoodConfig.chainIdHex }}</b></span>
          <button class="ghost-button bar-preview" @click="openPreview(null)"><Sparkles :size="15" /> Amount preview</button>
          <button class="wallet-key" @click="clearError(); dialog = 'wallet'">
            <Wallet :size="15" />
            <span>{{ address ? shortAddress : 'Connect wallet' }}</span>
            <ArrowUpRight :size="14" />
          </button>
        </div>
      </header>

      <!-- ============================================================ tape -->
      <div class="tape" aria-hidden="true">
        <div class="tape-track">
          <span v-for="pass in 2" :key="pass" class="tape-run">
            <span v-for="market in markets" :key="pass + market.symbol" class="tape-item">
              <b>{{ market.symbol }}</b>{{ money(market.price) }}
              <i :class="market.change >= 0 ? 'is-up' : 'is-down'">{{ signed(market.change) }}</i>
            </span>
            <span class="tape-item tape-tag">{{ brand.domain }} / sample fixtures</span>
          </span>
        </div>
      </div>

      <main class="stage view-stage" :data-view="view" tabindex="-1">
        <!-- ========================================================== 01 OVERVIEW -->
        <section v-show="view === 'overview'" id="view-overview" class="view view-overview" tabindex="-1" aria-label="Overview">
          <div class="board-head">
            <p class="kicker">Robinhood Chain <span class="sep">/</span> mainnet 4663 <span class="sep">/</span> static fixtures</p>
            <h1>A wide view of a narrow market.</h1>
            <p class="lede">{{ brand.name }} reads five tokenised sample assets side by side, keeps your own notes, and never touches a signature. Every figure below is an illustration built for reading, not a quote you can trade.</p>
          </div>

          <div class="mosaic">
            <article class="tile tile-feature">
              <header class="tile-head">
                <span class="tile-tag">Featuring</span>
                <button class="tile-link" @click="inspect(featured)">Inspect <ArrowUpRight :size="14" /></button>
              </header>
              <div class="feature-body">
                <div>
                  <h2>{{ featured.symbol }}</h2>
                  <p>{{ featured.name }}</p>
                </div>
                <div class="feature-quote">
                  <strong>{{ money(featured.price) }}</strong>
                  <span :class="featured.change >= 0 ? 'is-up' : 'is-down'">{{ signed(featured.change) }}</span>
                </div>
              </div>
              <div class="feature-curve">
                <TrendField :history="featuredCurve" :height="150" grid label="Illustrative normalised sample shape for the featured asset" />
              </div>
              <footer class="feature-foot">
                <span>Window {{ featuredRange.low.toFixed(0) }} - {{ featuredRange.high.toFixed(0) }}</span>
                <span>{{ featured.volume }} sample volume</span>
              </footer>
            </article>

            <article class="tile tile-gauge">
              <header class="tile-head"><span class="tile-tag">Signal</span></header>
              <SignalGauge :value="featured.score" :size="148" />
              <p class="tile-note">A fixed 0-100 example. Conversation velocity, source quality and recency are planned inputs; nothing here is live or predictive.</p>
              <button class="tile-link" @click="dialog = 'method'">How scoring works <ArrowRight :size="14" /></button>
            </article>

            <article class="tile tile-stats">
              <header class="tile-head"><span class="tile-tag">Session</span><span class="tile-hint">Sample fixtures</span></header>
              <dl class="stat-grid">
                <div><dt>Assets tracked</dt><dd>{{ markets.length }}</dd></div>
                <div><dt>On the watchlist</dt><dd>{{ saved.length }}</dd></div>
                <div><dt>Average 24h move</dt><dd :class="averageChange >= 0 ? 'is-up' : 'is-down'">{{ signed(averageChange) }}</dd></div>
                <div><dt>Watchlist notional</dt><dd>{{ saved.length ? money(watchlistValue) : '-' }}</dd></div>
              </dl>
            </article>

            <article class="tile tile-movers">
              <header class="tile-head"><span class="tile-tag">Biggest sample moves</span><button class="tile-link" @click="view = 'markets'">Open table <ArrowRight :size="14" /></button></header>
              <ul class="mover-list">
                <li v-for="market in movers.slice(0, 3)" :key="market.symbol">
                  <button @click="inspect(market)">
                    <span class="asset-glyph small" :class="market.tone">{{ market.monogram }}</span>
                    <span class="mover-name"><strong>{{ market.symbol }}</strong><small>{{ market.name }}</small></span>
                    <span class="mover-spark"><TrendField :history="market.history" :height="34" :tone="market.change >= 0 ? 'up' : 'down'" /></span>
                    <span class="mover-change" :class="market.change >= 0 ? 'is-up' : 'is-down'">{{ signed(market.change) }}</span>
                  </button>
                </li>
              </ul>
            </article>

            <article class="tile tile-method">
              <header class="tile-head"><span class="tile-tag">Method</span></header>
              <h3>Read wide, then record.</h3>
              <ol class="method-list">
                <li><b>01</b><span>Scan the whole sample set in one table instead of one card at a time.</span></li>
                <li><b>02</b><span>Normalise each asset inside its own window so shapes are comparable.</span></li>
                <li><b>03</b><span>Keep what matters on this device: a watchlist and a note, nothing else.</span></li>
              </ol>
              <button class="tile-link" @click="dialog = 'about'">What this preview is <ArrowUpRight :size="14" /></button>
            </article>
          </div>
        </section>

        <!-- ========================================================== 02 MARKETS -->
        <section v-show="view === 'markets'" id="view-markets" class="view view-markets" tabindex="-1" aria-label="Markets">
          <div class="view-head">
            <div>
              <p class="kicker">Asset table <span class="sep">/</span> {{ visible.length }} of {{ markets.length }}</p>
              <h1>{{ savedOnly ? 'Your saved assets' : 'The whole sample set' }}</h1>
            </div>
            <div class="head-tools">
              <button class="chip" :class="{ on: savedOnly }" :aria-pressed="savedOnly" @click="savedOnly = !savedOnly"><Star :size="14" :fill="savedOnly ? 'currentColor' : 'none'" /> Saved only</button>
              <button class="chip" @click="resetFilters">Reset</button>
            </div>
          </div>

          <div class="filter-row">
            <div class="chip-set" role="group" aria-label="Asset category">
              <button v-for="item in categories" :key="item" class="chip" :class="{ on: category === item }" :aria-pressed="category === item" @click="category = item">{{ item }}</button>
            </div>
            <label class="sort-field">
              <span>Sort</span>
              <select v-model="sort">
                <option value="signal">Signal score</option>
                <option value="change">24h sample change</option>
                <option value="name">Name A to Z</option>
              </select>
            </label>
          </div>

          <div v-if="visible.length" class="table-frame">
            <table class="asset-table">
              <caption class="sr-only">Illustrative sample assets with static prices, changes and signal scores</caption>
              <thead>
                <tr>
                  <th scope="col" class="col-asset">Asset</th>
                  <th scope="col" class="col-cat">Class</th>
                  <th scope="col" class="num">Sample price</th>
                  <th scope="col" class="num">24h</th>
                  <th scope="col" class="col-shape">Seven-day shape</th>
                  <th scope="col" class="num">Range</th>
                  <th scope="col" class="num">Signal</th>
                  <th scope="col" class="col-act"><span class="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="market in visible" :key="market.symbol" :class="{ picked: selected.symbol === market.symbol }">
                  <th scope="row" class="col-asset">
                    <button class="row-id" @click="inspect(market)">
                      <span class="asset-glyph small" :class="market.tone">{{ market.monogram }}</span>
                      <span><strong>{{ market.symbol }}</strong><small>{{ market.name }}</small></span>
                    </button>
                  </th>
                  <td class="col-cat"><span class="class-tag">{{ market.category }}</span></td>
                  <td class="num">{{ money(market.price) }}</td>
                  <td class="num" :class="market.change >= 0 ? 'is-up' : 'is-down'">
                    <component :is="market.change >= 0 ? ArrowUpRight : ArrowDownRight" :size="13" />{{ signed(market.change) }}
                  </td>
                  <td class="col-shape"><TrendField :history="market.history" :height="38" :tone="market.change >= 0 ? 'up' : 'down'" /></td>
                  <td class="num muted">{{ range(market.history).low.toFixed(0) }}-{{ range(market.history).high.toFixed(0) }}</td>
                  <td class="num">
                    <span class="score-cell"><b>{{ market.score.toFixed(1) }}</b><i><em :style="{ width: market.score + '%' }"></em></i></span>
                  </td>
                  <td class="col-act">
                    <button class="icon-button tiny" :aria-pressed="saved.includes(market.symbol)" :aria-label="(saved.includes(market.symbol) ? 'Remove ' : 'Save ') + market.symbol" @click="toggleSaved(market)">
                      <Star :size="14" :fill="saved.includes(market.symbol) ? 'currentColor' : 'none'" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-panel" role="status">
            <component :is="savedOnly ? Star : Search" :size="24" />
            <h2>{{ savedOnly && !saved.length ? 'Nothing saved yet.' : 'No asset matches that filter.' }}</h2>
            <p>{{ savedOnly && !saved.length ? 'Star a row to keep it on this device. Nothing leaves the browser.' : 'Try a different symbol or clear the filters.' }}</p>
            <button class="ghost-button" @click="resetFilters">{{ savedOnly && !saved.length ? 'Show every asset' : 'Clear filters' }} <ArrowRight :size="15" /></button>
          </div>
          <p v-if="!storageAvailable" class="inline-note" role="status">Browser storage is unavailable, so the watchlist is kept for this session only.</p>
        </section>

        <!-- ========================================================== 03 COMPARE -->
        <section v-show="view === 'compare'" id="view-compare" class="view view-compare" tabindex="-1" aria-label="Compare">
          <div class="view-head">
            <div>
              <p class="kicker">Shape comparison <span class="sep">/</span> normalised 0-100</p>
              <h1>Same window, five shapes.</h1>
            </div>
            <label class="sort-field">
              <span>Emphasise</span>
              <select v-model="compareWith">
                <option value="">Nothing, show all</option>
                <option v-for="market in markets" :key="market.symbol" :value="market.symbol">{{ market.symbol }} - {{ market.name }}</option>
              </select>
            </label>
          </div>

          <div class="chart-board">
            <svg class="compare-chart" viewBox="0 0 720 268" role="img" :aria-label="`Normalised seven-day sample shapes for ${markets.map(m => m.symbol).join(', ')}`">
              <g class="chart-rules">
                <line v-for="step in [0, 1, 2, 3, 4]" :key="step" x1="46" :x2="704" :y1="22 + step * 52" :y2="22 + step * 52" />
              </g>
              <g class="chart-scale">
                <text x="36" y="26" text-anchor="end">100</text>
                <text x="36" y="130" text-anchor="end">50</text>
                <text x="36" y="234" text-anchor="end">0</text>
              </g>
              <g class="chart-axis">
                <text x="46" y="262">Seven samples ago</text>
                <text x="704" y="262" text-anchor="end">Now</text>
              </g>
              <polyline
                v-for="(market, index) in markets"
                :key="market.symbol"
                class="series"
                :class="[`series-${index + 1}`, { dim: compareWith && compareWith !== market.symbol, lit: compareWith === market.symbol }]"
                :points="normalized(market.history).map((value, i, all) => `${46 + (i / (all.length - 1)) * 658},${230 - value * 2.08}`).join(' ')"
                vector-effect="non-scaling-stroke"
              />
              <circle
                v-for="(market, index) in markets"
                :key="market.symbol + '-end'"
                class="series-end"
                :class="[`series-${index + 1}`, { dim: compareWith && compareWith !== market.symbol }]"
                cx="704"
                :cy="230 - normalized(market.history).at(-1) * 2.08"
                r="3.6"
              />
            </svg>
            <ul class="series-key">
              <li v-for="(market, index) in markets" :key="market.symbol" :class="[`series-${index + 1}`, { dim: compareWith && compareWith !== market.symbol }]">
                <i></i><b>{{ market.symbol }}</b><span>{{ money(market.price) }}</span><em :class="market.change >= 0 ? 'is-up' : 'is-down'">{{ signed(market.change) }}</em>
              </li>
            </ul>
          </div>

          <div v-if="comparison" class="duel">
            <h2>{{ featured.symbol }} <span class="versus">against</span> {{ comparison.symbol }}</h2>
            <table class="duel-table">
              <caption class="sr-only">Side-by-side illustrative metrics for two sample assets</caption>
              <thead><tr><th scope="col">Metric</th><th scope="col">{{ featured.symbol }}</th><th scope="col">{{ comparison.symbol }}</th><th scope="col">Reading</th></tr></thead>
              <tbody>
                <tr><th scope="row">Sample price</th><td>{{ money(featured.price) }}</td><td>{{ money(comparison.price) }}</td><td class="muted">Fixtures, not quotes</td></tr>
                <tr><th scope="row">24h sample change</th><td :class="featured.change >= 0 ? 'is-up' : 'is-down'">{{ signed(featured.change) }}</td><td :class="comparison.change >= 0 ? 'is-up' : 'is-down'">{{ signed(comparison.change) }}</td><td class="muted">{{ Math.abs(featured.change - comparison.change).toFixed(2) }} points apart</td></tr>
                <tr><th scope="row">Signal score</th><td>{{ featured.score.toFixed(1) }}</td><td>{{ comparison.score.toFixed(1) }}</td><td class="muted">{{ featured.score === comparison.score ? 'Level' : Math.abs(featured.score - comparison.score).toFixed(1) + ' points apart' }}</td></tr>
                <tr><th scope="row">Window position</th><td>{{ ((featured.price - range(featured.history).low) / (range(featured.history).high - range(featured.history).low) * 100).toFixed(0) }}%</td><td>{{ ((comparison.price - range(comparison.history).low) / (range(comparison.history).high - range(comparison.history).low) * 100).toFixed(0) }}%</td><td class="muted">Where the fixture sits in its own range</td></tr>
              </tbody>
            </table>
          </div>
          <p v-else class="inline-note">Every line is scaled inside its own window, so a flat line and a quiet asset can look alike. Pick an asset above to pull it out of the set.</p>
        </section>

        <!-- ========================================================== 04 WATCHLIST -->
        <section v-show="view === 'watchlist'" id="view-watchlist" class="view view-watchlist" tabindex="-1" aria-label="Watchlist">
          <div class="view-head">
            <div>
              <p class="kicker">On this device <span class="sep">/</span> {{ saved.length }} saved</p>
              <h1>{{ saved.length ? 'Saved, not synced.' : 'An empty page is a fine start.' }}</h1>
            </div>
            <button class="ghost-button" @click="view = 'markets'">Browse the table <ArrowRight :size="15" /></button>
          </div>

          <div class="watch-grid">
            <div class="watch-column">
              <ul v-if="saved.length" class="watch-list">
                <li v-for="market in markets.filter(m => saved.includes(m.symbol))" :key="market.symbol" class="watch-item">
                  <button class="watch-row" @click="inspect(market)">
                    <span class="asset-glyph" :class="market.tone">{{ market.monogram }}</span>
                    <span class="watch-id"><strong>{{ market.symbol }}</strong><small>{{ market.name }} / {{ market.category }}</small></span>
                    <span class="watch-spark"><TrendField :history="market.history" :height="42" :tone="market.change >= 0 ? 'up' : 'down'" /></span>
                    <span class="watch-quote"><strong>{{ money(market.price) }}</strong><em :class="market.change >= 0 ? 'is-up' : 'is-down'">{{ signed(market.change) }}</em></span>
                    <span class="watch-mark" aria-hidden="true"><Star :size="14" fill="currentColor" /></span>
                  </button>
                  <button class="watch-remove" :aria-label="'Remove ' + market.symbol + ' from the watchlist'" @click="toggleSaved(market)"><X :size="14" /></button>
                </li>
              </ul>
              <div v-else class="empty-panel" role="status">
                <Star :size="24" />
                <h2>No saved assets yet.</h2>
                <p>Save a row from the asset table and it appears here, stored in this browser only.</p>
                <button class="ghost-button" @click="view = 'markets'">Open the asset table <ArrowRight :size="15" /></button>
              </div>
              <label class="memo-field">
                <span>Research note <em>{{ memo ? 'saved' : 'unsaved' }}</em></span>
                <textarea v-model="memoText" rows="5" placeholder="What did you notice? Kept on this device only." @input="memo = memoText.trim().length > 0"></textarea>
              </label>
              <button class="ghost-button" :aria-pressed="memo" @click="saveMemo"><component :is="memo ? CheckCheck : BookOpen" :size="15" />{{ memo ? 'Note saved on this device' : 'Save this note' }}</button>
              <p class="inline-note">Notes and watchlists live in browser storage. They are never uploaded, and this preview has no account system.</p>
            </div>

            <section class="watch-summary" aria-label="Watchlist readout">
              <h2>Watchlist readout</h2>
              <dl class="stat-grid roomy">
                <div><dt>Saved assets</dt><dd>{{ saved.length }}</dd></div>
                <div><dt>Combined fixture value</dt><dd>{{ saved.length ? money(watchlistValue) : '-' }}</dd></div>
                <div><dt>Average sample change</dt><dd :class="savedChange >= 0 ? 'is-up' : 'is-down'">{{ saved.length ? signed(savedChange) : '-' }}</dd></div>
                <div><dt>Strongest signal saved</dt><dd>{{ saved.length ? markets.filter(m => saved.includes(m.symbol)).sort((a, b) => b.score - a.score)[0].symbol : '-' }}</dd></div>
              </dl>
              <button class="primary-button" @click="openPreview(null)">Preview an amount <Sparkles :size="16" /></button>
              <button class="ghost-button" :aria-pressed="memo" @click="saveMemo"><component :is="memo ? CheckCheck : BookOpen" :size="15" />{{ memo ? 'Note saved' : 'Save this note' }}</button>
            </section>
          </div>
        </section>

        <!-- ========================================================== 05 NETWORK -->
        <section v-show="view === 'network'" id="view-network" class="view view-network" tabindex="-1" aria-label="Network and data">
          <div class="view-head">
            <div>
              <p class="kicker">Chain facts <span class="sep">/</span> read only</p>
              <h1>Everything the client is configured to read.</h1>
            </div>
            <a class="ghost-button" :href="robinhoodConfig.docsUrl" target="_blank" rel="noreferrer">Chain documentation <ArrowUpRight :size="15" /></a>
          </div>

          <div class="net-grid">
            <div class="net-column">
              <dl class="record">
                <div>
                  <dt>Network</dt>
                  <dd>{{ robinhoodConfig.name }}<button class="copy-button" @click="copyValue(robinhoodConfig.name, 'net')"><component :is="copied === 'net' ? Check : Copy" :size="13" />{{ copied === 'net' ? 'Copied' : 'Copy' }}</button></dd>
                </div>
                <div>
                  <dt>Environment</dt>
                  <dd>{{ robinhoodConfig.network === 'mainnet' ? 'Mainnet' : 'Testnet' }}</dd>
                </div>
                <div>
                  <dt>Chain ID</dt>
                  <dd>{{ robinhoodConfig.chainId }} <code>{{ robinhoodConfig.chainIdHex }}</code><button class="copy-button" @click="copyValue(String(robinhoodConfig.chainId), 'id')"><component :is="copied === 'id' ? Check : Copy" :size="13" />{{ copied === 'id' ? 'Copied' : 'Copy' }}</button></dd>
                </div>
                <div>
                  <dt>Gas asset</dt>
                  <dd>{{ robinhoodConfig.nativeCurrency.symbol }} <span class="muted">{{ robinhoodConfig.nativeCurrency.name }}</span></dd>
                </div>
                <div>
                  <dt>RPC endpoint</dt>
                  <dd class="mono">{{ robinhoodConfig.rpcUrl }}<button class="copy-button" @click="copyValue(robinhoodConfig.rpcUrl, 'rpc')"><component :is="copied === 'rpc' ? Check : Copy" :size="13" />{{ copied === 'rpc' ? 'Copied' : 'Copy' }}</button></dd>
                </div>
                <div>
                  <dt>Explorer</dt>
                  <dd><a :href="robinhoodConfig.explorerUrl" target="_blank" rel="noreferrer">Blockscout <ArrowUpRight :size="13" /></a></dd>
                </div>
              </dl>
            </div>

            <div class="net-column">
              <div class="net-card">
                <h2>Wallet</h2>
                <p v-if="!address">No wallet is connected. Reading the atlas and building previews never needs one.</p>
                <div v-else class="wallet-readout">
                  <span class="chain-dot"></span>
                  <span><strong>{{ shortAddress }}</strong><small>{{ chainLabel }}</small></span>
                  <code>{{ address }}</code>
                </div>
                <div v-if="walletError" class="inline-error" role="alert">{{ walletError }}</div>
                <div v-if="networkMessage" class="inline-success" role="status">{{ networkMessage }}</div>
                <div class="net-actions">
                  <button v-if="!address" class="primary-button" :disabled="pending" @click="connect">{{ pending ? 'Waiting for your wallet' : 'Connect a browser wallet' }} <Wallet :size="16" /></button>
                  <template v-else>
                    <button class="primary-button" :disabled="networkPending" @click="addNetwork">{{ networkPending ? 'Waiting for your wallet' : 'Add Robinhood Chain' }} <Plus :size="16" /></button>
                    <button class="ghost-button" @click="disconnect(); notify('Wallet disconnected for this session')">Disconnect</button>
                  </template>
                </div>
                <p class="net-foot">Connecting requests account access only. {{ brand.name }} never asks for a signature and never submits a transaction.</p>
              </div>

              <div class="net-card">
                <h2>Where the numbers come from</h2>
                <ul class="ledger-list">
                  <li><span>Prices, changes, volumes</span><b>Static fixtures</b></li>
                  <li><span>Seven-day shapes</span><b>Fixed sample arrays</b></li>
                  <li><span>Signal scores</span><b>Fixed 0-100 examples</b></li>
                  <li><span>Watchlist and note</span><b>This browser only</b></li>
                  <li><span>Orders</span><b>Never signed, never sent</b></li>
                </ul>
                <button class="tile-link" @click="dialog = 'about'">Read the full disclosure <ArrowUpRight :size="14" /></button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer class="foot">
        <div class="foot-brand">
          <img :src="brand.mark" alt="" width="30" height="30" />
          <span><strong>{{ brand.display }}</strong><small>{{ brand.tagline }}</small></span>
        </div>
        <p>{{ brand.disclaimer }} Illustrative data only, not financial advice. Asset access depends on eligibility and jurisdiction.</p>
        <div class="foot-links">
          <button class="tile-link" @click="dialog = 'about'">About this preview <ArrowUpRight :size="13" /></button>
          <a :href="robinhoodConfig.explorerUrl" target="_blank" rel="noreferrer">Block explorer <ArrowUpRight :size="13" /></a>
        </div>
      </footer>
    </div>
  </div>

  <!-- ============================================================ inspector -->
  <AssetDrawer :market="selected" :saved="isSaved" :open="drawer" @close="drawer = false" @toggle-save="toggleSaved" @open-preview="openPreview" />

  <!-- ============================================================ dialogs -->
  <UiDialog :open="dialog === 'preview'" kicker="Illustrative preview" :title="`What ${money(amountValue)} could look like in ${selected.symbol}`" @close="dialog = ''">
    <div class="preview-grid">
      <div class="preview-controls">
        <label class="amount-field" :class="{ invalid: amountError }">
          <span>Amount considered (USD)</span>
          <input v-model="amount" type="text" inputmode="decimal" autocomplete="off" :aria-invalid="Boolean(amountError)" aria-describedby="amount-help" />
        </label>
        <div class="chip-set" role="group" aria-label="Quick amounts">
          <button v-for="preset in [100, 1000, 10000]" :key="preset" class="chip" :class="{ on: amountValue === preset }" :aria-pressed="amountValue === preset" @click="amount = String(preset)">{{ money(preset).replace('.00', '') }}</button>
        </div>
        <p id="amount-help" class="inline-note" :class="{ 'is-error': amountError }">{{ amountError || 'Illustrative only, before fees and slippage.' }}</p>
        <label class="amount-field">
          <span>Asset</span>
          <select :value="selected.symbol" @change="selected = markets.find(m => m.symbol === $event.target.value)">
            <option v-for="market in markets" :key="market.symbol" :value="market.symbol">{{ market.symbol }} - {{ market.name }}</option>
          </select>
        </label>
      </div>
      <dl class="preview-summary">
        <div><dt>Sample reference price</dt><dd>{{ money(selected.price) }}</dd></div>
        <div class="lead"><dt>Illustrative quantity</dt><dd>{{ quantity }} <small>{{ selected.symbol }}</small></dd></div>
        <div><dt>Signal score</dt><dd>{{ selected.score.toFixed(1) }}<small>/100</small></dd></div>
        <div><dt>Fees and slippage</dt><dd>Not included</dd></div>
        <div><dt>Wallet</dt><dd>{{ address ? shortAddress : 'Not connected' }}</dd></div>
      </dl>
    </div>
    <div class="notice"><ShieldCheck :size="18" /><p>No transaction is signed, submitted or routed. This is a static calculation on fixture data.</p></div>
    <div class="dialog-actions">
      <button class="ghost-button" @click="dialog = ''">Close</button>
      <button class="primary-button" :disabled="Boolean(amountError)" @click="exportPreview">Download the preview <Download :size="16" /></button>
    </div>
  </UiDialog>

  <UiDialog :open="dialog === 'wallet'" kicker="Your keys, your control" :title="address ? 'Wallet connected.' : 'Connect a wallet.'" @close="dialog = ''">
    <p class="dialog-lede">Reading the atlas and building previews never requires a wallet. Connecting only asks for account access.</p>
    <div v-if="address" class="wallet-readout">
      <span class="chain-dot"></span>
      <span><strong>{{ shortAddress }}</strong><small>{{ chainLabel }}</small></span>
      <code>{{ address }}</code>
    </div>
    <div v-if="walletError" class="inline-error" role="alert">{{ walletError }}</div>
    <div v-if="networkMessage" class="inline-success" role="status">{{ networkMessage }}</div>
    <button v-if="!address" class="primary-button full" :disabled="pending" @click="connect">{{ pending ? 'Waiting for your wallet' : 'Connect browser wallet' }} <Wallet :size="16" /></button>
    <template v-else>
      <button class="primary-button full" :disabled="networkPending" @click="addNetwork">{{ networkPending ? 'Waiting for your wallet' : 'Add Robinhood Chain to the wallet' }} <Plus :size="16" /></button>
      <button class="ghost-button full" @click="disconnect(); notify('Wallet disconnected for this session')">Disconnect this session</button>
    </template>
    <p class="dialog-foot">{{ brand.name }} does not request signatures and does not send transactions.</p>
  </UiDialog>

  <UiDialog :open="dialog === 'about'" kicker="Research preview" title="What this build is, and what it is not." @close="dialog = ''">
    <p class="dialog-lede">{{ brand.positioning }} It is an independent prototype and is not affiliated with Robinhood Markets, Inc.</p>
    <ul class="check-list">
      <li><Check :size="16" /><span>Search, filter, sort and inspect five illustrative assets.</span></li>
      <li><Check :size="16" /><span>Compare normalised seven-day sample shapes across the whole set.</span></li>
      <li><Check :size="16" /><span>Keep a watchlist and a research note in this browser.</span></li>
      <li><Check :size="16" /><span>Build and download an illustrative amount preview.</span></li>
      <li><Check :size="16" /><span>Optionally connect an injected EVM wallet to read the chain configuration.</span></li>
    </ul>
    <div class="notice"><BookOpen :size="18" /><p>No live feed, no order routing, no execution, no account. Every price, change, volume, shape and score is a fixed example.</p></div>
    <button class="primary-button full" @click="dialog = ''">Back to the atlas <ArrowRight :size="16" /></button>
  </UiDialog>

  <UiDialog :open="dialog === 'method'" kicker="Context, not a recommendation" title="How the signal score is meant to read." @close="dialog = ''">
    <p class="dialog-lede">The planned score brings conversation velocity, source quality, recency and market context together on a 0-100 scale. In this build every value is fixed.</p>
    <div class="method-readout">
      <SignalGauge :value="selected.score" :size="140" />
      <div>
        <h3>{{ selected.symbol }} illustrative score</h3>
        <p>It is not calculated from live sources, it is not a prediction, and it is not a recommendation to buy or sell anything.</p>
      </div>
    </div>
    <button class="ghost-button full" @click="dialog = ''">Close</button>
  </UiDialog>

  <div class="toast-region" role="status" aria-live="polite" aria-atomic="true">
    <div v-if="toast" class="toast">
      <Check :size="16" />
      <span>{{ toast }}</span>
      <button v-if="undoAction" class="toast-undo" @click="undoAction()">Undo</button>
      <button class="icon-button tiny" aria-label="Dismiss notification" @click="toast = ''"><X :size="14" /></button>
    </div>
  </div>
</template>
