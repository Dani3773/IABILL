import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchWorkspaces } from '../api/workspaceService'
import { CreateWorkspaceModal } from '../components/CreateWorkspaceModal'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { Alert } from '../components/Alert'
import { getErrorMessage } from '../api/errorUtils'
import { useAuth } from '../contexts/AuthContext'
import type { Workspace } from '../types/workspace'

export function DashboardPage() {
  const { role } = useAuth()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    loadWorkspaces()
  }, [])

  function loadWorkspaces() {
    setIsLoading(true)
    fetchWorkspaces()
      .then(setWorkspaces)
      .catch((err) => setError(getErrorMessage(err, 'Não foi possível carregar os workspaces.')))
      .finally(() => setIsLoading(false))
  }

  function handleCreated(newWorkspace: Workspace) {
    setWorkspaces((prev) => [...prev, newWorkspace])
  }

  if (isLoading) return <LoadingSpinner label="Carregando workspaces..." />

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Seus Workspaces</h2>
        {role === 'ADMIN' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
          >
            + Novo Workspace
          </button>
        )}
      </div>

      {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

      {workspaces.length === 0 ? (
        <p className="text-slate-400">Nenhum workspace cadastrado ainda.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((workspace) => (
            <Link
              key={workspace.id}
              to={`/workspaces/${workspace.id}/documents`}
              className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-cyan-500 transition-colors"
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
              <p className="text-sm text-slate-400">CNPJ: {workspace.documentId}</p>
            </Link>
          ))}
        </div>
      )}

      {showCreateModal && (
        <CreateWorkspaceModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}