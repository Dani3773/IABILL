import { apiClient } from './client'
import type { ComplianceSummary } from '../types/complianceSummary'

export async function fetchComplianceSummary(workspaceId: string): Promise<ComplianceSummary> {
  const response = await apiClient.get<ComplianceSummary>(`/workspaces/${workspaceId}/compliance-summary`)
  return response.data
}