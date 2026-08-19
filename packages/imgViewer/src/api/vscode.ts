import type { WebviewApi } from 'vscode-webview'

interface CurState {
  folder?: string
  file?: string
}

class VscodeApi {
  #vscode: WebviewApi<unknown> | undefined

  initVscode() {
    if (typeof acquireVsCodeApi !== 'undefined') {
      this.#vscode = acquireVsCodeApi()
    }
  }

  pageReady() {
    this.#vscode?.postMessage({
      command: 'pageReady'
    })
  }

  fetchDirectory() {
    this.#vscode?.postMessage({
      command: 'fetchDirectory'
    })
  }

  fetchImages(folder: string) {
    this.#vscode?.postMessage({
      command: 'fetchImages',
      data: {
        folder
      }
    })
  }

  setState(state: CurState) {
    this.#vscode?.setState(state)
  }

  getState() {
    return this.#vscode?.getState() as CurState
  }
}

export const vscodeApi = new VscodeApi()
