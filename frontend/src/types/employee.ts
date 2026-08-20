export interface Employee {
  id: string
  workspaceId: string
  name: string
  jobTitle: string | null
  sectorId: string | null
  sectorName: string | null
  email: string | null
  active: boolean
  createdAt: string
}

export interface EmployeeRequest {
  workspaceId: string
  name: string
  jobTitle?: string
  sectorId?: string
  email?: string
  active: boolean
}