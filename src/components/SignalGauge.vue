<script setup>
// A radial gauge, used for the signal score. Rendered as a segmented arc so it reads as
// instrumentation rather than decoration.
import { computed } from 'vue'

const props = defineProps({
  value: { type: Number, required: true },
  max: { type: Number, default: 100 },
  size: { type: Number, default: 132 },
  label: { type: String, default: 'Signal score' },
})

const SEGMENTS = 28
const R = 52
const CX = 62
const CY = 62
const START = -220
const SWEEP = 260

const ratio = computed(() => Math.min(Math.max(props.value / props.max, 0), 1))
const segments = computed(() => Array.from({ length: SEGMENTS }, (_, index) => {
  const angle = START + (SWEEP / (SEGMENTS - 1)) * index
  const rad = (angle * Math.PI) / 180
  const inner = R - 11
  const outer = R
  const x1 = CX + Math.cos(rad) * inner
  const y1 = CY + Math.sin(rad) * inner
  const x2 = CX + Math.cos(rad) * outer
  const y2 = CY + Math.sin(rad) * outer
  return { x1, y1, x2, y2, live: index / (SEGMENTS - 1) <= ratio.value }
}))
const tier = computed(() => (ratio.value >= 0.8 ? 'High' : ratio.value >= 0.65 ? 'Building' : 'Quiet'))
</script>

<template>
  <figure class="signal-gauge" :style="{ '--gauge-size': size + 'px' }">
    <svg viewBox="0 0 124 124" role="img" :aria-label="`${label}: ${value} out of ${max}, ${tier}`">
      <g class="gauge-track">
        <line v-for="(segment, index) in segments" :key="index" :x1="segment.x1" :y1="segment.y1" :x2="segment.x2" :y2="segment.y2" />
      </g>
      <g class="gauge-live">
        <line v-for="(segment, index) in segments.filter(s => s.live)" :key="index" :x1="segment.x1" :y1="segment.y1" :x2="segment.x2" :y2="segment.y2" />
      </g>
    </svg>
    <figcaption>
      <strong>{{ value.toFixed(1) }}<em>/{{ max }}</em></strong>
      <span>{{ tier }}</span>
    </figcaption>
  </figure>
</template>

<style scoped>
.signal-gauge { position: relative; width: var(--gauge-size); height: var(--gauge-size); margin: 0; flex: none; }
svg { width: 100%; height: 100%; }
line { stroke-width: 3; stroke-linecap: butt; }
.gauge-track line { stroke: var(--line-soft); }
.gauge-live line { stroke: var(--mint); }
figcaption { position: absolute; inset: 26% 0 auto; display: grid; justify-items: center; gap: 2px; text-align: center; }
figcaption strong { font-size: calc(var(--gauge-size) * .21); font-weight: 600; letter-spacing: -.03em; font-variant-numeric: tabular-nums; }
figcaption strong em { font-style: normal; font-size: .55em; color: var(--faint); }
figcaption span { font-size: calc(var(--gauge-size) * .086); text-transform: uppercase; letter-spacing: .16em; color: var(--mint); }
</style>
