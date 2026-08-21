import type { WebviewApi } from 'vscode-webview'

export interface CurState {
  folder?: string
  file?: string
  selectedFileTypes?: string[]
  keywords?: string
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

  fetchDirectory(state: CurState) {
    this.#vscode?.postMessage({
      command: 'fetchDirectory',
      data: {
        state
      }
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

  mergeState(state: CurState) {
    const prevState = this.getState()
    this.setState({
      ...prevState,
      ...state
    })
  }

  setState(state: CurState) {
    this.#vscode?.setState(state)
  }

  getState() {
    return (this.#vscode?.getState() ?? {}) as CurState
  }
}

export const vscodeApi = new VscodeApi()
