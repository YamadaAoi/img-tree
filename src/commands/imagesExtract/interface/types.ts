export interface DirectoryNode {
  name: string
  path: string
  type: 'directory'
  children: DirectoryNode[]
}

export interface ImageNode {
  name: string
  path: string
  uri: string
  type: 'file'
  ext: string
}

export interface CurState {
  folder?: string
  file?: string
  selectedFileTypes?: string[]
  keywords?: string
}
