<template>
  <div class="img-viewer">
    <ElSplitter>
      <ElSplitterPanel :size="300">
        <div class="folders">
          <FolderTree
            :folders="folders"
            :cur-key="curKey"
            @pick-folder="pickFolder"
          />
        </div>
      </ElSplitterPanel>
      <ElSplitterPanel>
        <div class="files">
          <div class="filters">
            <FileName :keywords="keywords" @keywordsChange="onKeywordsChange" />
            <FileType
              :types="fileTypes"
              :selected-types="selectedFileTypes"
              @selectedTypesChange="onSelectedTypesChange"
            />
          </div>
          <div class="list">
            <FileList
              :files="filteredFiles"
              :cur-path="curPath"
              :keywords="keywords"
              @pick-folder="pickFolder"
              @choose-file="chooseFile"
            />
          </div>
        </div>
      </ElSplitterPanel>
    </ElSplitter>
    <ElImageViewer
      v-if="previewIndex > -1"
      show-progress
      :initial-index="previewIndex"
      :url-list="imageList"
      @close="chooseFile"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeMount, onBeforeUnmount, ref } from 'vue'
import { ElImageViewer, ElSplitter, ElSplitterPanel } from 'element-plus'
import FolderTree from './folderTree/FolderTree.vue'
import FileList from './fileList/FileList.vue'
import FileType from './fileType/FileType.vue'
import FileName from './fileName/FileName.vue'
import { vscodeApi } from '@/api/vscode'
import type { DirectoryNode, ImageNode } from './imgViewerAble'

const folders = ref<DirectoryNode[]>([])
const curKey = ref('')
const files = ref<Array<DirectoryNode | ImageNode>>([])
const curPath = ref('')
const fileTypes = ref<string[]>([])
const selectedFileTypes = ref<string[]>([])
const excludedTypes = ref<string[]>([])
const keywords = ref('')
const filteredFiles = computed(() => {
  return files.value.filter(item => {
    return (
      ((item.type === 'file' &&
        item.ext &&
        selectedFileTypes.value.includes(item.ext)) ||
        item.type === 'directory') &&
      item.name.includes(keywords.value)
    )
  })
})
const filteredImageFiles = computed(() =>
  filteredFiles.value.filter(f => f.type === 'file')
)
const imageList = computed(() => filteredImageFiles.value.map(f => f.uri))
const previewIndex = computed(() => {
  let index = -1
  if (curPath.value) {
    index = filteredImageFiles.value.findIndex(f => f.path === curPath.value)
  }
  return index
})

onBeforeMount(() => {
  window.addEventListener('message', onMessage)
  // 从本地持久化状态播种（keywords/勾选/选中项），host 只负责按目录推数据
  const state = vscodeApi.getState()
  keywords.value = state.keywords ?? ''
  excludedTypes.value = state.excludedTypes ?? []
  curPath.value = state.file ?? ''
  curKey.value = state.folder ?? ''
  vscodeApi.fetchData(state.folder ?? '')
})

onBeforeUnmount(() => {
  window.removeEventListener('message', onMessage)
})

function onMessage(event: MessageEvent) {
  const message = event.data
  if (message.command === 'dataRefresh' && message.data.code === '200') {
    onDataRefresh(message.data.data ?? {})
  }
}

function onDataRefresh(data: {
  folders: DirectoryNode[]
  files: Array<DirectoryNode | ImageNode>
  types: string[]
  folder: string
}) {
  folders.value = data.folders
  if (data.folder !== curKey.value) {
    // 选中目录已被删除时 host 会回退到根目录，跟随切换
    curKey.value = data.folder
    vscodeApi.mergeState({ folder: data.folder })
  }
  // 类型选项始终是当前真实类型；勾选 = 全部类型 - 排除项：
  // 取消勾选且仍存在→保持取消，勾选且仍存在→保持勾选，
  // 新出现的类型→默认勾上，消失的类型→随选项一起消失
  fileTypes.value = data.types.concat()
  const excluded = excludedTypes.value.filter(t => data.types.includes(t))
  excludedTypes.value = excluded
  onSelectedTypesChange(data.types.filter(t => !excluded.includes(t)))
  // 原位替换列表（key 为 path，滚动位置不丢失）
  files.value = data.files
  if (curPath.value && !data.files.some(f => f.path === curPath.value)) {
    chooseFile()
  }
}

function pickFolder(data: DirectoryNode) {
  vscodeApi.mergeState({
    folder: data.path
  })
  curKey.value = data.path
  chooseFile()
  vscodeApi.fetchData(data.path)
}

function chooseFile(file?: string) {
  curPath.value = file ?? ''
  vscodeApi.mergeState({
    file
  })
}

function onKeywordsChange(newKeywords: string) {
  keywords.value = newKeywords
  vscodeApi.mergeState({
    keywords: newKeywords
  })
}

function onSelectedTypesChange(newSelectedTypes: string[]) {
  selectedFileTypes.value = newSelectedTypes
  // 排除项 = 当前全部类型 - 勾选项，作为唯一持久化依据
  excludedTypes.value = fileTypes.value.filter(
    t => !newSelectedTypes.includes(t)
  )
  vscodeApi.mergeState({ excludedTypes: excludedTypes.value })
}
</script>

<style scoped lang="scss">
.img-viewer {
  width: 100%;
  height: 100%;
  border-top: 2px solid var(--el-border-color-light);
  display: flex;
  align-items: flex-start;
  justify-content: center;

  .folders {
    width: 100%;
    height: 100%;
    padding: 14px;
  }

  .files {
    width: 100%;
    height: 100%;
    .filters {
      width: 100%;
      height: 64px;
      padding: 0 16px;
      border-bottom: 2px solid var(--el-border-color-light);
    }
    .list {
      width: 100%;
      height: calc(100% - 64px);
      padding: 16px;
    }
  }

  :deep(.el-image-viewer__wrapper) {
    .el-image-viewer__mask {
      opacity: 1;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(10px);
    }
  }
}
</style>
