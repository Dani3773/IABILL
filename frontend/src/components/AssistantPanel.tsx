import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileSearch, Plus, Search, Send, Sparkles, X } from 'lucide-react'
import {
  createConversation,
  getConversationMessages,
  listConversations,
  sendConversationMessage,
} from '../api/chatService'
import { semanticSearch } from '../api/searchService'
import { getErrorMessage } from '../api/errorUtils'
import { useWorkspaces } from '../contexts/WorkspaceContext'
import type { ChatConversation, ChatMessage } from '../types/chat'
import type { SemanticSearchResult } from '../types/search'

type View = 'list' | 'conversation'

const INPUT_CLASS =
  'flex-1 min-w-0 rounded-lg bg-white text-[#0A0A0A] text-sm px-3 py-2.5 border border-[#0A0A0A]/20 focus:outline-none focus:border-[#D92B21] disabled:opacity-50 placeholder:text-[#0A0A0A]/45'
const SUBMIT_CLASS =
  'bg-[#D92B21] hover:bg-[#B4201A] disabled:opacity-50 text-white rounded-lg p-2.5 transition-colors shrink-0'

export function AssistantPanel({ workspaceId }: { workspaceId: string }) {
  const {
    currentWorkspace,
    closeAssistant,
    assistantMode,
    setAssistantMode,
    pendingQuestion,
    clearPendingQuestion,
  } = useWorkspaces()
  const [view, setView] = useState<View>('list')
  const [conversations, setConversations] = useState<ChatConversation[]>([])
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SemanticSearchResult[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isSending])

  function loadConversations() {
    setIsLoading(true)
    setError(null)
    listConversations(workspaceId)
      .then(setConversations)
      .catch((err) => setError(getErrorMessage(err, 'Não foi possível carregar as conversas.')))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    loadConversations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspaceId])

  async function handleOpenConversation(conversationId: string) {
    setActiveConversationId(conversationId)
    setView('conversation')
    setIsLoading(true)
    setError(null)
    try {
      setMessages(await getConversationMessages(conversationId))
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível carregar a conversa.'))
    } finally {
      setIsLoading(false)
    }
  }

  async function sendMessage(conversationId: string, text: string) {
    setMessages((prev) => [
      ...prev,
      { id: `temp-${Date.now()}`, role: 'USER', content: text, actionsTaken: null, createdAt: new Date().toISOString() },
    ])
    setInput('')
    setIsSending(true)
    setError(null)
    try {
      const assistantMessage = await sendConversationMessage(conversationId, text)
      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      setError(getErrorMessage(err, 'O assistente não conseguiu responder agora.'))
    } finally {
      setIsSending(false)
    }
  }

  async function startConversation(question?: string) {
    setIsLoading(true)
    setError(null)
    try {
      const conversation = await createConversation(workspaceId)
      setConversations((prev) => [conversation, ...prev])
      setActiveConversationId(conversation.id)
      setMessages([])
      setView('conversation')
      setIsLoading(false)
      if (question) await sendMessage(conversation.id, question)
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível iniciar uma nova conversa.'))
      setIsLoading(false)
    }
  }

  // A trava evita enviar a mesma pergunta duas vezes se o efeito rodar de novo.
  const handledQuestion = useRef<string | null>(null)
  useEffect(() => {
    if (!pendingQuestion) {
      handledQuestion.current = null
      return
    }
    if (handledQuestion.current === pendingQuestion) return
    handledQuestion.current = pendingQuestion
    clearPendingQuestion()
    void startConversation(pendingQuestion)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingQuestion])

  function handleBackToList() {
    setView('list')
    setActiveConversationId(null)
    loadConversations()
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || isSending) return
    if (activeConversationId) void sendMessage(activeConversationId, text)
    else void startConversation(text)
  }

  async function handleSearch(e: FormEvent) {
    e.preventDefault()
    if (!query.trim()) return
    setIsSearching(true)
    setSearchError(null)
    setHasSearched(true)
    try {
      setResults(await semanticSearch(workspaceId, query))
    } catch (err) {
      setSearchError(getErrorMessage(err, 'Não foi possível realizar a busca.'))
    } finally {
      setIsSearching(false)
    }
  }

  const tabClass = (active: boolean) =>
    `flex-1 flex items-center justify-center gap-1.5 text-sm font-medium py-2 border-b-2 transition-colors ${
      active
        ? 'border-[#D92B21] text-[#0A0A0A]'
        : 'border-transparent text-[#0A0A0A]/60 hover:text-[#0A0A0A]'
    }`

  return (
    <aside
      aria-label="Assistente IABill"
      className="fixed inset-0 z-50 lg:static lg:z-auto lg:w-96 lg:shrink-0 h-full bg-white lg:border-l border-[#0A0A0A]/10 flex flex-col"
    >
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-[#0A0A0A]/10">
        <div className="flex items-center gap-2 min-w-0">
          {assistantMode === 'chat' && view === 'conversation' && (
            <button
              onClick={handleBackToList}
              aria-label="Voltar às conversas"
              className="text-[#0A0A0A]/55 hover:text-[#0A0A0A]"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <Sparkles className="w-4 h-4 text-[#B4201A] shrink-0" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-[#0A0A0A] truncate">Assistente IABill</p>
            {currentWorkspace && (
              <p className="text-xs text-[#0A0A0A]/55 truncate">{currentWorkspace.name}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {assistantMode === 'chat' && view === 'list' && (
            <button
              onClick={() => void startConversation()}
              className="text-[#0A0A0A]/55 hover:text-[#0A0A0A]"
              title="Nova conversa"
              aria-label="Nova conversa"
            >
              <Plus className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={closeAssistant}
            className="text-[#0A0A0A]/55 hover:text-[#0A0A0A]"
            aria-label="Fechar assistente"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex border-b border-[#0A0A0A]/10 px-2">
        <button className={tabClass(assistantMode === 'chat')} onClick={() => setAssistantMode('chat')}>
          <Sparkles className="w-3.5 h-3.5" /> Perguntar
        </button>
        <button className={tabClass(assistantMode === 'search')} onClick={() => setAssistantMode('search')}>
          <Search className="w-3.5 h-3.5" /> Buscar trechos
        </button>
      </div>

      {assistantMode === 'search' ? (
        <>
          <form onSubmit={handleSearch} className="flex items-center gap-2 p-3 border-b border-[#0A0A0A]/10">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Buscar nos documentos"
              placeholder="Ex: por quanto tempo os dados ficam guardados?"
              className={INPUT_CLASS}
            />
            <button type="submit" disabled={isSearching || !query.trim()} className={SUBMIT_CLASS} aria-label="Buscar">
              <Search className="w-4 h-4" />
            </button>
          </form>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {!hasSearched && (
              <p className="text-sm text-[#0A0A0A]/60 text-center mt-6 px-4">
                Busca por significado nos documentos desta unidade, não só por palavra-chave.
              </p>
            )}
            {isSearching && <p className="text-sm text-[#0A0A0A]/60 text-center mt-4">Buscando...</p>}
            {searchError && <p className="text-sm text-red-700 text-center">{searchError}</p>}
            {!isSearching && !searchError && hasSearched && results.length === 0 && (
              <div className="text-center mt-8">
                <FileSearch className="w-7 h-7 text-[#0A0A0A]/25 mx-auto mb-2" />
                <p className="text-sm text-[#0A0A0A]/60">Nenhum resultado encontrado para essa busca.</p>
              </div>
            )}
            {!isSearching &&
              results.map((result, i) => (
                <Link
                  key={`${result.documentId}-${result.chunkIndex}-${i}`}
                  to={`/documents/${result.documentId}`}
                  className="block rounded-lg p-3 border border-[#0A0A0A]/10 hover:border-[#D92B21]/50 transition-colors"
                >
                  <p className="text-sm font-medium text-[#0A0A0A] mb-1">{result.documentTitle}</p>
                  <p className="text-[13px] text-[#0A0A0A]/70 line-clamp-3">{result.content}</p>
                </Link>
              ))}
          </div>
        </>
      ) : view === 'list' ? (
        <>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
            {isLoading && <p className="text-sm text-[#0A0A0A]/60 text-center mt-4">Carregando...</p>}
            {!isLoading && conversations.length === 0 && (
              <p className="text-sm text-[#0A0A0A]/60 text-center mt-8 px-4">
                Pergunte sobre os documentos e tarefas desta unidade.
              </p>
            )}
            {conversations.map((c) => (
              <button
                key={c.id}
                onClick={() => handleOpenConversation(c.id)}
                className="w-full text-left bg-[#fbfaf6] hover:bg-[#0A0A0A]/6 rounded-lg px-3 py-2.5 transition-colors"
              >
                <p className="text-sm text-[#0A0A0A] truncate">{c.title ?? 'Nova conversa'}</p>
                <p className="text-xs text-[#0A0A0A]/55 mt-0.5">
                  {new Date(c.updatedAt).toLocaleString('pt-BR')}
                </p>
              </button>
            ))}
            {error && <p className="text-sm text-red-700 text-center">{error}</p>}
          </div>
          <ChatInput value={input} onChange={setInput} onSubmit={handleSubmit} disabled={isSending || isLoading} />
        </>
      ) : (
        <>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {isLoading && <p className="text-sm text-[#0A0A0A]/60 text-center mt-4">Carregando...</p>}
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'USER' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                    msg.role === 'USER' ? 'bg-[#17130e] text-white' : 'bg-[#f3f1ea] text-[#0A0A0A]'
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
                <div className="bg-[#f3f1ea] rounded-lg px-3 py-2 text-sm text-[#0A0A0A]/60">Pensando...</div>
              </div>
            )}
            {error && <p className="text-sm text-red-700 text-center">{error}</p>}
          </div>
          <ChatInput value={input} onChange={setInput} onSubmit={handleSubmit} disabled={isSending} />
        </>
      )}
    </aside>
  )
}

function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  onSubmit: (e: FormEvent) => void
  disabled: boolean
}) {
  return (
    <form onSubmit={onSubmit} className="flex items-center gap-2 p-3 border-t border-[#0A0A0A]/10">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Mensagem para o assistente"
        placeholder="Pergunte ou peça uma ação..."
        disabled={disabled}
        className={INPUT_CLASS}
      />
      <button type="submit" disabled={disabled || !value.trim()} className={SUBMIT_CLASS} aria-label="Enviar">
        <Send className="w-4 h-4" />
      </button>
    </form>
  )
}
