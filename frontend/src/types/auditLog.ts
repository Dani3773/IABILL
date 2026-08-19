export type AuditAction =
  | 'CREATE'
  | 'UPDATE'
  | 'DELETE'
  | 'VIEW'
  | 'AI_GENERATE'
  | 'AI_REVIEW'
  | 'APPROVE'
  | 'EXPORT'
  | 'REJECT'

export type AuditEntityType =
  | 'TENANT'
  | 'USER'
  | 'WORKSPACE'
  | 'DOCUMENT'
  | 'DOCUMENT_CHUNK'
  | 'ACTION_ITEM'
  | 'INCIDENT'
  | 'DATA_SUBJECT_REQUEST'
  | 'PROCESSING_ACTIVITY'

export interface AuditLog {
  id: string
  tenantId: string
  userId: string | null
  username: string | null
  action: AuditAction
  entityType: AuditEntityType
  entityId: string
  metadata: Record<string, unknown> | null
  createdAt: string
}