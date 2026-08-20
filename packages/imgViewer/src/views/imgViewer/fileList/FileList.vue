<template>
  <div class="file-body" @click.stop="handleChooseFile()">
    <div
      v-for="item in filteredFiles"
      :key="item.path"
      :class="['file-item', item.path === props.curPath ? 'picked' : '']"
      @dblclick.stop="handlePickFolder(item)"
    >
      <div class="file-icon" @click.stop="handleChooseFile(item)">
        <ElImage
          class="file-img"
          :src="item.type === 'file' ? item.path : folder"
          fit="scale-down"
          lazy
          show-progress
        />
      </div>
      <div
        class="file-name"
        :title="item.name"
        @click.stop="clipboard(item.name)"
      >
        <WordHighlight
          v-if="item.type === 'file'"
          :text="item.name"
          :keywords="props.keywords"
        />
        <template v-else>
          {{ item.name }}
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ElImage } from 'element-plus'
import WordHighlight from '@/components/wordHighlight/WordHighlight.vue'
import { clipboard } from '@/util'
import type { DirectoryNode, ImageNode } from '../imgViewerAble'
import folder from '@/assets/images/folder.svg'

const props = defineProps<{
  files: Array<DirectoryNode | ImageNode>
  curPath: string
  selectedTypes: string[]
  keywords: string
}>()
const emits = defineEmits<{
  (e: 'pick-folder', item: DirectoryNode): void
  (e: 'choose-file', item?: DirectoryNode | ImageNode): void
}>()
const filteredFiles = computed(() => {
  return props.files.filter(item => {
    if (item.type === 'directory') {
      return true
    }
    const ext = item.ext?.replace('.', '')
    if (!ext) {
      return false
    }
    return (
      props.selectedTypes.includes(ext) && item.name.includes(props.keywords)
    )
  })
})

function handlePickFolder(item: DirectoryNode | ImageNode) {
  if (item.type === 'directory') {
    emits('pick-folder', item)
  }
}

function handleChooseFile(item?: DirectoryNode | ImageNode) {
  emits('choose-file', item)
}
</script>

<style scoped lang="scss">
.file-body {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: repeat(auto-fit, 158px);
  grid-gap: 16px;
  align-content: start;
  justify-content: start;
  overflow-y: auto;

  .file-item {
    width: 158px;
    height: 178px;
    position: relative;
    padding: 6px 6px 0 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;

    .file-icon {
      width: 100%;
      height: calc(100% - 30px);
      display: flex;
      align-items: center;
      justify-content: center;

      .file-img {
        width: 100%;
        height: 100%;
      }
    }

    .file-name {
      width: 100%;
      height: 30px;
      line-height: 30px;
      cursor: copy;
      color: var(--app-item-label);
      text-align: center;
      font-size: 14px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    &:hover {
      background-color: var(--app-item-hover-bg-color);
    }
  }
  .picked {
    background-color: var(--app-item-hover-bg-color);
  }
}
</style>
