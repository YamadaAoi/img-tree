export interface DirectoryNode {
  name: string
  path: string
  type: 'directory'
  children: DirectoryNode[]
}

export interface ImageNode {
  name: string
  path: string
  type: 'file'
  ext: string
}
