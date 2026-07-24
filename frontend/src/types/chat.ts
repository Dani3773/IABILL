export interface ChatConversation {
  id: string
  title: string | null
  createdAt: string
  updatedAt: string
}

export interface ChatMessage {
  id: string
  role: 'USER' | 'ASSISTANT'
  content: string
  actionsTaken: string[] | null
  createdAt: string
}