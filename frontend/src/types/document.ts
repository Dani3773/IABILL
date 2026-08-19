export type DocumentType =
  | 'INVENTARIO_DADOS'
  | 'POLITICA_PRIVACIDADE'
  | 'RELATORIO_CONFORMIDADE'
  | 'RAT'
  | 'RIPD_DPIA'
  | 'POLITICA_SEGURANCA_INFORMACAO'
  | 'MATERIAL_TREINAMENTO'

export type DocumentStatus = 'DRAFT' | 'GENERATED' | 'REVIEWED' | 'APPROVED'

export interface Document {
  id: string
  workspaceId: string
  createdByUserId: string
  type: DocumentType
  title: string
  status: DocumentStatus
  generatedContent: string | null
  reviewRecommended: boolean
  reviewRecommendedReason: string | null
  createdAt: string
  reviewDueAt: string | null
}

export interface DocumentRequest {
  workspaceId: string
  createdByUserId: string
  type: DocumentType
  title: string
}

export interface GenerationRequest {
  instruction: string
}

export interface GenerationResponse {
  documentId: string
  generatedContent: string
  status: DocumentStatus
}