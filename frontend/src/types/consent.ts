export interface ConsentSubmission {
  consenterName: string
  consenterEmail: string
}

export interface ConsentRecord {
  id: string
  consenterName: string
  consenterEmail: string
  consentedAt: string
  ipAddress: string | null
}

export interface PublicConsentInfo {
  found: boolean
  workspaceName: string | null
  processName: string | null
  purpose: string | null
}