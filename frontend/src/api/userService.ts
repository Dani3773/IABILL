import { apiClient } from './client'
import type { User, UserRequest, WorkspaceMembership } from '../types/user'

export async function fetchUsers(): Promise<User[]> {
  const response = await apiClient.get<User[]>('/users')
  return response.data
}

export async function createUser(request: UserRequest): Promise<User> {
  const response = await apiClient.post<User>('/users', request)
  return response.data
}

export async function fetchUserWorkspaces(userId: string): Promise<WorkspaceMembership[]> {
  const response = await apiClient.get<WorkspaceMembership[]>(`/users/${userId}/workspaces`)
  return response.data
}

export async function addUserToWorkspace(userId: string, workspaceId: string): Promise<void> {
  await apiClient.post(`/users/${userId}/workspaces/${workspaceId}`)
}

export async function toggleDpoSubstitute(userId: string): Promise<User> {
  const response = await apiClient.put<User>(`/users/${userId}/dpo-substitute`)
  return response.data
}