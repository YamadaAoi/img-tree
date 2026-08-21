import * as vscode from 'vscode'
import path from 'node:path'
import fg from 'fast-glob'
import type { ImageNode } from '../types'

export async function scanImages(rootDir: vscode.Uri, dirPath: string) {
  const config = vscode.workspace.getConfiguration('ImgTree')
  const ignore = config.get<string[]>('excludeFiles')
  const imgTypes =
    config.get<string>('imgTypes') ??
    '*.{jpg,jpeg,png,svg,gif,webp,bmp,tiff,avif}'

  const cwd = vscode.Uri.joinPath(rootDir, dirPath).fsPath

  const files = await fg(imgTypes, {
    cwd,
    onlyFiles: true,
    absolute: true,
    caseSensitiveMatch: false,
    suppressErrors: true,
    ignore
  })

  const types: string[] = []
  const images: ImageNode[] = files.map(file => {
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

  return { images, types }
}
