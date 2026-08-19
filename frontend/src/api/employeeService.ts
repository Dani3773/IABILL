import { apiClient } from './client'
import type { Employee, EmployeeRequest } from '../types/employee'

export async function fetchEmployees(workspaceId: string): Promise<Employee[]> {
  const response = await apiClient.get<Employee[]>(`/employees/workspace/${workspaceId}`)
  return response.data
}

export async function createEmployee(request: EmployeeRequest): Promise<Employee> {
  const response = await apiClient.post<Employee>('/employees', request)
  return response.data
}

export async function updateEmployee(id: string, request: EmployeeRequest): Promise<Employee> {
  const response = await apiClient.put<Employee>(`/employees/${id}`, request)
  return response.data
}

export async function deleteEmployee(id: string): Promise<void> {
  await apiClient.delete(`/employees/${id}`)
}