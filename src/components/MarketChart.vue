<script setup>
import { computed } from 'vue'
const props = defineProps({ market: { type: Object, required: true }, mini: Boolean })
const points = computed(() => props.market.history.map((value, index, values) => `${index / (values.length - 1) * 300},${100 - value}`).join(' '))
const color = computed(() => props.market.change >= 0 ? 'var(--success, #347059)' : 'var(--danger, #b33e32)')
</script>
<template><svg viewBox="0 0 300 100" preserveAspectRatio="none" :role="mini ? undefined : 'img'" :aria-hidden="mini ? true : undefined" :aria-label="mini ? undefined : `${market.symbol} illustrative seven-day price trend`"><template v-if="!mini"><path d="M0 25H300 M0 50H300 M0 75H300" stroke="var(--line, #dedfd6)" stroke-width="1" stroke-dasharray="3 5"/><polygon :points="`0,100 ${points} 300,100`" :fill="color" fill-opacity=".06"/></template><polyline :points="points" fill="none" :stroke="color" :stroke-width="mini ? 1.5 : 2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke" /></svg></template>
