import type { Employee } from './employee'

export type TrainingMethod = 'PRESENCIAL' | 'ONLINE' | 'MATERIAL_ESCRITO'

export const TRAINING_METHOD_LABELS: Record<TrainingMethod, string> = {
  PRESENCIAL: 'Presencial',
  ONLINE: 'Online',
  MATERIAL_ESCRITO: 'Material escrito',
}

export interface Training {
  id: string
  workspaceId: string
  title: string
  description: string | null
  method: TrainingMethod
  trainingDate: string
  attendees: Employee[]
  createdAt: string
}

export interface TrainingRequest {
  workspaceId: string
  title: string
  description?: string
  method: TrainingMethod
  trainingDate: string
  attendeeIds: string[]
}