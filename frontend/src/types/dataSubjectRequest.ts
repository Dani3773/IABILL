export type DataSubjectRequestType = 'ACCESS' | 'CORRECTION' | 'DELETION' | 'PORTABILITY' | 'ANONYMIZATION'
export type DataSubjectRequestStatus = 'RECEIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED'

export interface PublicWorkspaceInfo {
  found: boolean
  workspaceName: string | null
}

export interface DataSubjectRequestSubmission {
  requesterName: string
  requesterEmail: string
  requesterDocumentId?: string
  requestType: DataSubjectRequestType
  description: string
}

export interface DataSubjectRequestStatusUpdate {
  status: DataSubjectRequestStatus
  rejectionReason?: string
}

export interface DataSubjectRequest {
  id: string
  workspaceId: string
  requesterName: string
  requesterEmail: string
  requesterDocumentId: string | null
  requestType: DataSubjectRequestType
  description: string
  status: DataSubjectRequestStatus
  rejectionReason: string | null
  linkedActionItemId: string | null
  createdAt: string
}