import { apiClient } from './client'
import type { Incident, IncidentRequest, IncidentStatus, IncidentUpdateRequest } from '../types/incident'

export async function fetchIncidents(workspaceId: string): Promise<Incident[]> {
  const response = await apiClient.get<Incident[]>('/incidents', { params: { workspaceId } })
  return response.data
}

export async function createIncident(request: IncidentRequest): Promise<Incident> {
  const response = await apiClient.post<Incident>('/incidents', request)
  return response.data
}

export async function updateIncidentDetails(id: string, request: IncidentUpdateRequest): Promise<Incident> {
  const response = await apiClient.put<Incident>(`/incidents/${id}`, request)
  return response.data
}

export async function updateIncidentStatus(id: string, status: IncidentStatus): Promise<Incident> {
  const response = await apiClient.put<Incident>(`/incidents/${id}/status`, null, { params: { status } })
  return response.data
}

export async function notifyAnpd(id: string): Promise<Incident> {
  const response = await apiClient.post<Incident>(`/incidents/${id}/notify-anpd`)
  return response.data
}

export async function notifyDataSubjects(id: string): Promise<Incident> {
  const response = await apiClient.post<Incident>(`/incidents/${id}/notify-data-subjects`)
  return response.data
}