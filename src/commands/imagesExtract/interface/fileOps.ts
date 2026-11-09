import * as vscode from 'vscode'
import path from 'node:path'

// 校验目标路径位于监听根目录内，防止误操作目录树之外的文件
function assertUnderRoot(rootDir: vscode.Uri, targetPath: string) {
  const relative = path.relative(rootDir.fsPath, targetPath)
  if (!relative || relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(`target is outside the watched folder: ${targetPath}`)
  }
}

// 重命名（同目录换名；workspace.fs.rename 亦可用于移动，这里只暴露重命名）
export async function renameFile(
  rootDir: vscode.Uri,
  sourcePath: string,
  newName: string
) {
  if (
    !newName ||
    newName === '.' ||
    newName === '..' ||
    /[\\/]/.test(newName)
  ) {
    throw new Error(`invalid file name: ${newName}`)
  }
  assertUnderRoot(rootDir, sourcePath)
  const source = vscode.Uri.file(sourcePath)
  const target = vscode.Uri.file(path.join(path.dirname(sourcePath), newName))
  // 目标已存在时直接报错，不覆盖
  await vscode.workspace.fs.rename(source, target, { overwrite: false })
}

// 批量删除文件/文件夹（进系统回收站）
// 批内存在祖先-后代关系（如目录及其内部文件）时只删祖先，避免后者报“不存在”
export async function deleteEntries(rootDir: vscode.Uri, paths: string[]) {
  if (!paths.length) {
    return
  }
  const normalized = paths.map(p => {
    assertUnderRoot(rootDir, p)
    return p.split(path.sep).join('/')
  })

  const sorted = normalized.concat().sort((a, b) => a.length - b.length)
  const topPaths: string[] = []
  for (const p of sorted) {
    const covered = topPaths.some(r => p === r || p.startsWith(`${r}/`))
    if (!covered) {
      topPaths.push(p)
    }
  }

  const failures: string[] = []
  for (const p of topPaths) {
    try {
      await vscode.workspace.fs.delete(vscode.Uri.file(p), {
        recursive: true,
        useTrash: true
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      failures.push(`${path.basename(p)}: ${message}`)
    }
  }
  if (failures.length) {
    throw new Error(failures.join('\n'))
  }
}
