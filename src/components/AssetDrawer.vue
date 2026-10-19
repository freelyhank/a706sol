<script setup>
// The asset inspector: a right-hand sheet that slides over the workspace instead of being a
// second column in the page. Small screens turn it into a bottom sheet.
import { computed, nextTick, ref, useId, watch } from 'vue'
import { ArrowRight, Star, X } from 'lucide-vue-next'
import TrendField from './TrendField.vue'
import SignalGauge from './SignalGauge.vue'
import { money, normalized, range, signed } from '../data/markets.js'

const props = defineProps({
  market: { type: Object, default: null },
  saved: { type: Boolean, default: false },
  open: Boolean,
})
const emit = defineEmits(['close', 'toggle-save', 'open-preview'])
const element = ref(null)
const titleId = useId()
const extent = computed(() => (props.market ? range(props.market.history) : null))
const curve = computed(() => (props.market ? normalized(props.market.history) : []))

watch(() => props.open, async open => {
  if (!open) return
  await nextTick()
  element.value?.querySelector('.drawer-title')?.focus({ preventScroll: true })
})
</script>

<template>
  <div v-if="market" class="asset-drawer" :class="{ open }" role="dialog" :aria-modal="open" :aria-labelledby="titleId" ref="element">
    <header class="drawer-head">
      <div class="drawer-ident">
        <span class="asset-glyph" :class="market.tone">{{ market.monogram }}</span>
        <div>
          <h2 class="drawer-title" :id="titleId" tabindex="-1">{{ market.symbol }}</h2>
          <p>{{ market.name }} <span class="dot-sep">/</span> {{ market.category }}</p>
        </div>
      </div>
      <div class="drawer-tools">
        <button class="icon-button" :aria-pressed="saved" :aria-label="(saved ? 'Remove ' : 'Save ') + market.symbol + (saved ? ' from' : ' to') + ' watchlist'" @click="emit('toggle-save', market)">
          <Star :size="17" :fill="saved ? 'currentColor' : 'none'" />
        </button>
        <button class="icon-button" aria-label="Close inspector" @click="emit('close')"><X :size="18" /></button>
      </div>
    </header>

    <div class="drawer-quote">
      <strong>{{ money(market.price) }}</strong>
      <span :class="market.change >= 0 ? 'is-up' : 'is-down'">{{ signed(market.change) }} <em>24h sample</em></span>
    </div>

    <div class="drawer-block">
      <div class="drawer-curve">
        <TrendField :history="curve" :height="104" grid :tone="market.change >= 0 ? 'up' : 'down'" :label="`${market.symbol} illustrative seven-day sample shape, normalised`" />
      </div>
      <p class="curve-note">Normalised 0-100 within this asset's own sample window. Shape, not price.</p>
    </div>

    <dl class="drawer-facts">
      <div><dt>Signal</dt><dd>{{ market.score.toFixed(1) }}<em>/100</em></dd></div>
      <div><dt>Sample volume</dt><dd>{{ market.volume }}</dd></div>
      <div><dt>Window low</dt><dd>{{ extent.low.toFixed(0) }}</dd></div>
      <div><dt>Window high</dt><dd>{{ extent.high.toFixed(0) }}</dd></div>
    </dl>

    <div class="drawer-gauge"><SignalGauge :value="market.score" :size="126" /></div>

    <div class="drawer-actions">
      <button class="primary-button" @click="emit('open-preview', market)">Preview an amount <ArrowRight :size="16" /></button>
      <button class="ghost-button" :aria-pressed="saved" @click="emit('toggle-save', market)">
        <Star :size="15" :fill="saved ? 'currentColor' : 'none'" />{{ saved ? 'Saved' : 'Save to watchlist' }}
      </button>
    </div>
    <p class="drawer-foot">Static illustration. No quote is live and no order is placed.</p>
  </div>
</template>
