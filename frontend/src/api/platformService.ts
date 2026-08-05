import { apiClient } from './client'
import type { PlatformTenantSummary } from '../types/platform'

export async function fetchAllTenants(): Promise<PlatformTenantSummary[]> {
  const response = await apiClient.get<PlatformTenantSummary[]>('/platform/tenants')
  return response.data
}