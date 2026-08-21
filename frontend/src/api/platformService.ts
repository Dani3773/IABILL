import { apiClient } from './client'
import type { PlatformTenantSummary } from '../types/platform'
import type { PlatformTenantDetail, PlatformTenantUpdateRequest } from '../types/platform'
import type { PlatformUserRoleUpdateRequest, PlatformPasswordResetResponse, PlatformWorkspace, PlatformWorkspaceUpdateRequest } from '../types/platform'
import type { Workspace } from '../types/workspace'

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

export async function setTenantActive(id: string, active: boolean): Promise<void> {
  await apiClient.put(`/platform/tenants/${id}/active`, null, { params: { active } })
}

export async function updateWorkspace(workspaceId: string, request: PlatformWorkspaceUpdateRequest): Promise<PlatformWorkspace> {
  const response = await apiClient.put<PlatformWorkspace>(`/platform/workspaces/${workspaceId}`, request)
  return response.data
}

export async function fetchWorkspaceDetail(workspaceId: string): Promise<Workspace> {
  const response = await apiClient.get<Workspace>(`/platform/workspaces/${workspaceId}`)
  return response.data
}