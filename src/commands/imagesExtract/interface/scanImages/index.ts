import * as vscdoe from 'vscode'
import path from 'node:path'
import * as vscode from 'vscode'
import fg from 'fast-glob'

interface ImageNode {
  name: string
  path: string
  type: 'file'
  ext: string
}

export async function scanImages(rootDir: vscode.Uri, dirPath: string) {
  const config = vscdoe.workspace.getConfiguration('ImgTree')
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

  const images: ImageNode[] = files.map(file => {
    return {
      name: path.basename(file),
      path: file,
      type: 'file',
      ext: path.extname(file).toLowerCase()
    }
  })

  return images
}
