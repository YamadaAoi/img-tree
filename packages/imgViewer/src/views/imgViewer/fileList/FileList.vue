<template>
  <div class="file-body" @click.stop="handleChooseFile()">
    <div
      v-for="item in props.files"
      :key="item.path"
      :class="['file-item', item.path === props.curPath ? 'picked' : '']"
      @dblclick.stop="handlePickFolder(item)"
    >
      <div
        :class="['file-icon', item.type === 'file' ? 'is-file' : '']"
        @click.stop="handleChooseFile(item)"
      >
        <ElImage
          class="file-img"
          :src="item.type === 'file' ? item.uri : folder"
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
        <WordHighlight :text="item.name" :keywords="props.keywords" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElImage } from 'element-plus'
import WordHighlight from '@/components/wordHighlight/WordHighlight.vue'
import { clipboard } from '@/util'
import type { DirectoryNode, ImageNode } from '../imgViewerAble'
import folder from '@/assets/images/folder.svg'

const props = defineProps<{
  files: Array<DirectoryNode | ImageNode>
  curPath: string
  keywords: string
}>()
const emits = defineEmits<{
  (e: 'pick-folder', item: DirectoryNode): void
  (e: 'choose-file', item?: string): void
}>()

function handlePickFolder(item: DirectoryNode | ImageNode) {
  if (item.type === 'directory') {
    emits('pick-folder', item)
  }
}

function handleChooseFile(item?: DirectoryNode | ImageNode) {
  emits('choose-file', item?.path)
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
      /* 容器自身的底色（不透明），这是棋盘格真正的“白色格子” */
      background-color: var(--vscode-editor-background);

      .file-img {
        width: 100%;
        height: 100%;
      }
    }

    .is-file {
      background-image:
        linear-gradient(45deg, rgba(128, 128, 128, 0.15) 25%, transparent 25%),
        linear-gradient(-45deg, rgba(128, 128, 128, 0.15) 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, rgba(128, 128, 128, 0.15) 75%),
        linear-gradient(-45deg, transparent 75%, rgba(128, 128, 128, 0.15) 75%);
      background-size: 10px 10px;
      background-position:
        0 0,
        0 5px,
        5px -5px,
        -5px 0px;
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
