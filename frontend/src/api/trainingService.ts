import { apiClient } from './client'
import type { Training, TrainingRequest } from '../types/training'

export async function fetchTrainings(workspaceId: string): Promise<Training[]> {
  const response = await apiClient.get<Training[]>(`/trainings/workspace/${workspaceId}`)
  return response.data
}

export async function createTraining(request: TrainingRequest): Promise<Training> {
  const response = await apiClient.post<Training>('/trainings', request)
  return response.data
}

export async function deleteTraining(id: string): Promise<void> {
  await apiClient.delete(`/trainings/${id}`)
}