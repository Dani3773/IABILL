import { useState, type FormEvent } from 'react'
import { createWorkspace } from '../api/workspaceService'
import { useAuth } from '../contexts/AuthContext'
import type { Workspace } from '../types/workspace'

interface Props {
  onClose: () => void
  onCreated: (workspace: Workspace) => void
}

export function CreateWorkspaceModal({ onClose, onCreated }: Props) {
  const { tenantId } = useAuth()

  const [name, setName] = useState('')
  const [type, setType] = useState<'MATRIZ' | 'FILIAL'>('FILIAL')
  const [documentId, setDocumentId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!tenantId) return

    setError(null)
    setIsLoading(true)
    try {
      const workspace = await createWorkspace({ tenantId, name, type, documentId })
      onCreated(workspace)
      onClose()
    } catch {
      setError('Não foi possível criar o workspace. Verifique se o CNPJ já não está em uso.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 z-50">
      <div className="w-full max-w-md bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Novo Workspace</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ex: Filial São Paulo"
              className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">Tipo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as 'MATRIZ' | 'FILIAL')}
              className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:outline-none focus:border-blue-500"
            >
              <option value="FILIAL">Filial</option>
              <option value="MATRIZ">Matriz</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">CNPJ</label>
            <input
              type="text"
              value={documentId}
              onChange={(e) => setDocumentId(e.target.value)}
              required
              placeholder="Somente números"
              className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg py-2 transition-colors"
            >
              {isLoading ? 'Criando...' : 'Criar'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg py-2 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}