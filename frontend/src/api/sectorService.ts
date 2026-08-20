import { apiClient } from './client'
import type { Sector, SectorRequest } from '../types/sector'

export async function fetchSectors(workspaceId: string): Promise<Sector[]> {
  const response = await apiClient.get<Sector[]>(`/sectors/workspace/${workspaceId}`)
  return response.data
}

export async function createSector(request: SectorRequest): Promise<Sector> {
  const response = await apiClient.post<Sector>('/sectors', request)
  return response.data
}

export async function deleteSector(id: string): Promise<void> {
  await apiClient.delete(`/sectors/${id}`)
}