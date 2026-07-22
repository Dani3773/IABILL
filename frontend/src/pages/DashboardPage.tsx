import { useEffect, useState } from 'react'
import { fetchWorkspaces } from '../api/workspaceService'
import type { Workspace } from '../types/workspace'

export function DashboardPage() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWorkspaces()
      .then(setWorkspaces)
      .catch(() => setError('Não foi possível carregar os workspaces.'))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) {
    return <p className="text-slate-400">Carregando...</p>
  }

  if (error) {
    return <p className="text-red-400">{error}</p>
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-4">
        Seus Workspaces
      </h2>

      {workspaces.length === 0 ? (
        <p className="text-slate-400">
          Nenhum workspace cadastrado ainda.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((workspace) => (
            <div
              key={workspace.id}
              className="bg-slate-800 rounded-lg p-4 border border-slate-700"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-white">{workspace.name}</h3>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    workspace.type === 'MATRIZ'
                      ? 'bg-blue-900 text-blue-300'
                      : 'bg-purple-900 text-purple-300'
                  }`}
                >
                  {workspace.type}
                </span>
              </div>
              <p className="text-sm text-slate-400">
                CNPJ: {workspace.documentId}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}