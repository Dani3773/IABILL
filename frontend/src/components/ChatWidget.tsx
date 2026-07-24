import { useState, useRef, useEffect, type FormEvent } from 'react'
import { MessageCircle, X, Send, Sparkles } from 'lucide-react'
import { sendChatMessage } from '../api/chatService'
import { getErrorMessage } from '../api/errorUtils'
import type { ChatMessage } from '../types/chat'

interface Props {
  workspaceId: string
}

export function ChatWidget({ workspaceId }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isOpen])

  async function handleSubmit(e: FormEvent) {
  e.preventDefault()
  if (!input.trim() || isLoading) return

  const userMessage: ChatMessage = { role: 'user', text: input }
  const history = messages.map((m) => ({
    role: m.role === 'user' ? ('user' as const) : ('model' as const),
    text: m.text,
  }))

  setMessages((prev) => [...prev, userMessage])
  setInput('')
  setIsLoading(true)
  setError(null)

  try {
    const response = await sendChatMessage({ workspaceId, message: userMessage.text, history })
    setMessages((prev) => [
      ...prev,
      { role: 'assistant', text: response.reply, actionsTaken: response.actionsTaken },
    ])
  } catch (err) {
    setError(getErrorMessage(err, 'O assistente não conseguiu responder agora.'))
  } finally {
    setIsLoading(false)
  }
}

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-cyan-600 hover:bg-cyan-500 rounded-full shadow-2xl flex items-center justify-center transition-colors z-40"
        aria-label="Abrir assistente"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[32rem] bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 flex flex-col z-40">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-white">Assistente IABill</span>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <p className="text-xs text-slate-500 text-center mt-8">
            Pergunte sobre seus documentos, ou peça para criar tarefas e documentos.
          </p>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === 'user'
                  ? 'bg-cyan-600 text-white'
                  : 'bg-slate-700 text-slate-100'
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.text}</p>
              {msg.actionsTaken && msg.actionsTaken.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-600/50 space-y-0.5">
                  {msg.actionsTaken.map((action, j) => (
                    <p key={j} className="text-xs text-cyan-300 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {action}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-700 rounded-lg px-3 py-2 text-sm text-slate-400">
              Pensando...
            </div>
          </div>
        )}

        {error && <p className="text-xs text-red-400 text-center">{error}</p>}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border-t border-slate-700">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Pergunte ou peça uma ação..."
          disabled={isLoading}
          className="flex-1 rounded-lg bg-slate-900 text-white text-sm px-3 py-2 border border-slate-700 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg p-2 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  )
}