<template>
  <template v-if="arr.length">
    <template v-for="(str, i) in arr">
      <mark
        v-if="str.toLowerCase() === props.keywords?.toLowerCase()"
        :key="i"
        class="m-highlight"
      >
        {{ str }}
      </mark>
      <template v-else>{{ str }}</template>
    </template>
  </template>
  <template v-else>{{ props.text ?? '' }}</template>
</template>

<script setup lang="ts">
import { computed } from 'vue'

defineOptions({
  inheritAttrs: false
})
const props = defineProps<{
  text: string
  keywords?: string
}>()
const filterText = computed(() => {
  const origin = props.keywords ? `${props.keywords}` : ''
  return origin.replace(/[-\\^$|?*+(){}.\/]/g, '\\$&')
})
const arr = computed(() =>
  props.text && filterText.value
    ? props.text.split(
        new RegExp(`(?<=${filterText.value})|(?=${filterText.value})`, 'i')
      )
    : []
)
</script>

<style scoped lang="scss">
.m-highlight {
  background-color: var(--app-mark-bg-color);
  color: var(--app-mark-color);
  padding: 0.05em 0.2em;
  border-radius: 3px;
  font-weight: bold;
  box-decoration-break: clone;
}
</style>
