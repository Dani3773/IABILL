export interface PlatformTenantSummary {
  id: string
  name: string
  documentId: string
  country: string
  createdAt: string
  userCount: number
  workspaceCount: number
  documentCount: number
}

export interface PlatformUser {
  id: string
  username: string
  email: string
  role: 'ADMIN' | 'USER' | 'SUPER_ADMIN'
}

export interface PlatformWorkspace {
  id: string
  name: string
  type: 'MATRIZ' | 'FILIAL'
  documentId: string
}

export interface PlatformTenantDetail {
  id: string
  name: string
  documentId: string
  country: string
  createdAt: string
  users: PlatformUser[]
  workspaces: PlatformWorkspace[]
}

export interface PlatformTenantUpdateRequest {
  name: string
  documentId: string
  country: string
}

export interface PlatformUserRoleUpdateRequest {
  role: 'ADMIN' | 'USER' | 'SUPER_ADMIN'
}

export interface PlatformPasswordResetResponse {
  temporaryPassword: string
}