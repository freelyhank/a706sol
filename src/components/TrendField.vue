<script setup>
// A wide-view trend field: a filled area plus a stroke, with an optional baseline.
import { computed } from 'vue'

const props = defineProps({
  history: { type: Array, required: true },
  width: { type: Number, default: 320 },
  height: { type: Number, default: 96 },
  tone: { type: String, default: 'up' },
  grid: { type: Boolean, default: false },
  label: { type: String, default: '' },
})

const pad = computed(() => (props.grid ? 10 : 2))
const points = computed(() => {
  const values = props.history.filter(Number.isFinite)
  if (values.length < 2) return []
  const low = Math.min(...values)
  const high = Math.max(...values)
  const span = high - low || 1
  const innerW = props.width - pad.value * 2
  const innerH = props.height - pad.value * 2
  return values.map((value, index) => ({
    x: pad.value + (index / (values.length - 1)) * innerW,
    y: pad.value + innerH - ((value - low) / span) * innerH,
  }))
})
const line = computed(() => points.value.map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' '))
const area = computed(() => {
  if (!points.value.length) return ''
  const first = points.value[0]
  const last = points.value.at(-1)
  return `${first.x.toFixed(2)},${props.height} ${line.value} ${last.x.toFixed(2)},${props.height}`
})
const id = `vf-${Math.random().toString(36).slice(2, 9)}`
const stroke = computed(() => (props.tone === 'down' ? 'var(--ember)' : 'var(--mint)'))
const end = computed(() => points.value.at(-1))
const gridLines = computed(() => {
  if (!props.grid) return []
  const innerH = props.height - pad.value * 2
  return [0, 0.25, 0.5, 0.75, 1].map(step => pad.value + innerH * step)
})
</script>

<template>
  <div class="trend-field">
    <svg :viewBox="`0 0 ${width} ${height}`" preserveAspectRatio="none" :role="label ? 'img' : undefined" :aria-label="label || undefined" :aria-hidden="label ? undefined : 'true'">
      <defs>
        <linearGradient :id="id" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="stroke" stop-opacity=".34" />
          <stop offset="100%" :stop-color="stroke" stop-opacity="0" />
        </linearGradient>
      </defs>
      <g v-if="grid" class="trend-grid">
        <line v-for="y in gridLines" :key="y" :x1="pad" :x2="width - pad" :y1="y" :y2="y" />
      </g>
      <polygon v-if="area" :points="area" :fill="`url(#${id})`" />
      <polyline v-if="line" class="trend-line" :points="line" :stroke="stroke" vector-effect="non-scaling-stroke" />
      <circle v-if="end" class="trend-node" :cx="end.x" :cy="end.y" r="3.4" :fill="stroke" vector-effect="non-scaling-stroke" />
    </svg>
  </div>
</template>

<style scoped>
.trend-field { width: 100%; min-width: 0; min-height: 0; }
svg { display: block; width: 100%; height: 100%; max-height: 100%; overflow: visible; }
.trend-line { fill: none; stroke-width: 2; stroke-linejoin: round; stroke-linecap: round; }
.trend-node { stroke: var(--panel); stroke-width: 2; }
.trend-grid line { stroke: var(--line-soft); stroke-width: 1; stroke-dasharray: 2 6; vector-effect: non-scaling-stroke; }
</style>
