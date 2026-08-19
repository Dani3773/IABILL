export interface Vendor {
  id: string
  workspaceId: string
  name: string
  serviceProvided: string
  sharedDataCategories: string
  dpaSigned: boolean
  dpaSignedAt: string | null
  securityClausesConfirmed: boolean
  observations: string | null
  createdAt: string
  updatedAt: string
}

export interface VendorRequest {
  workspaceId: string
  name: string
  serviceProvided: string
  sharedDataCategories: string
  dpaSigned: boolean
  dpaSignedAt?: string
  securityClausesConfirmed: boolean
  observations?: string
}