export interface Sector {
  id: string
  workspaceId: string
  name: string
  createdAt: string
}

export interface SectorRequest {
  workspaceId: string
  name: string
}