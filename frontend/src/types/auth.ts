export interface AuthMeResponse {
  userId: string
  tenantId: string
  role: 'ADMIN' | 'USER' | 'SUPER_ADMIN'
}

export interface SignupRequest {
  tenantName: string
  workspaceName: string
  workspaceDocumentId: string
  workspaceCountry: string
  workspaceState?: string
  workspaceCity?: string
  workspaceStreet?: string
  workspaceAddressNumber?: string
  workspacePhone?: string
  workspaceLegalRegimes: ('LGPD' | 'RGPD')[]
  adminUsername: string
  adminEmail: string
  adminPassword: string
}

export interface LoginRequest {
  email: string
  password: string
}