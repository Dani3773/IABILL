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
  reviewDueAt: string | null
  isPublished: boolean
  publishedAt: string | null
  createdAt: string
}

export interface DocumentRequest {
  workspaceId: string
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

export interface PublicPrivacyPolicyResponse {
  found: boolean
  workspaceName: string | null
  content: string | null
  publishedAt: string | null
}