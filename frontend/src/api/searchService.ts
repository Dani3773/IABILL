import { apiClient } from './client'
import type { SemanticSearchResult } from '../types/search'

export async function semanticSearch(workspaceId: string, query: string): Promise<SemanticSearchResult[]> {
  const response = await apiClient.post<SemanticSearchResult[]>('/documents/search', {
    workspaceId,
    query,
    limit: 5,
  })
  return response.data
}