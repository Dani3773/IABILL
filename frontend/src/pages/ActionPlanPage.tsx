import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Sparkles, ClipboardList } from 'lucide-react'
import {
  fetchActionItems,
  createActionItem,
  updateActionItemStatus,
  suggestActionItems,
} from '../api/actionItemService'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { Alert } from '../components/Alert'
import { getErrorMessage } from '../api/errorUtils'
import type { ActionItem, ActionItemStatus, SuggestedActionItem } from '../types/actionItem'

const STATUS_LABELS: Record<ActionItemStatus, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em Andamento',
  DONE: 'Concluído',
}

const STATUS_STYLES: Record<ActionItemStatus, string> = {
  PENDING: 'bg-[#0A0A0A]/8 text-[#0A0A0A]/70',
  IN_PROGRESS: 'bg-[#D92B21]/12 text-[#B4201A]',
  DONE: 'bg-[#D92B21]/12 text-[#0A0A0A]',
}

export function ActionPlanPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const [items, setItems] = useState<ActionItem[]>([])
  const [suggestions, setSuggestions] = useState<SuggestedActionItem[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!workspaceId) return
    loadItems(workspaceId)
  }, [workspaceId])

  function loadItems(id: string) {
    setIsLoading(true)
    fetchActionItems(id)
      .then(setItems)
      .catch((err) => setError(getErrorMessage(err, 'Não foi possível carregar o plano de ação.')))
      .finally(() => setIsLoading(false))
  }

  async function handleCreateManual() {
    if (!workspaceId || !newTitle.trim()) return
    try {
      const created = await createActionItem({ workspaceId, title: newTitle, description: newDescription })
      setItems((prev) => [...prev, created])
      setNewTitle('')
      setNewDescription('')
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível criar a tarefa.'))
    }
  }

  async function handleSuggest() {
    if (!workspaceId) return
    setIsSuggesting(true)
    setError(null)
    try {
      const result = await suggestActionItems(workspaceId)
      setSuggestions(result)
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível gerar sugestões.'))
    } finally {
      setIsSuggesting(false)
    }
  }

  async function handleApproveSuggestion(suggestion: SuggestedActionItem) {
    if (!workspaceId) return
    try {
      const created = await createActionItem({
        workspaceId,
        title: suggestion.title,
        description: suggestion.description,
        source: 'AI_SUGGESTED',
      })
      setItems((prev) => [...prev, created])
      setSuggestions((prev) => prev.filter((s) => s.title !== suggestion.title))
      setSuccessMessage(`Tarefa "${suggestion.title}" adicionada ao plano.`)
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível aprovar a sugestão.'))
    }
  }

  function handleDismissSuggestion(suggestion: SuggestedActionItem) {
    setSuggestions((prev) => prev.filter((s) => s.title !== suggestion.title))
  }

  async function handleStatusChange(id: string, status: ActionItemStatus) {
    try {
      const updated = await updateActionItemStatus(id, status)
      setItems((prev) => prev.map((item) => (item.id === id ? updated : item)))
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível atualizar o status.'))
    }
  }

  if (isLoading) return <LoadingSpinner label="Carregando plano de ação..." />

  return (
    <div className="max-w-3xl mx-auto">

      <h1 className="text-xl text-[#0A0A0A] mb-1">Plano de Ação para Adequação</h1>
      <p className="text-sm text-[#0A0A0A]/55 mb-6">
        Tarefas de conformidade — manuais ou sugeridas por IA com base nos documentos existentes.
      </p>

      <div className="space-y-3 mb-4">
        {error && <Alert type="error" message={error} />}
        {successMessage && <Alert type="success" message={successMessage} />}
      </div>

      {/* Sugestao via IA */}
      <div className="bg-white rounded-xl p-4 border border-[#0A0A0A]/10 mb-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="flex items-center gap-1.5 text-sm font-medium text-[#0A0A0A]/70">
            <Sparkles className="w-3.5 h-3.5 text-[#B4201A]" />
            Sugestão com IA
          </h3>
          <button
            onClick={handleSuggest}
            disabled={isSuggesting}
            className="bg-[#D92B21] hover:bg-[#B4201A] disabled:opacity-50 text-white text-sm font-semibold rounded-lg px-4 py-2 transition-colors"
          >
            {isSuggesting ? 'Analisando documentos...' : 'Sugerir plano com IA'}
          </button>
        </div>
        {suggestions.length > 0 && (
          <div className="space-y-2 mt-3">
            {suggestions.map((s) => (
              <div key={s.title} className="bg-[#D92B21]/4 rounded-lg p-3 border border-[#D92B21]/20">
                <p className="font-medium text-[#0A0A0A] text-sm">{s.title}</p>
                <p className="text-xs text-[#0A0A0A]/60 mt-1 mb-2">{s.description}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApproveSuggestion(s)}
                    className="text-xs bg-[#D92B21] hover:bg-[#B4201A] text-white font-medium rounded px-3 py-1 transition-colors"
                  >
                    Aprovar e adicionar
                  </button>
                  <button
                    onClick={() => handleDismissSuggestion(s)}
                    className="text-xs text-[#0A0A0A]/50 hover:text-[#0A0A0A]/75 px-3 py-1"
                  >
                    Descartar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Criacao manual */}
      <div className="bg-white rounded-xl p-4 border border-[#0A0A0A]/10 mb-6">
        <h3 className="text-sm font-medium text-[#0A0A0A]/70 mb-2">Adicionar tarefa manual</h3>
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Título da tarefa"
          className="w-full rounded-lg bg-[#fbfaf6] text-[#0A0A0A] px-3 py-2 border border-[#0A0A0A]/10 focus:outline-none focus:ring-2 focus:ring-[#D92B21]/30 focus:border-[#0A0A0A] mb-2 placeholder:text-[#0A0A0A]/40"
        />
        <textarea
          value={newDescription}
          onChange={(e) => setNewDescription(e.target.value)}
          rows={2}
          placeholder="Descrição (opcional)"
          className="w-full rounded-lg bg-[#fbfaf6] text-[#0A0A0A] px-3 py-2 border border-[#0A0A0A]/10 focus:outline-none focus:ring-2 focus:ring-[#D92B21]/30 focus:border-[#0A0A0A] mb-2 placeholder:text-[#0A0A0A]/40"
        />
        <button
          onClick={handleCreateManual}
          disabled={!newTitle.trim()}
          className="bg-[#D92B21] hover:bg-[#B4201A] disabled:opacity-50 text-white text-sm font-semibold rounded-lg px-4 py-2 transition-colors"
        >
          Adicionar
        </button>
      </div>

      {/* Lista de tarefas */}
      <h3 className="text-sm font-medium text-[#0A0A0A]/70 mb-2">Tarefas ({items.length})</h3>
      {items.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-10 text-center">
          <ClipboardList className="w-8 h-8 text-[#0A0A0A]/25 mx-auto mb-3" />
          <p className="text-[#0A0A0A]/55 text-sm">Nenhuma tarefa cadastrada ainda.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-xl p-4 border border-[#0A0A0A]/10">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-[#0A0A0A] text-sm">{item.title}</p>
                    {item.source === 'AI_SUGGESTED' && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-[#D92B21]/12 text-[#B4201A] font-medium">
                        IA
                      </span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-[#0A0A0A]/60">{item.description}</p>
                  )}
                </div>
                <select
                  value={item.status}
                  onChange={(e) => handleStatusChange(item.id, e.target.value as ActionItemStatus)}
                  className={`text-xs rounded px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-[#0A0A0A] font-medium ${STATUS_STYLES[item.status]}`}
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}