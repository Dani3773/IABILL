import { apiClient } from './client'
import type { ActionItem, ActionItemRequest, ActionItemStatus, SuggestedActionItem } from '../types/actionItem'

export async function fetchActionItems(workspaceId: string): Promise<ActionItem[]> {
  const response = await apiClient.get<ActionItem[]>('/action-items', { params: { workspaceId } })
  return response.data
}

export async function createActionItem(request: ActionItemRequest): Promise<ActionItem> {
  const response = await apiClient.post<ActionItem>('/action-items', request)
  return response.data
}

export async function updateActionItemStatus(id: string, status: ActionItemStatus): Promise<ActionItem> {
  const response = await apiClient.put<ActionItem>(`/action-items/${id}/status`, { status })
  return response.data
}

export async function suggestActionItems(workspaceId: string): Promise<SuggestedActionItem[]> {
  const response = await apiClient.post<SuggestedActionItem[]>('/action-items/suggest', null, {
    params: { workspaceId },
  })
  return response.data
}