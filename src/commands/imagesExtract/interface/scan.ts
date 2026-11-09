import * as vscode from 'vscode'
import path from 'node:path'
import fg from 'fast-glob'
import type { DirectoryNode, ImageNode } from './types'

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

// 扫描目录树 + 目标目录内的图片（目标目录不存在则回退到根目录）
export async function scan(rootDir: vscode.Uri, dirPath: string) {
  const cwd = rootDir.fsPath
  const config = vscode.workspace.getConfiguration('ImgTree')
  const excludeFolders = config.get<string[]>('excludeFolders')
  const excludeFiles = config.get<string[]>('excludeFiles')
  const imgTypes =
    config.get<string>('imgTypes') ??
    '*.{jpg,jpeg,png,svg,gif,webp,bmp,tiff,avif}'

  // 目录树：glob 获取所有子目录（包括嵌套）
  const dirPaths = await fg('**/', {
    cwd,
    onlyDirectories: true, // 只匹配目录
    absolute: false, // 相对路径（相对于 cwd）
    deep: 10, // 最大递归深度（避免无限深）
    suppressErrors: true, // 忽略无法访问的目录错误
    ignore: excludeFolders
  })

  // 添加根目录本身
  dirPaths.unshift('') // 根目录用空字符串表示

  // 构建树形结构（节点 path 与 ImageNode 一致，统一为绝对路径）
  const treeMap = new Map<string, DirectoryNode>()
  const root: DirectoryNode = {
    name: path.basename(path.resolve(cwd)),
    path: cwd,
    type: 'directory',
    children: []
  }
  treeMap.set('', root) // 根目录映射

  // 按路径层级排序，确保父目录先处理
  dirPaths.sort((a, b) => a.split('/').length - b.split('/').length)

  for (const relativeDir of dirPaths) {
    if (relativeDir === '') continue // 跳过根目录（已添加）

    const normalizedDir = relativeDir.replace(/\/$/, '') // 去掉末尾斜杠
    const parts = normalizedDir.split('/')
    const name = parts[parts.length - 1]
    const parentPath = parts.slice(0, -1).join('/') || ''

    const node: DirectoryNode = {
      name,
      path: path.resolve(cwd, relativeDir),
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
  // 解析目标目录，不存在（如已被删除）则回退到根目录
  const folder = findFolderByPath(dirPath, folders) ?? folders[0]
  const folderChildren = folder.children?.length ? folder.children.concat() : []

  // 当前目录内的图片（folder.path 已是绝对路径）
  const imgPaths = await fg(imgTypes, {
    cwd: folder.path,
    onlyFiles: true,
    absolute: true,
    caseSensitiveMatch: false,
    suppressErrors: true,
    ignore: excludeFiles
  })

  const types: string[] = []
  const images: ImageNode[] = imgPaths.map(file => {
    const ext = path.extname(file).toLowerCase().replace('.', '')
    if (!types.includes(ext)) {
      types.push(ext)
    }
    return {
      name: path.basename(file),
      path: file,
      uri: '',
      type: 'file',
      ext
    }
  })

  return {
    folders,
    folder: folder.path,
    files: [...folderChildren, ...images],
    types
  }
}
