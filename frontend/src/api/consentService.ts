import { apiClient } from './client'
import type { ConsentSubmission, ConsentRecord, PublicConsentInfo } from '../types/consent'

export async function fetchPublicConsentInfo(activityId: string): Promise<PublicConsentInfo> {
  const response = await apiClient.get<PublicConsentInfo>(`/consent/public/${activityId}`)
  return response.data
}

export async function submitConsent(activityId: string, request: ConsentSubmission): Promise<ConsentRecord> {
  const response = await apiClient.post<ConsentRecord>(`/consent/public/${activityId}`, request)
  return response.data
}

export async function fetchConsentRecords(activityId: string): Promise<ConsentRecord[]> {
  const response = await apiClient.get<ConsentRecord[]>(`/consent/activity/${activityId}`)
  return response.data
}