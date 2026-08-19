export interface Employee {
  id: string
  workspaceId: string
  name: string
  jobTitle: string | null
  department: string | null
  email: string | null
  active: boolean
  createdAt: string
}

export interface EmployeeRequest {
  workspaceId: string
  name: string
  jobTitle?: string
  department?: string
  email?: string
  active: boolean
}