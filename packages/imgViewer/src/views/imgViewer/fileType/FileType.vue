<template>
  <div class="file-type">
    <div class="file-type-label">FileType:</div>
    <div class="file-type-value">
      <ElCheckboxGroup
        size="small"
        :model-value="props.selectedTypes"
        :options="fileTypes"
        @change="onTypeChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElCheckboxGroup, type CheckboxValueType } from 'element-plus'

const props = defineProps<{
  types: string[]
  selectedTypes: string[]
}>()
const emits = defineEmits<{
  (e: 'update:selectedTypes', types: string[]): void
}>()
const fileTypes = ref<{ value: string; label: string }[]>([])

watch(
  () => props.types,
  newTypes => {
    fileTypes.value = newTypes.map(type => ({
      label: type,
      value: type
    }))
  },
  { immediate: true }
)

function onTypeChange(types: CheckboxValueType[]) {
  emits('update:selectedTypes', types as string[])
}
</script>

<style scoped lang="scss">
.file-type {
  width: 100%;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  .file-type-label {
    width: 70px;
    flex-shrink: 0;
    font-size: var(--el-form-label-font-size);
    color: var(--el-text-color-regular);
  }
  .file-type-value {
    flex: 1;
  }
}
</style>
