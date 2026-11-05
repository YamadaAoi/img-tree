import type { WebviewApi } from 'vscode-webview'

export interface CurState {
  folder?: string
  file?: string
  excludedTypes?: string[]
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

  fetchData(folder: string) {
    this.#vscode?.postMessage({
      command: 'fetchData',
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
