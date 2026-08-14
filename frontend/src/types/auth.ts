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
  workspaceNeighborhood?: string
  workspacePostalCode?: string
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

export interface SignupResponse {
  success: boolean
  message: string
}

export interface EmailConfirmationResponse {
  success: boolean
  message: string
}