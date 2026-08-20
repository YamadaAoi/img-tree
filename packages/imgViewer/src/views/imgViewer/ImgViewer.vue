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
            <FileName v-model:keywords="keywords" />
            <FileType
              :types="fileTypes"
              v-model:selected-types="selectedFileTypes"
            />
          </div>
          <div class="list">
            <FileList
              :files="files"
              :cur-path="curPath"
              :selected-types="selectedFileTypes"
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
import { vscodeApi } from '@/api/vscode'
import type { DirectoryNode, ImageNode } from './imgViewerAble'

const prevState = vscodeApi.getState()
const init = ref(true)
const folders = ref<DirectoryNode[]>([])
const curKey = ref(prevState?.folder ?? '')
const files = ref<Array<DirectoryNode | ImageNode>>([])
const curPath = ref(prevState?.file ?? '')
const previewIndex = ref(-1)
const imageList = computed(() =>
  files.value.filter(f => f.type === 'file').map(f => f.path)
)
const fileTypes = ref<string[]>([])
const selectedFileTypes = ref<string[]>([])
const keywords = ref('')

onMounted(() => {
  window.addEventListener('message', onMessage)
  vscodeApi.fetchDirectory()
})

onBeforeUnmount(() => {
  window.removeEventListener('message', onMessage)
})

function onMessage(event: MessageEvent) {
  const message = event.data
  if (message.command === 'dataDirectory' && message.data.code === '200') {
    onDataDirectory(message.data.data ?? [])
  } else if (message.command === 'dataImages' && message.data.code === '200') {
    onDataImages(message.data.data ?? [])
  }
}

function onDataDirectory(data: DirectoryNode[]) {
  folders.value = data
  if (folders.value.length) {
    const prevFolder = curKey.value ? findFolderByPath(curKey.value) : undefined
    if (prevFolder) {
      pickFolder(prevFolder)
    } else {
      pickFolder(folders.value[0])
    }
  }
}

function onDataImages(data: ImageNode[]) {
  const types: string[] = []
  data.forEach(f => {
    const ext = f.ext?.replace('.', '')
    if (ext && types.indexOf(ext) === -1) {
      types.push(ext)
    }
  })
  fileTypes.value = types.concat()
  selectedFileTypes.value = types.concat()

  files.value = files.value.concat(data)
  if (init.value) {
    init.value = false
    const prevFile = curPath.value
      ? files.value.find(f => f.path === curPath.value)
      : undefined
    chooseFile(prevFile)
  } else {
    chooseFile()
  }
}

function findFolderByPath(p: string) {
  let result: DirectoryNode | undefined = undefined

  function check(node: DirectoryNode): boolean {
    if (node.path === p) {
      result = node
      return true
    }
    return node.children ? node.children.some(check) : false
  }

  folders.value.some(check)

  return result
}

function pickFolder(data: DirectoryNode | ImageNode) {
  if (data.type === 'directory') {
    vscodeApi.setState({
      folder: data.path,
      file: curPath.value
    })
    curKey.value = data.path
    files.value = data.children?.length ? data.children.concat() : []
    vscodeApi.fetchImages(data.path)
  }
}

function chooseFile(data?: DirectoryNode | ImageNode) {
  vscodeApi.setState({
    folder: curKey.value,
    file: data?.path
  })
  curPath.value = data?.path ?? ''
  if (data?.path) {
    previewIndex.value = imageList.value.findIndex(src => src === data.path)
  } else {
    previewIndex.value = -1
  }
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
