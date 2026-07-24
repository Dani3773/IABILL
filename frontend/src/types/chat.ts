export interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
  actionsTaken?: string[]
}

export interface ChatHistoryEntry {
  role: 'user' | 'model'
  text: string
}

export interface ChatRequest {
  workspaceId: string
  message: string
  history: ChatHistoryEntry[]
}

export interface ChatResponse {
  reply: string
  actionsTaken: string[]
}