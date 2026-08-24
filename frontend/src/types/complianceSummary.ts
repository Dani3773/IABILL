export interface ComplianceSummary {
  ropaActivityCount: number
  vendorsTotal: number
  vendorsWithDpaSigned: number
  employeesActiveTotal: number
  employeesTrainedCount: number
  documentsOverdueCount: number
  incidentsOpenCount: number
  dsrPendingCount: number
  dpoDesignated: boolean
  dpoName: string | null
  consentActivitiesTotal: number
  consentActivitiesMissingProof: number
  retentionOverdueCount: number
  incidentNotificationOverdueCount: number
  privacyPolicyPublished: boolean
}