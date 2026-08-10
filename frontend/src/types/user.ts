export type UserRole = 'ADMIN' | 'USER' | 'DPO'

export interface User {
  id: string
  tenantId: string
  username: string
  email: string
  role: UserRole
  createdAt: string
}

export interface UserRequest {
  tenantId: string
  username: string
  email: string
  password: string
  role: UserRole
}

export interface WorkspaceMembership {
  workspaceId: string
  workspaceName: string
  workspaceType: string
}