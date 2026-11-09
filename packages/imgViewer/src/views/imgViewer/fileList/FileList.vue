<template>
  <div class="file-body" @click.stop="handleChooseFile()">
    <div
      v-for="item in props.files"
      :key="item.path"
      :class="['file-item', item.path === props.curPath ? 'picked' : '']"
      @dblclick.stop="handlePickFolder(item)"
    >
      <ElCheckbox
        :model-value="props.checkList.includes(item.path)"
        size="small"
        :class="[
          'item-check',
          props.checkList.includes(item.path) ? 'show-check' : ''
        ]"
        @change="
          val => {
            handleCheckItem(val, item.path)
          }
        "
      ></ElCheckbox>
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
        @contextmenu.stop.prevent="showEdit(item)"
      >
        <ElInput
          v-if="curItem?.path === item.path"
          :ref="el => bindInputRef(el)"
          v-model="newName"
          size="small"
          @keydown.enter="commitName(item, $event)"
          @keydown.esc="cancelEdit($event)"
          @blur="
            () => {
              changeName(item)
            }
          "
        >
          <template v-if="item.type === 'file'" #suffix>
            .{{ item.ext }}
          </template>
        </ElInput>
        <span v-else @click.stop="clipboard(item.name)">
          <WordHighlight :text="item.name" :keywords="props.keywords" />
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'
import {
  ElImage,
  ElInput,
  ElCheckbox,
  type CheckboxValueType,
  type InputInstance
} from 'element-plus'
import WordHighlight from '@/components/wordHighlight/WordHighlight.vue'
import { vscodeApi } from '@/api/vscode'
import { clipboard } from '@/util'
import type { DirectoryNode, ImageNode } from '../imgViewerAble'
import folder from '@/assets/images/folder.svg'

const props = defineProps<{
  files: Array<DirectoryNode | ImageNode>
  curPath: string
  keywords: string
  checkList: string[]
}>()
const emits = defineEmits<{
  (e: 'pick-folder', item: DirectoryNode): void
  (e: 'choose-file', item?: string): void
  (e: 'check-item', item: boolean, p: string): void
}>()
const curItem = ref<DirectoryNode | ImageNode>()
const newName = ref('')
const nameInput = ref<InputInstance>()

// v-for 内的模板 ref 会被 Vue 收集成数组，改用函数 ref 直接取组件实例
function bindInputRef(el: unknown) {
  nameInput.value = (el as InputInstance | null) ?? undefined
}

function handlePickFolder(item: DirectoryNode | ImageNode) {
  if (item.type === 'directory') {
    emits('pick-folder', item)
  }
}

function handleChooseFile(item?: DirectoryNode | ImageNode) {
  // 仅文件写入选中态；目录路径不属于 state.file，避免污染持久化状态
  if (!item || item.type === 'file') {
    emits('choose-file', item?.path)
  }
}

function handleCheckItem(flag: CheckboxValueType, p: string) {
  emits('check-item', !!flag, p)
}

function showEdit(item: DirectoryNode | ImageNode) {
  curItem.value = item
  const suffix = item.type === 'file' ? `.${item.ext}` : ''
  newName.value =
    suffix && item.name.endsWith(suffix)
      ? item.name.slice(0, -suffix.length)
      : item.name
  nextTick(() => {
    nameInput.value?.focus()
  })
}

function changeName(item: DirectoryNode | ImageNode) {
  const name = `${newName.value}${item.type === 'file' ? `.${item.ext}` : ''}`
  // 编辑期间条目被外部删除（列表已刷新）时不提交，避免必然失败的重命名
  const exists = props.files.some(f => f.path === item.path)
  if (newName.value && exists && item.name !== name) {
    vscodeApi.renameFile(item.path, name)
  }
  curItem.value = undefined
  newName.value = ''
}

// Enter 提交；输入法确认候选时的 Enter（isComposing）不算提交
function commitName(item: DirectoryNode | ImageNode, e: Event | KeyboardEvent) {
  if ((e as KeyboardEvent).isComposing) {
    return
  }
  changeName(item)
}

// Esc 取消：清空输入使随后的 blur 不触发提交；取消输入法候选时跳过
function cancelEdit(e?: Event | KeyboardEvent) {
  if ((e as KeyboardEvent)?.isComposing) {
    return
  }
  newName.value = ''
  curItem.value = undefined
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

    &:hover {
      .item-check {
        display: inline-flex;
      }
    }

    .item-check {
      display: none;
      height: auto;
      position: absolute;
      top: 6px;
      left: 6px;
    }

    .show-check {
      display: inline-flex;
    }

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
