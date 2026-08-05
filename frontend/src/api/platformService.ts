import { apiClient } from './client'
import type { PlatformTenantSummary } from '../types/platform'
import type { PlatformTenantDetail, PlatformTenantUpdateRequest } from '../types/platform'
import type { PlatformUserRoleUpdateRequest, PlatformPasswordResetResponse } from '../types/platform'



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

export async function updateUserRole(userId: string, role: PlatformUserRoleUpdateRequest['role']): Promise<void> {
  await apiClient.put(`/platform/users/${userId}/role`, { role })
}

export async function resetUserPassword(userId: string): Promise<PlatformPasswordResetResponse> {
  const response = await apiClient.post<PlatformPasswordResetResponse>(`/platform/users/${userId}/reset-password`)
  return response.data
}