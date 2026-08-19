<template>
  <div class="img-viewer">
    <div class="folder-tree">
      <ElTree
        :data="folders"
        node-key="path"
        :current-node-key="curKey"
        :default-expand-all="true"
        :highlight-current="true"
        :check-on-click-node="true"
        :expand-on-click-node="false"
        :props="{
          label: 'name'
        }"
        @current-change="pickFolder"
      />
    </div>
    <div class="file-body" @click.stop="chooseFile()">
      <div
        v-for="item in files"
        :key="item.path"
        :class="['file-item', item.path === curPath ? 'picked' : '']"
        @dblclick.stop="pickFolder(item)"
      >
        <div class="file-icon" @click.stop="chooseFile(item)">
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
          {{ item.name }}
        </div>
      </div>
    </div>
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
import { ElTree, ElImage, ElImageViewer } from 'element-plus'
import { clipboard } from '@/util'
import { vscodeApi } from '@/api/vscode'
import folder from '@/assets/images/folder.svg'

interface DirectoryNode {
  name: string
  path: string
  type: 'directory'
  children: DirectoryNode[]
}

interface ImageNode {
  name: string
  path: string
  type: 'file'
  ext: string
}

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

onMounted(() => {
  window.addEventListener('message', onMessage)
  vscodeApi.fetchDirectory()
})

onBeforeUnmount(() => {
  window.removeEventListener('message', onMessage)
})

function onMessage(event: MessageEvent) {
  const message = event.data
  if (message.command === 'dataDirectory') {
    if (message.data.code === '200') {
      folders.value = message.data.data ?? []
      if (folders.value.length) {
        const prevFolder = curKey.value
          ? findFolderByPath(curKey.value)
          : undefined
        if (prevFolder) {
          pickFolder(prevFolder)
        } else {
          pickFolder(folders.value[0])
        }
      }
    }
  } else if (message.command === 'dataImages') {
    if (message.data.code === '200') {
      files.value = files.value.concat(message.data.data ?? [])
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
  display: flex;
  align-items: flex-start;
  justify-content: center;

  .folder-tree {
    width: 300px;
    height: 100%;
    padding: 14px;
    border-right: 1px solid var(--app-border-color);
    overflow: auto;
  }

  .file-body {
    width: calc(100% - 300px);
    height: 100%;
    padding: 16px;
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

  :deep(.el-image-viewer__wrapper) {
    .el-image-viewer__mask {
      opacity: 1;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(10px);
    }
  }
}
</style>
