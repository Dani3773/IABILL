export type ActionItemStatus = 'PENDING' | 'IN_PROGRESS' | 'DONE'
export type ActionItemSource = 'MANUAL' | 'AI_SUGGESTED'

export interface ActionItem {
  id: string
  workspaceId: string
  title: string
  description: string | null
  status: ActionItemStatus
  source: ActionItemSource
  createdAt: string
}

export interface ActionItemRequest {
  workspaceId: string
  title: string
  description?: string
  source?: ActionItemSource
}

export interface SuggestedActionItem {
  title: string
  description: string
}