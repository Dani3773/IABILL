import { apiClient } from './client'
import type { Workspace, WorkspaceRequest } from '../types/workspace'

export async function fetchWorkspaces(): Promise<Workspace[]> {
  const response = await apiClient.get<Workspace[]>('/workspaces')
  return response.data
}

export async function createWorkspace(request: WorkspaceRequest): Promise<Workspace> {
  const response = await apiClient.post<Workspace>('/workspaces', request)
  return response.data
}