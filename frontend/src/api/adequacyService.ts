import { apiClient } from './client'
import type { AdequacyConfirmation, AdequacyItem } from '../types/adequacy'

export async function fetchAdequacyConfirmations(workspaceId: string): Promise<AdequacyConfirmation[]> {
  const response = await apiClient.get<AdequacyConfirmation[]>(
    `/workspaces/${workspaceId}/adequacy-confirmations`,
  )
  return response.data
}

export async function confirmAdequacyItem(
  workspaceId: string,
  item: AdequacyItem,
): Promise<AdequacyConfirmation> {
  const response = await apiClient.put<AdequacyConfirmation>(
    `/workspaces/${workspaceId}/adequacy-confirmations/${item}`,
  )
  return response.data
}

export async function revokeAdequacyItem(workspaceId: string, item: AdequacyItem): Promise<void> {
  await apiClient.delete(`/workspaces/${workspaceId}/adequacy-confirmations/${item}`)
}
