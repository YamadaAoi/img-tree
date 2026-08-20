<template>
  <div class="folder-tree">
    <ElTree
      :data="props.folders"
      node-key="path"
      :current-node-key="props.curKey"
      :default-expand-all="true"
      :highlight-current="true"
      :check-on-click-node="true"
      :expand-on-click-node="false"
      :props="{
        label: 'name'
      }"
      @current-change="handlePickFolder"
    />
  </div>
</template>

<script setup lang="ts">
import { ElTree } from 'element-plus'
import type { DirectoryNode } from '../imgViewerAble'

const props = defineProps<{
  folders: DirectoryNode[]
  curKey: string
}>()
const emits = defineEmits<{
  (e: 'pick-folder', item: DirectoryNode): void
}>()

function handlePickFolder(item: DirectoryNode) {
  emits('pick-folder', item)
}
</script>

<style scoped lang="scss">
.folder-tree {
  width: 100%;
  height: 100%;
  overflow: auto;
}
</style>
