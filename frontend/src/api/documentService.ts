import { apiClient } from './client'
import type {
  Document,
  DocumentRequest,
  GenerationRequest,
  GenerationResponse,
} from '../types/document'

export async function fetchDocumentsByWorkspace(workspaceId: string): Promise<Document[]> {
  const response = await apiClient.get<Document[]>('/documents', {
    params: { workspaceId },
  })
  return response.data
}

export async function fetchDocumentById(id: string): Promise<Document> {
  const response = await apiClient.get<Document>(`/documents/${id}`)
  return response.data
}

export async function createDocument(request: DocumentRequest): Promise<Document> {
  const response = await apiClient.post<Document>('/documents', request)
  return response.data
}

export async function generateDocumentContent(
  id: string,
  request: GenerationRequest
): Promise<GenerationResponse> {
  const response = await apiClient.post<GenerationResponse>(`/documents/${id}/generate`, request)
  return response.data
}

export async function reviewDocument(id: string): Promise<Document> {
  const response = await apiClient.put<Document>(`/documents/${id}/review`)
  return response.data
}

export async function rejectDocument(id: string, reason: string): Promise<Document> {
  const response = await apiClient.put<Document>(`/documents/${id}/reject`, { reason })
  return response.data
}

export async function approveDocument(id: string): Promise<Document> {
  const response = await apiClient.put<Document>(`/documents/${id}/approve`)
  return response.data
}

export async function updateDocumentContent(id: string, content: string): Promise<Document> {
  const response = await apiClient.put<Document>(`/documents/${id}/content`, { content })
  return response.data
}