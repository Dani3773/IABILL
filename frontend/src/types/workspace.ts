export interface Workspace {
  id: string
  tenantId: string
  name: string
  type: 'MATRIZ' | 'FILIAL'
  documentId: string
  country: string | null
  state: string | null
  city: string | null
  street: string | null
  addressNumber: string | null
  phone: string | null
  legalRegimes: ('LGPD' | 'RGPD')[]
  createdAt: string
}

export interface WorkspaceRequest {
  tenantId: string
  name: string
  type: 'MATRIZ' | 'FILIAL'
  documentId: string
  country: string
  state?: string
  city?: string
  street?: string
  addressNumber?: string
  phone?: string
  legalRegimes: ('LGPD' | 'RGPD')[]
}