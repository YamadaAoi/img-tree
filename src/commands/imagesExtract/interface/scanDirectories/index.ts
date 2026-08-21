import * as vscode from 'vscode'
import path from 'node:path'
import fg from 'fast-glob'
import { scanImages } from '../scanImages'
import type { CurState, DirectoryNode, ImageNode } from '../types'

function findFolderByPath(p: string, folders: DirectoryNode[]) {
  let result: DirectoryNode | undefined

  function check(node: DirectoryNode): boolean {
    if (node.path === p) {
      result = node
      return true
    }
    return node.children ? node.children.some(check) : false
  }

  folders.some(check)

  return result
}

async function getInitFilesAndState(
  rootDir: vscode.Uri,
  state: CurState,
  folders: DirectoryNode[]
) {
  let files: ImageNode[] = []
  let folderChildren: DirectoryNode[] = []
  let types: string[] = []
  const initState: CurState = {}

  if (folders.length) {
    initState.folder = folders[0].path
    folderChildren = folders[0].children?.length
      ? folders[0].children.concat()
      : []
    if (state.folder) {
      // 如果状态记录了选中的目录
      const prevFolder = findFolderByPath(state.folder, folders)
      if (prevFolder) {
        // 如果目录还真实存在，还原目录选中状态
        initState.folder = prevFolder.path
        folderChildren = prevFolder.children?.length
          ? prevFolder.children.concat()
          : []
      }
    }

    const result = await scanImages(rootDir, initState.folder)
    files = result.images
    types = result.types
    if (files.length) {
      initState.selectedFileTypes = types
      if (Array.isArray(state.selectedFileTypes)) {
        // 如果状态记录了选中的文件类型，则根据当前实际文件类型取交集
        initState.selectedFileTypes = state.selectedFileTypes.filter(type =>
          types.includes(type)
        )
      }

      if (state.file) {
        // 如果状态记录了选中的文件
        const prevFile = files.find(f => f.path === state.file)
        if (prevFile) {
          // 如果文件还真实存在，还原文件选中状态
          initState.file = prevFile.path
        }
      }
    }
  }

  if (state.keywords) {
    // 如果状态记录了关键词
    initState.keywords = state.keywords
  }

  return {
    files: [...folderChildren, ...files],
    types,
    initState
  }
}

export async function scanDirectories(rootDir: vscode.Uri, state: CurState) {
  const cwd = rootDir.fsPath
  const config = vscode.workspace.getConfiguration('ImgTree')
  const ignore = config.get<string[]>('excludeFolders')
  // 使用 glob 获取所有子目录（包括嵌套）
  const dirPaths = await fg('**/', {
    cwd,
    onlyDirectories: true, // 只匹配目录
    absolute: false, // 相对路径（相对于 cwd）
    deep: 10, // 最大递归深度（避免无限深）
    suppressErrors: true, // 忽略无法访问的目录错误
    ignore
  })

  // 添加根目录本身
  dirPaths.unshift('') // 根目录用空字符串表示

  // 构建树形结构
  const treeMap = new Map<string, DirectoryNode>()
  const root: DirectoryNode = {
    name: path.basename(path.resolve(cwd)),
    path: '.',
    type: 'directory',
    children: []
  }
  treeMap.set('', root) // 根目录映射

  // 按路径层级排序，确保父目录先处理
  dirPaths.sort((a, b) => a.split('/').length - b.split('/').length)

  for (const relativeDir of dirPaths) {
    if (relativeDir === '') continue // 跳过根目录（已添加）

    const dirPath = relativeDir.replace(/\/$/, '') // 去掉末尾斜杠
    const parts = dirPath.split('/')
    const name = parts[parts.length - 1]
    const parentPath = parts.slice(0, -1).join('/') || ''

    const node: DirectoryNode = {
      name,
      path: relativeDir,
      type: 'directory',
      children: []
    }

    treeMap.set(relativeDir, node)

    // 找到父节点并添加
    const parent = treeMap.get(parentPath)
    if (parent) {
      parent.children.push(node)
    }
  }

  const folders = [root]
  const { files, types, initState } = await getInitFilesAndState(
    rootDir,
    state,
    folders
  )

  return {
    folders,
    files,
    types,
    initState
  }
}
