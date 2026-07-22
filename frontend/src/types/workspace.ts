export interface Workspace {
  id: string
  tenantId: string
  name: string
  type: 'MATRIZ' | 'FILIAL'
  documentId: string
  createdAt: string
}

export interface WorkspaceRequest {
  tenantId: string
  name: string
  type: 'MATRIZ' | 'FILIAL'
  documentId: string
}