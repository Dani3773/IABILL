import { apiClient } from './client'
import type { Vendor, VendorRequest } from '../types/vendor'

export async function fetchVendors(workspaceId: string): Promise<Vendor[]> {
  const response = await apiClient.get<Vendor[]>(`/vendors/workspace/${workspaceId}`)
  return response.data
}

export async function createVendor(request: VendorRequest): Promise<Vendor> {
  const response = await apiClient.post<Vendor>('/vendors', request)
  return response.data
}

export async function updateVendor(id: string, request: VendorRequest): Promise<Vendor> {
  const response = await apiClient.put<Vendor>(`/vendors/${id}`, request)
  return response.data
}

export async function deleteVendor(id: string): Promise<void> {
  await apiClient.delete(`/vendors/${id}`)
}