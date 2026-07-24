import { apiClient } from './client'
import type { ChatConversation, ChatMessage } from '../types/chat'

export async function createConversation(workspaceId: string): Promise<ChatConversation> {
  const response = await apiClient.post<ChatConversation>(
    '/chat/conversations',
    null,
    { params: { workspaceId } }
  )
  return response.data
}

export async function listConversations(workspaceId: string): Promise<ChatConversation[]> {
  const response = await apiClient.get<ChatConversation[]>('/chat/conversations', {
    params: { workspaceId },
  })
  return response.data
}

export async function getConversationMessages(conversationId: string): Promise<ChatMessage[]> {
  const response = await apiClient.get<ChatMessage[]>(
    `/chat/conversations/${conversationId}/messages`
  )
  return response.data
}

export async function sendConversationMessage(conversationId: string, message: string): Promise<ChatMessage> {
  const response = await apiClient.post<ChatMessage>(
    `/chat/conversations/${conversationId}/messages`,
    { message }
  )
  return response.data
}