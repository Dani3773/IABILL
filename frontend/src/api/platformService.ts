import { apiClient } from './client'
import type { PlatformTenantSummary } from '../types/platform'
import type { PlatformTenantDetail, PlatformTenantUpdateRequest } from '../types/platform'


export async function fetchAllTenants(): Promise<PlatformTenantSummary[]> {
  const response = await apiClient.get<PlatformTenantSummary[]>('/platform/tenants')
  return response.data
}

export async function fetchTenantDetail(id: string): Promise<PlatformTenantDetail> {
  const response = await apiClient.get<PlatformTenantDetail>(`/platform/tenants/${id}`)
  return response.data
}

export async function updateTenant(id: string, request: PlatformTenantUpdateRequest): Promise<PlatformTenantDetail> {
  const response = await apiClient.put<PlatformTenantDetail>(`/platform/tenants/${id}`, request)
  return response.data
}