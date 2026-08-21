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
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElImageViewer, ElSplitter, ElSplitterPanel } from 'element-plus'
import FolderTree from './folderTree/FolderTree.vue'
import FileList from './fileList/FileList.vue'
import FileType from './fileType/FileType.vue'
import FileName from './fileName/FileName.vue'
import { vscodeApi, type CurState } from '@/api/vscode'
import type { DirectoryNode, ImageNode } from './imgViewerAble'

const folders = ref<DirectoryNode[]>([])
const curKey = ref('')
const files = ref<Array<DirectoryNode | ImageNode>>([])
const curPath = ref('')
const fileTypes = ref<string[]>([])
const selectedFileTypes = ref<string[]>([])
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

onMounted(() => {
  window.addEventListener('message', onMessage)
  vscodeApi.fetchDirectory(vscodeApi.getState())
})

onBeforeUnmount(() => {
  window.removeEventListener('message', onMessage)
})

function onMessage(event: MessageEvent) {
  const message = event.data
  if (message.command === 'dataDirectory' && message.data.code === '200') {
    onDataDirectory(message.data.data ?? {})
  } else if (message.command === 'dataImages' && message.data.code === '200') {
    onDataImages(message.data.data ?? {})
  }
}

function onDataDirectory(data: {
  folders: DirectoryNode[]
  files: Array<DirectoryNode | ImageNode>
  types: string[]
  initState: CurState
}) {
  vscodeApi.setState(data.initState)
  folders.value = data.folders
  curKey.value = data.initState.folder ?? ''
  files.value = data.files
  curPath.value = data.initState.file ?? ''
  keywords.value = data.initState.keywords ?? ''
  fileTypes.value = data.types.concat()
  selectedFileTypes.value = data.initState.selectedFileTypes ?? []
}

function onDataImages(data: { files: ImageNode[]; types: string[] }) {
  fileTypes.value = data.types.concat()
  onSelectedTypesChange(data.types.concat())
  files.value = files.value.concat(data.files)
  chooseFile()
}

function pickFolder(data: DirectoryNode) {
  vscodeApi.mergeState({
    folder: data.path
  })
  curKey.value = data.path
  files.value = data.children?.length ? data.children.concat() : []
  vscodeApi.fetchImages(data.path)
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
  vscodeApi.mergeState({
    selectedFileTypes: newSelectedTypes
  })
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
