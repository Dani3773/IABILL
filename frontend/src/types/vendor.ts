export type TransferSafeguard = 'DECISAO_ADEQUACAO' | 'CLAUSULAS_CONTRATUAIS_PADRAO' | 'CONSENTIMENTO_ESPECIFICO' | 'OUTRO'

export interface Vendor {
  id: string
  workspaceId: string
  sectorId: string | null
  sectorName: string | null
  name: string
  serviceProvided: string
  sharedDataCategories: string
  dpaSigned: boolean
  dpaSignedAt: string | null
  securityClausesConfirmed: boolean
  observations: string | null
  involvesInternationalTransfer: boolean
  destinationCountry: string | null
  transferSafeguard: TransferSafeguard | null
  transferSafeguardDetails: string | null
  createdAt: string
  updatedAt: string
}
export interface VendorRequest {
  workspaceId: string
  sectorId?: string
  name: string
  serviceProvided: string
  sharedDataCategories: string
  dpaSigned: boolean
  dpaSignedAt?: string
  securityClausesConfirmed: boolean
  observations?: string
  involvesInternationalTransfer: boolean
  destinationCountry?: string
  transferSafeguard?: TransferSafeguard
  transferSafeguardDetails?: string
}