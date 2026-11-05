import { useState, useRef, useEffect, type FormEvent } from 'react'
import { MessageCircle, X, Send, Sparkles, Plus, ArrowLeft } from 'lucide-react'
import {
  createConversation,
  listConversations,
  getConversationMessages,
  sendConversationMessage,
} from '../api/chatService'
import { getErrorMessage } from '../api/errorUtils'
import type { ChatConversation, ChatMessage } from '../types/chat'

interface Props {
  workspaceId: string
}

type View = 'list' | 'conversation'

export function ChatWidget({ workspaceId }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [view, setView] = useState<View>('list')
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  function openWidget() {
    setIsOpen(true)
    loadConversations()
  }

  function loadConversations() {
    setIsLoading(true)
    setError(null)
    listConversations(workspaceId)
      .then(setConversations)
      .catch((err) => setError(getErrorMessage(err, 'Não foi possível carregar as conversas.')))
      .finally(() => setIsLoading(false))
  }

  async function handleOpenConversation(conversationId: string) {
    setActiveConversationId(conversationId)
    setView('conversation')
    setIsLoading(true)
    setError(null)
    try {
      const msgs = await getConversationMessages(conversationId)
      setMessages(msgs)
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível carregar a conversa.'))
    } finally {
      setIsLoading(false)
    }
  }

  async function handleNewConversation() {
    setIsLoading(true)
    setError(null)
    try {
      const conversation = await createConversation(workspaceId)
      setConversations((prev) => [conversation, ...prev])
      setActiveConversationId(conversation.id)
      setMessages([])
      setView('conversation')
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível iniciar uma nova conversa.'))
    } finally {
      setIsLoading(false)
    }
  }

  function handleBackToList() {
    setView('list')
    setActiveConversationId(null)
    loadConversations()
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!input.trim() || isSending || !activeConversationId) return
    const userText = input
    setMessages((prev) => [
      ...prev,
      { id: `temp-${Date.now()}`, role: 'USER', content: userText, actionsTaken: null, createdAt: new Date().toISOString() },
    ])
    setInput('')
    setIsSending(true)
    setError(null)
    try {
      const assistantMessage = await sendConversationMessage(activeConversationId, userText)
      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      setError(getErrorMessage(err, 'O assistente não conseguiu responder agora.'))
    } finally {
      setIsSending(false)
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={openWidget}
        className="fixed bottom-6 right-6 w-14 h-14 bg-[#0A0A0A] hover:bg-[#2A2A2A] rounded-full shadow-2xl flex items-center justify-center transition-colors z-40"
        aria-label="Abrir assistente"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-128 bg-white rounded-2xl shadow-2xl border border-[#0A0A0A]/10 flex flex-col z-40">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#0A0A0A]/10">
        <div className="flex items-center gap-2">
          {view === 'conversation' && (
            <button onClick={handleBackToList} className="text-[#0A0A0A]/45 hover:text-[#0A0A0A]">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <Sparkles className="w-4 h-4 text-[#B4201A]" />
          <span className="text-sm font-medium text-[#0A0A0A]">Assistente IABill</span>
        </div>
        <div className="flex items-center gap-2">
          {view === 'list' && (
            <button
              onClick={handleNewConversation}
              className="text-[#0A0A0A]/45 hover:text-[#0A0A0A]"
              title="Nova conversa"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          <button onClick={() => setIsOpen(false)} className="text-[#0A0A0A]/45 hover:text-[#0A0A0A]">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {view === 'list' ? (
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {isLoading && <p className="text-xs text-[#0A0A0A]/45 text-center mt-4">Carregando...</p>}
          {!isLoading && conversations.length === 0 && (
            <div className="text-center mt-8">
              <p className="text-xs text-[#0A0A0A]/45 mb-3">Nenhuma conversa ainda.</p>
              <button
                onClick={handleNewConversation}
                className="text-sm bg-[#0A0A0A] hover:bg-[#2A2A2A] text-white font-medium rounded-lg px-4 py-2 transition-colors"
              >
                Iniciar conversa
              </button>
            </div>
          )}
          {conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => handleOpenConversation(c.id)}
              className="w-full text-left bg-[#FBF8F8] hover:bg-[#0A0A0A]/8 rounded-lg px-3 py-2.5 transition-colors"
            >
              <p className="text-sm text-[#0A0A0A] truncate">{c.title ?? 'Nova conversa'}</p>
              <p className="text-xs text-[#0A0A0A]/50 mt-0.5">
                {new Date(c.updatedAt).toLocaleString('pt-BR')}
              </p>
            </button>
          ))}
          {error && <p className="text-xs text-red-600 text-center">{error}</p>}
        </div>
      ) : (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {isLoading && <p className="text-xs text-[#0A0A0A]/45 text-center mt-4">Carregando...</p>}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === 'USER' ? 'bg-[#0A0A0A] text-white' : 'bg-[#FBF8F8] text-[#0A0A0A]'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.actionsTaken && msg.actionsTaken.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-[#0A0A0A]/10 space-y-0.5">
                      {msg.actionsTaken.map((action, j) => (
                        <p key={j} className="text-xs text-[#0A0A0A] flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          {action}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {isSending && (
              <div className="flex justify-start">
                <div className="bg-[#FBF8F8] rounded-lg px-3 py-2 text-sm text-[#0A0A0A]/55">
                  Pensando...
                </div>
              </div>
            )}
            {error && <p className="text-xs text-red-600 text-center">{error}</p>}
          </div>
          <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border-t border-[#0A0A0A]/10">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pergunte ou peça uma ação..."
              disabled={isSending}
              className="flex-1 rounded-lg bg-[#FBF8F8] text-[#0A0A0A] text-sm px-3 py-2 border border-[#0A0A0A]/10 focus:outline-none focus:border-[#0A0A0A] disabled:opacity-50 placeholder:text-[#0A0A0A]/40"
            />
            <button
              type="submit"
              disabled={isSending || !input.trim()}
              className="bg-[#0A0A0A] hover:bg-[#2A2A2A] disabled:opacity-50 text-white rounded-lg p-2 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </>
      )}
    </div>
  )
}