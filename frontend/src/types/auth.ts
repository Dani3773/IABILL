export interface AuthMeResponse {
  userId: string
  tenantId: string
  role: 'ADMIN' | 'USER'
}

export interface SignupRequest {
  tenantName: string
  tenantDocumentId: string
  tenantCountry: string
  adminUsername: string
  adminEmail: string
  adminPassword: string
}

export interface LoginRequest {
  email: string
  password: string
}