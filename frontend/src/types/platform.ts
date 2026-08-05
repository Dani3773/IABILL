export interface PlatformTenantSummary {
  id: string
  name: string
  documentId: string
  country: string
  createdAt: string
  userCount: number
  workspaceCount: number
  documentCount: number
  active : boolean
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
  documentId: BigIntToLocaleStringOptions
}

export interface PlatformTenantDetail {
  id: string
  name: string
  documentId: string
  country: string
  createdAt: string
  users: PlatformUser[]
  workspaces: PlatformWorkspace[]
  active : boolean
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