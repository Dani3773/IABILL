import { apiClient } from './client'
import type {
  PublicWorkspaceInfo,
  DataSubjectRequest,
  DataSubjectRequestSubmission,
  DataSubjectRequestStatusUpdate,
} from '../types/dataSubjectRequest'

// Endpoints publicos - sem autenticacao, apiClient funciona igual pois nao
// depende de cookie de sessao para essas rotas (SecurityConfig permite acesso livre)
export async function lookupWorkspace(documentId: string): Promise<PublicWorkspaceInfo> {
  const response = await apiClient.get<PublicWorkspaceInfo>(`/public/workspaces/${documentId}`)
  return response.data
}

export async function submitDataSubjectRequest(
  documentId: string,
  request: DataSubjectRequestSubmission,
): Promise<DataSubjectRequest> {
  const response = await apiClient.post<DataSubjectRequest>(
    `/public/workspaces/${documentId}/data-subject-requests`,
    request,
  )
  return response.data
}

// Endpoints autenticados - gestao pela empresa
export async function fetchDataSubjectRequests(workspaceId: string): Promise<DataSubjectRequest[]> {
  const response = await apiClient.get<DataSubjectRequest[]>('/data-subject-requests', {
    params: { workspaceId },
  })
  return response.data
}

export async function updateDataSubjectRequestStatus(
  id: string,
  request: DataSubjectRequestStatusUpdate,
): Promise<DataSubjectRequest> {
  const response = await apiClient.put<DataSubjectRequest>(`/data-subject-requests/${id}/status`, request)
  return response.data
}