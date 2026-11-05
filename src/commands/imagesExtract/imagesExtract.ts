import * as vscode from 'vscode'
import { scan } from './interface/scan'
import { matchesIgnore } from './interface/ignoreMatch'

const REFRESH_DEBOUNCE = 300

export async function imagesExtract(
  extensionUri: vscode.Uri,
  folderUri: vscode.Uri
) {
  const panel = vscode.window.createWebviewPanel(
    'ImgTree.imagesExtract',
    '✨ImgTree',
    vscode.ViewColumn.One,
    {
      enableScripts: true,
      // 允许加载插件内的资源
      localResourceRoots: [
        vscode.Uri.joinPath(extensionUri, 'dist', 'webview'),
        folderUri
      ]
    }
  )

  const indexPath = vscode.Uri.joinPath(
    extensionUri,
    'dist',
    'webview',
    'index.html'
  )

  let html = await vscode.workspace.fs.readFile(indexPath)
  let htmlContent = html.toString()

  // 将资源路径转换为 WebView 可访问的 URI
  const webviewUri = panel.webview.asWebviewUri(
    vscode.Uri.joinPath(extensionUri, 'dist', 'webview')
  )

  // 替换 HTML 中的资源路径（如 /assets/ → webview-uri/assets/）
  htmlContent = htmlContent.replace(
    /src="\.\/(assets\/[^"]+)"/g,
    `src="${webviewUri}/$1"`
  )
  htmlContent = htmlContent.replace(
    /href="\.\/(assets\/[^"]+)"/g,
    `href="${webviewUri}/$1"`
  )

  panel.webview.html = htmlContent

  // webview 当前展示的子目录（初始来自状态还原，之后随 fetchData 更新）
  let currentFolder = ''
  let refreshTimer: NodeJS.Timeout | undefined
  let lastRefreshKey = ''

  // 统一的数据推送：目录树 + 当前目录列表 + 类型
  // force 为 true 时跳过去重（显式请求必须回复，如用户点击目录）
  async function pushRefresh(force = false) {
    const scanFolder = currentFolder
    try {
      const ds = await scan(folderUri, scanFolder)
      if (scanFolder !== currentFolder) {
        // 扫描期间用户切换了目录，丢弃过期结果
        return
      }
      const key = JSON.stringify([
        ds.folders,
        ds.files.map(f => f.path),
        ds.types
      ])
      if (!force && key === lastRefreshKey) {
        // 与上次推送一致（如非图片文件变化），不重复推送
        return
      }
      lastRefreshKey = key
      panel.webview.postMessage({
        command: 'dataRefresh',
        data: {
          code: '200',
          data: {
            folders: ds.folders,
            folder: ds.folder,
            files: ds.files.map(file => {
              if (file.type === 'directory') {
                return file
              }
              return {
                ...file,
                uri: panel.webview
                  .asWebviewUri(vscode.Uri.file(file.path))
                  .toString()
              }
            }),
            types: ds.types
          }
        }
      })
    } catch (err) {
      console.error(err)
      panel.webview.postMessage({
        command: 'dataRefresh',
        data: { code: '500', message: 'ImgTree refresh failed' }
      })
    }
  }

  function scheduleRefresh() {
    if (refreshTimer) {
      clearTimeout(refreshTimer)
    }
    refreshTimer = setTimeout(() => {
      refreshTimer = undefined
      pushRefresh()
    }, REFRESH_DEBOUNCE)
  }

  // 递归监听选中文件夹内的增删改，及时推送最新结构/列表/类型
  const watcher = vscode.workspace.createFileSystemWatcher(
    new vscode.RelativePattern(folderUri, '**/*')
  )

  function onFileEvent(uri: vscode.Uri) {
    // 排除目录内的事件不触发重扫（与扫描时的 excludeFolders 语义一致）
    const ignore =
      vscode.workspace
        .getConfiguration('ImgTree')
        .get<string[]>('excludeFolders') ?? []
    if (matchesIgnore(uri.fsPath, folderUri.fsPath, ignore)) {
      return
    }
    scheduleRefresh()
  }

  watcher.onDidCreate(onFileEvent)
  watcher.onDidChange(onFileEvent)
  watcher.onDidDelete(onFileEvent)

  panel.onDidDispose(() => {
    watcher.dispose()
    if (refreshTimer) {
      clearTimeout(refreshTimer)
    }
  })

  panel.webview.onDidReceiveMessage(message => {
    if (message.command === 'pageReady') {
      panel.webview.postMessage({
        command: 'navigate',
        data: { to: '/imgViewer' }
      })
    } else if (message.command === 'fetchData') {
      // 挂载（带状态还原的目录）或用户选中子目录
      currentFolder = message.data.folder ?? ''
      pushRefresh(true)
    }
  })
}
