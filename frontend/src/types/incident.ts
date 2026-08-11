export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
export type IncidentStatus = 'IDENTIFIED' | 'ASSESSING' | 'ANPD_NOTIFIED' | 'DATA_SUBJECTS_NOTIFIED' | 'RESOLVED'

export interface Incident {
  id: string
  workspaceId: string
  title: string
  description: string
  affectedDataCategories: string
  estimatedAffectedCount: number | null
  severity: IncidentSeverity
  status: IncidentStatus
  discoveredAt: string
  occurredAt: string | null
  anpdNotifiedAt: string | null
  dataSubjectsNotifiedAt: string | null
  mitigationMeasures: string | null
  createdAt: string
  updatedAt: string
}

export interface IncidentRequest {
  workspaceId: string
  title: string
  description: string
  affectedDataCategories: string
  estimatedAffectedCount?: number
  severity: IncidentSeverity
  discoveredAt?: string
  occurredAt?: string
  mitigationMeasures?: string
}

export interface IncidentUpdateRequest {
  description: string
  affectedDataCategories: string
  estimatedAffectedCount?: number
  severity: IncidentSeverity
  mitigationMeasures?: string
}