import * as vscode from 'vscode'
import { imagesExtract } from './commands/imagesExtract/imagesExtract'

export function activate(context: vscode.ExtensionContext) {
  console.log('ImgTree is now active!')

  const imagesExtractCommand = vscode.commands.registerCommand(
    'ImgTree.imagesExtract',
    (uri: vscode.Uri) => {
      imagesExtract(context.extensionUri, uri).catch(err => {
        vscode.window.showErrorMessage(`ImgTree start failed: ${err}`)
      })
    }
  )

  context.subscriptions.push(imagesExtractCommand)
}

export function deactivate() {}
