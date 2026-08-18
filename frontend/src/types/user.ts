export type UserRole = 'ADMIN' | 'USER' | 'DPO'

export interface User {
  id: string
  tenantId: string
  username: string
  email: string
  role: UserRole
  jobTitle: string | null
  committeeRole: string | null
  createdAt: string
}

export interface UserRequest {
  tenantId: string
  username: string
  email: string
  role: UserRole
  jobTitle?: string
  committeeRole?: string
}

export interface WorkspaceMembership {
  workspaceId: string
  workspaceName: string
  workspaceType: string
}