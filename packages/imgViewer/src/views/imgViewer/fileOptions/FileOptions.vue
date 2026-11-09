<template>
  <div class="file-options">
    <ElCheckbox
      :model-value="isAllChecked"
      :indeterminate="isIndeterminate"
      size="small"
      @change="onCheckAllChange"
    />
    <span class="check-num">
      ( {{ props.checked.length }} / {{ props.total }} )
    </span>
    <ElButton
      type="danger"
      size="small"
      :disabled="props.checked.length === 0"
      @click="handleDelete"
    >
      DELETE
    </ElButton>
  </div>
</template>

<script setup lang="ts">
import { computed, toRaw } from 'vue'
import { ElButton, ElCheckbox, type CheckboxValueType } from 'element-plus'
import { vscodeApi } from '@/api/vscode'

const props = defineProps<{
  checked: string[]
  total: number
}>()
const emits = defineEmits<{
  (e: 'check-all-change', flag: boolean): void
}>()

const isAllChecked = computed(() => props.checked.length === props.total)
const isIndeterminate = computed(
  () => props.checked.length > 0 && props.checked.length < props.total
)

function onCheckAllChange(val: CheckboxValueType) {
  emits('check-all-change', !!val)
}

function handleDelete() {
  if (props.checked.length > 0) {
    // 删除成功后 host 的 watcher 会推 dataRefresh，
    // 父级对列表的 watch 会按仍存在的路径修剪勾选，这里无需回传
    vscodeApi.deleteEntries(toRaw(props.checked))
  }
}
</script>

<style scoped lang="scss">
.file-options {
  width: 100%;
  height: 48px;
  padding: 0 16px;
  border-top: 2px solid var(--el-border-color-light);
  display: flex;
  align-items: center;
  justify-content: flex-start;

  .check-num {
    margin: 0 8px;
    font-size: var(--el-form-label-font-size);
    color: var(--el-text-color-regular);
  }
}
</style>
