<script setup>
import { nextTick, onUnmounted, ref, useId, watch } from 'vue'
import { X } from 'lucide-vue-next'

const props = defineProps({
  open: Boolean,
  title: { type: String, required: true },
  kicker: { type: String, default: '' },
  wide: Boolean,
})
const emit = defineEmits(['close'])
const element = ref(null)
const titleId = useId()

function trapFocus(event) {
  if (event.key !== 'Tab') return
  const controls = [...element.value.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), [tabindex="0"]')].filter(control => control.getClientRects().length)
  if (!controls.length) { event.preventDefault(); return }
  const first = controls[0]
  const last = controls[controls.length - 1]
  if (event.shiftKey && (document.activeElement === first || !element.value.contains(document.activeElement))) { event.preventDefault(); last.focus() }
  else if (!event.shiftKey && (document.activeElement === last || !element.value.contains(document.activeElement))) { event.preventDefault(); first.focus() }
}
watch(() => props.open, async open => {
  await nextTick()
  if (!element.value) return
  if (open && !element.value.open) { element.value.showModal(); document.body.classList.add('dialog-open') }
  else if (!open && element.value.open) { element.value.close(); if (!document.querySelector('dialog[open]')) document.body.classList.remove('dialog-open') }
}, { immediate: true })
onUnmounted(() => { if (element.value?.open) document.body.classList.remove('dialog-open') })
</script>

<template>
  <dialog ref="element" class="dialog" :class="{ 'dialog-wide': wide }" :aria-labelledby="titleId" @keydown="trapFocus" @cancel.prevent="emit('close')" @click.self="emit('close')">
    <div class="dialog-card">
      <header class="dialog-head">
        <div>
          <p v-if="kicker" class="dialog-kicker">{{ kicker }}</p>
          <h2 :id="titleId">{{ title }}</h2>
        </div>
        <button class="icon-button" aria-label="Close dialog" @click="emit('close')" autofocus><X :size="18" /></button>
      </header>
      <div class="dialog-body"><slot /></div>
    </div>
  </dialog>
</template>
