<template>
  <div class="file-name">
    <div class="file-name-label">FileName:</div>
    <div class="file-name-value">
      <ElInput
        :model-value="props.keywords"
        size="small"
        style="width: 60%"
        placeholder=""
        clearable
        @input="onKeywordsChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElInput } from 'element-plus'

const props = defineProps<{
  keywords: string
}>()
const emits = defineEmits<{
  (e: 'keywordsChange', val: string): void
}>()

function onKeywordsChange(val: string) {
  emits('keywordsChange', val)
}
</script>

<style scoped lang="scss">
.file-name {
  width: 100%;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  .file-name-label {
    width: 70px;
    flex-shrink: 0;
    font-size: var(--el-form-label-font-size);
    color: var(--el-text-color-regular);
  }
  .file-name-value {
    flex: 1;
  }
}
</style>
