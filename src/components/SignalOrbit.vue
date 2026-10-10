<script setup>
import { ArrowUpRight } from 'lucide-vue-next'
defineProps({ markets: { type: Array, required: true } })
defineEmits(['select'])
</script>

<template>
  <div class="signal-orbit" role="group" aria-label="Explore the sample market universe">
    <div class="orbit-coordinate"><span>YOUR MARKET UNIVERSE</span><span>05 ASSETS / ONE PERSPECTIVE</span></div>
    <svg class="orbit-drawing" viewBox="0 0 620 440" aria-hidden="true">
      <circle cx="316" cy="229" r="210" fill="none" stroke="#67d6c5" stroke-opacity=".08" stroke-width="1"/>
      <g fill="none" stroke="#3a484b" stroke-width="1"><ellipse cx="316" cy="229" rx="259" ry="107" transform="rotate(-28 316 229)"/><ellipse cx="316" cy="229" rx="203" ry="152" transform="rotate(24 316 229)"/><circle cx="316" cy="229" r="104" stroke-dasharray="2 9"/><path d="M34 229H596M316 28V422" stroke-dasharray="2 7"/></g>
      <g fill="none" stroke="#67d6c5"><path d="M91 302A259 107 -28 0 1 541 156" stroke-width="2"/><circle cx="316" cy="229" r="62" stroke-width="1" stroke-opacity=".35"/><path d="M283 214A37 37 0 0 1 345 205M350 231A37 37 0 0 1 307 265M287 249A37 37 0 0 1 282 224" stroke-width="9" stroke-linecap="round"/></g>
      <circle cx="316" cy="229" r="8" fill="#67d6c5"/><circle cx="91" cy="302" r="4" fill="#67d6c5"/><circle cx="541" cy="156" r="4" fill="#67d6c5"/>
      <g fill="#869693" font-family="Consolas,monospace" font-size="9"><text x="305" y="25">N / 01</text><text x="567" y="250">E / 02</text><text x="301" y="437">S / 03</text><text x="18" y="250">W / 04</text></g>
    </svg>
    <button v-for="(market, index) in [markets[0], markets[3], markets[4]]" :key="market.symbol" class="orbit-asset" :class="'orbit-asset-' + index" :aria-label="'Explore ' + market.symbol + ' market'" @click="$emit('select', market)">
      <span class="orbit-token" :class="market.tone">{{ market.monogram }}</span><span><strong>{{ market.symbol }}</strong><small>{{ market.category }}</small></span><span class="orbit-change">+{{ market.change.toFixed(2) }}%<ArrowUpRight :size="14" /></span>
    </button>
    <div class="orbit-bottom"><span><i></i> A CLEARER VIEW STARTS HERE</span><small>ILLUSTRATIVE MARKET DATA</small></div>
  </div>
</template>



