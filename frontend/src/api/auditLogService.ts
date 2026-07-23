import { apiClient } from './client'
import type { AuditLog } from '../types/auditLog'

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  const response = await apiClient.get<AuditLog[]>('/audit-logs')
  return response.data
}