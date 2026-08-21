import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, MapPin } from 'lucide-react'
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-serif text-[#1B2233]">Seus Workspaces</h1>
          <p className="text-sm text-[#1B2233]/50 mt-0.5">
            {workspaces.length} {workspaces.length === 1 ? "unidade cadastrada" : "unidades cadastradas"}
          </p>
        </div>
        {(role === 'ADMIN' || role === 'SUPER_ADMIN') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#14B8A6] hover:bg-[#10a595] text-[#0A0D16] text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors"
          >
            + Novo Workspace
          </button>
        )}
      </div>

      {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

      {workspaces.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#1B2233]/10 p-10 text-center">
          <Building2 className="w-8 h-8 text-[#1B2233]/25 mx-auto mb-3" />
          <p className="text-[#1B2233]/60 text-sm">Nenhum workspace cadastrado ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((workspace) => {
            const location = [workspace.city, workspace.state].filter(Boolean).join(" - ");
            return (
              <Link
                key={workspace.id}
                to={`/workspaces/${workspace.id}/pilares`}
                className="bg-white rounded-xl p-5 border border-[#1B2233]/10 hover:border-[#14B8A6]/50 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-[#14B8A6]/10 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-[#14B8A6]" />
                  </div>
                  <span
                    className={`text-[10px] font-mono uppercase tracking-wide px-2 py-1 rounded ${
                      workspace.type === 'MATRIZ'
                        ? 'bg-[#B8862B]/10 text-[#B8862B]'
                        : 'bg-[#1B2233]/8 text-[#1B2233]/60'
                    }`}
                  >
                    {workspace.type}
                  </span>
                </div>
                <h3 className="font-medium text-[#1B2233] mb-1">{workspace.name}</h3>
                <p className="text-xs font-mono text-[#1B2233]/45 mb-2">CNPJ: {workspace.documentId}</p>
                {location && (
                  <p className="flex items-center gap-1 text-xs text-[#1B2233]/45">
                    <MapPin className="w-3 h-3" />
                    {location}
                  </p>
                )}
                {workspace.legalRegimes.length > 0 && (
                  <div className="flex gap-1.5 mt-3 pt-3 border-t border-[#1B2233]/8">
                    {workspace.legalRegimes.map((r) => (
                      <span
                        key={r}
                        className="text-[10px] font-mono uppercase tracking-wide bg-[#14B8A6]/10 text-[#0d7a6d] rounded px-1.5 py-0.5"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            )
          })}
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