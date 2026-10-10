<script setup>
import { computed, ref, watch } from 'vue'
import { money } from '../data/markets'

const props = defineProps({
  market: { type: Object, required: true },
  markets: { type: Array, required: true },
})
const comparisonSymbol = ref('')
const choices = computed(() => props.markets.filter(item => item.symbol !== props.market.symbol))
const comparison = computed(() => choices.value.find(item => item.symbol === comparisonSymbol.value))
watch(() => [props.market.symbol, props.markets], () => {
  if (!choices.value.some(item => item.symbol === comparisonSymbol.value)) comparisonSymbol.value = ''
})

// Every fixture is scaled to its own range, so this chart compares shape, not prices.
function normalizedHistory(asset) {
  const values = (asset?.history ?? []).filter(Number.isFinite)
  if (!values.length) return []
  const low = Math.min(...values)
  const high = Math.max(...values)
  return values.map(value => high === low ? 50 : (value - low) / (high - low) * 100)
}
function points(values) {
  return values.map((value, index) => `${42 + index / Math.max(values.length - 1, 1) * 412},${174 - value * 1.5}`).join(' ')
}
const primaryHistory = computed(() => normalizedHistory(props.market))
const secondaryHistory = computed(() => normalizedHistory(comparison.value))
const chartLabel = computed(() => `${props.market.symbol}${comparison.value ? ` and ${comparison.value.symbol}` : ''}: illustrative 7-day sample trends. Each series is normalized from 0 to 100 within its own range; these are not historical prices.`)
const signedChange = value => `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
</script>

<template>
  <section class="market-comparison" aria-label="Sample market trend and comparison">
    <div class="comparison-heading">
      <div><h3>Read the momentum</h3><p>Sample trend - normalized 0-100</p></div>
      <span class="comparison-period">7D SAMPLE</span>
    </div>
    <div class="comparison-controls">
      <label>Compare with
        <select v-model="comparisonSymbol" aria-label="Compare asset">
          <option value="">No comparison</option>
          <option v-for="asset in choices" :key="asset.symbol" :value="asset.symbol">{{ asset.symbol }} - {{ asset.name }}</option>
        </select>
      </label>
    </div>
    <div class="comparison-legend" aria-hidden="true">
      <span><i class="primary-key"></i>{{ market.symbol }}</span>
      <span v-if="comparison"><i class="secondary-key"></i>{{ comparison.symbol }}</span>
    </div>
    <svg v-if="primaryHistory.length" class="comparison-chart" viewBox="0 0 480 210" role="img" :aria-label="chartLabel">
      <g class="chart-grid" aria-hidden="true"><path d="M42 24H454M42 99H454M42 174H454"/><path d="M42 24V174M248 24V174M454 24V174"/></g>
      <g class="chart-axis" aria-hidden="true">
        <text x="29" y="28" text-anchor="end">100</text><text x="29" y="103" text-anchor="end">50</text><text x="29" y="178" text-anchor="end">0</text>
        <text x="42" y="202">7 days ago</text><text x="454" y="202" text-anchor="end">Now</text>
      </g>
      <polyline class="primary-trend" :points="points(primaryHistory)"/>
      <polyline v-if="comparison" class="secondary-trend" :points="points(secondaryHistory)"/>
      <circle class="primary-end" cx="454" :cy="174 - primaryHistory.at(-1) * 1.5" r="3.5"/>
      <circle v-if="secondaryHistory.length" class="secondary-end" cx="454" :cy="174 - secondaryHistory.at(-1) * 1.5" r="3.5"/>
    </svg>
    <p v-else class="comparison-empty">No sample trend is available for this asset.</p>
    <p class="comparison-caption">Each line uses its own 7-day range. Compare momentum, not price.</p>
    <div v-if="comparison" class="comparison-table-wrap">
      <table class="comparison-table">
        <caption>Token snapshot</caption>
        <thead><tr><th scope="col">Metric</th><th scope="col" class="primary-heading">{{ market.symbol }}</th><th scope="col" class="secondary-heading">{{ comparison.symbol }}</th></tr></thead>
        <tbody>
          <tr><th scope="row">Sample price</th><td>{{ money(market.price) }}</td><td>{{ money(comparison.price) }}</td></tr>
          <tr><th scope="row">24h change</th><td :class="{ 'is-negative': market.change < 0 }">{{ signedChange(market.change) }}</td><td :class="{ 'is-negative': comparison.change < 0 }">{{ signedChange(comparison.change) }}</td></tr>
          <tr><th scope="row">Signal score</th><td>{{ market.score.toFixed(1) }}<small>/100</small></td><td>{{ comparison.score.toFixed(1) }}<small>/100</small></td></tr>
        </tbody>
      </table>
    </div>
    <p class="comparison-status" role="status">{{ comparison ? `Comparing ${market.symbol} with ${comparison.symbol}.` : `Showing ${market.symbol}. No comparison selected.` }}</p>
  </section>
</template>

<style scoped>
.market-comparison { --comparison-text: var(--ink); --comparison-muted: var(--muted); --comparison-line: var(--line); color: var(--comparison-text); font-family: var(--font); width: 100%; min-width: 0; }
.comparison-heading { display: flex; align-items: start; justify-content: space-between; gap: 12px; }
.comparison-heading h3 { margin: 0; font-size: 16px; font-weight: 600; line-height: 1.4; letter-spacing: -.25px; }
.comparison-heading p { margin: 6px 0 0; font-size: 11px; line-height: 1.5; color: var(--comparison-muted); }
.comparison-period { flex-shrink: 0; padding: 5px 7px; border: 1px solid var(--comparison-line); border-radius: var(--radius); font-size: 9px; letter-spacing: .9px; color: var(--comparison-muted); white-space: nowrap; }
.comparison-controls { margin: 18px 0 16px; }
.comparison-controls label { display: flex; align-items: center; gap: 12px; font-size: 12px; color: var(--comparison-muted); }
.comparison-controls select { flex: 1; min-width: 0; width: 0; min-height: 44px; padding: 8px 28px 8px 12px; background: var(--paper); color: var(--comparison-text); border: 1px solid var(--comparison-line); border-radius: var(--radius); font: inherit; color-scheme: dark; cursor: pointer; }
.comparison-controls select:hover { border-color: var(--line-strong); }
.comparison-controls select:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; }
.comparison-legend { display: flex; flex-wrap: wrap; gap: 18px; font-size: 11px; color: var(--comparison-text); }
.comparison-legend > span { display: inline-flex; align-items: center; gap: 7px; }
.comparison-legend i { display: inline-block; width: 20px; height: 0; border-top: 2px solid var(--accent); }
.comparison-legend .secondary-key { border-color: var(--signal); border-top-style: dashed; }
.comparison-chart { display: block; width: 100%; height: auto; overflow: visible; margin: 10px 0 0; }
.chart-grid { fill: none; stroke: var(--comparison-line); stroke-width: .7; }
.chart-grid path + path { stroke-dasharray: 2 5; }
.chart-axis { fill: var(--comparison-muted); font-size: 10px; }
.primary-trend, .secondary-trend { fill: none; stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; vector-effect: non-scaling-stroke; }
.primary-trend { stroke: var(--accent); }
.secondary-trend { stroke: var(--signal); stroke-dasharray: 5 5; }
.primary-end { fill: var(--accent); }
.secondary-end { fill: var(--surface); stroke: var(--signal); stroke-width: 2; }
.comparison-caption { margin: 8px 0 0; color: var(--comparison-muted); font-size: 10px; line-height: 1.6; }
.comparison-empty { padding: 32px 12px; text-align: center; color: var(--comparison-muted); font-size: 13px; }
.comparison-table-wrap { margin-top: 20px; }
.comparison-table { border-collapse: collapse; width: 100%; table-layout: fixed; font-size: 12px; font-variant-numeric: tabular-nums; }
.comparison-table caption { text-align: left; color: var(--comparison-muted); font-size: 10px; padding-bottom: 8px; }
.comparison-table th, .comparison-table td { padding: 10px 0; border-bottom: 1px solid var(--comparison-line); text-align: right; font-weight: 400; }
.comparison-table th:first-child { text-align: left; width: 38%; color: var(--comparison-muted); }
.comparison-table thead th { font-weight: 600; }
.comparison-table .primary-heading { color: var(--accent); }
.comparison-table .secondary-heading { color: var(--signal); }
.comparison-table small { padding-left: 2px; color: var(--comparison-muted); font-size: 9px; }
.comparison-table .is-negative { color: var(--danger); }
.comparison-status { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@media (max-width: 380px) {
  .comparison-heading { gap: 8px; }
  .comparison-heading h3 { font-size: 15px; }
  .comparison-period { font-size: 8px; letter-spacing: .5px; padding-inline: 5px; }
  .comparison-controls label { gap: 9px; }
  .comparison-table { font-size: 11px; }
}
</style>




