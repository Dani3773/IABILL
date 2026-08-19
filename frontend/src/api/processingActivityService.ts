import { apiClient } from './client'
import type { ProcessingActivity, ProcessingActivityRequest } from '../types/processingActivity'

export async function fetchProcessingActivities(workspaceId: string): Promise<ProcessingActivity[]> {
  const response = await apiClient.get<ProcessingActivity[]>(`/processing-activities/workspace/${workspaceId}`)
  return response.data
}

export async function createProcessingActivity(request: ProcessingActivityRequest): Promise<ProcessingActivity> {
  const response = await apiClient.post<ProcessingActivity>('/processing-activities', request)
  return response.data
}

export async function updateProcessingActivity(id: string, request: ProcessingActivityRequest): Promise<ProcessingActivity> {
  const response = await apiClient.put<ProcessingActivity>(`/processing-activities/${id}`, request)
  return response.data
}

export async function deleteProcessingActivity(id: string): Promise<void> {
  await apiClient.delete(`/processing-activities/${id}`)
}

export async function dismissRipdSuggestion(id: string): Promise<ProcessingActivity> {
  const response = await apiClient.put<ProcessingActivity>(`/processing-activities/${id}/dismiss-ripd-suggestion`)
  return response.data
}