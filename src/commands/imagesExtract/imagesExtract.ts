import * as vscode from 'vscode'
import { scanDirectories } from './interface/scanDirectories'
import { scanImages } from './interface/scanImages'

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

  panel.webview.onDidReceiveMessage(message => {
    if (message.command === 'pageReady') {
      panel.webview.postMessage({
        command: 'navigate',
        data: { to: '/imgViewer' }
      })
    } else if (message.command === 'fetchDirectory') {
      scanDirectories(folderUri, message.data.state)
        .then(ds => {
          panel.webview.postMessage({
            command: 'dataDirectory',
            data: {
              code: '200',
              data: {
                folders: ds.folders,
                files: ds.files.map(file => {
                  if (file.type === 'directory') {
                    return file
                  } else {
                    return {
                      ...file,
                      uri: panel.webview
                        .asWebviewUri(vscode.Uri.file(file.path))
                        .toString()
                    }
                  }
                }),
                types: ds.types,
                initState: ds.initState
              }
            }
          })
        })
        .catch(err => {
          console.error(err)
          panel.webview.postMessage({
            command: 'dataDirectory',
            data: { code: '500', message: 'ImgTree fetch directory failed' }
          })
        })
    } else if (message.command === 'fetchImages') {
      scanImages(folderUri, message.data.folder)
        .then(ds => {
          panel.webview.postMessage({
            command: 'dataImages',
            data: {
              code: '200',
              data: {
                files: ds.images.map(img => {
                  return {
                    ...img,
                    uri: panel.webview
                      .asWebviewUri(vscode.Uri.file(img.path))
                      .toString()
                  }
                }),
                types: ds.types
              }
            }
          })
        })
        .catch(err => {
          console.error(err)
          panel.webview.postMessage({
            command: 'dataImages',
            data: { code: '500', message: 'ImgTree fetch images failed' }
          })
        })
    }
  })
}
