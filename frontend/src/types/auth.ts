export interface LoginResponse {
  token: string
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
  tenantId: string
  email: string
  password: string
}