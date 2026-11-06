import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Building2, MapPin, Pencil } from 'lucide-react'
import { fetchWorkspaces } from '../api/workspaceService'
import { CreateWorkspaceModal } from '../components/CreateWorkspaceModal'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { Alert } from '../components/Alert'
import { getErrorMessage } from '../api/errorUtils'
import { useAuth } from '../contexts/AuthContext'
import { useWorkspaces } from '../contexts/WorkspaceContext'
import { formatCnpj } from '../utils/format'
import type { Workspace } from '../types/workspace'

import { tr, trn } from '../i18n/tr'
export function DashboardPage() {
  const { role } = useAuth()
  const { refreshWorkspaces } = useWorkspaces()
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editing, setEditing] = useState<Workspace | null>(null)
  

  useEffect(() => {
    loadWorkspaces()
  }, [])

  function loadWorkspaces() {
    setIsLoading(true)
    fetchWorkspaces()
      .then(setWorkspaces)
      .catch((err) => setError(getErrorMessage(err, tr('Não foi possível carregar as unidades.'))))
      .finally(() => setIsLoading(false))
  }

  function handleCreated(newWorkspace: Workspace) {
    void refreshWorkspaces()
    setWorkspaces((prev) => {
      const exists = prev.some((w) => w.id === newWorkspace.id)
      return exists ? prev.map((w) => (w.id === newWorkspace.id ? newWorkspace : w)) : [...prev, newWorkspace]
    })
  }

  if (isLoading) return <LoadingSpinner label={tr('Carregando unidades...')} />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl text-[#0A0A0A]">{tr('Unidades')}</h1>
          <p className="text-sm text-[#0A0A0A]/50 mt-0.5">
            {trn(workspaces.length, '{{n}} unidade cadastrada', '{{n}} unidades cadastradas')}
          </p>
        </div>
        {(role === 'ADMIN' || role === 'SUPER_ADMIN') && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#D92B21] hover:bg-[#B4201A] text-white text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors"
          >{tr('+ Nova unidade')}</button>
        )}
      </div>

      {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

      {workspaces.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-10 text-center">
          <Building2 className="w-8 h-8 text-[#0A0A0A]/25 mx-auto mb-3" />
          <p className="text-[#0A0A0A]/60 text-sm">{tr('Nenhuma unidade cadastrada ainda.')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {workspaces.map((workspace) => {
            const location = [workspace.city, workspace.state].filter(Boolean).join(" - ");
            return (
              <Link
                key={workspace.id}
                to={`/workspaces/${workspace.id}/inicio`}
                className="relative bg-white rounded-xl p-5 border border-[#0A0A0A]/10 hover:border-[#D92B21]/50 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-9 h-9 rounded-lg bg-[#D92B21]/10 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-[#B4201A]" />
                  </div>
                  <div className="flex items-center gap-3">
                    {(role === 'ADMIN' || role === 'SUPER_ADMIN') && (
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          setEditing(workspace)
                        }}
                        className="text-[#0A0A0A]/45 hover:text-[#B4201A] transition-colors"
                        title={tr('Editar unidade')}
                        aria-label={tr('Editar {{a}}', { a: workspace.name })}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <span
                      className={`text-[10px] uppercase tracking-wide px-2 py-1 rounded ${
                        workspace.type === 'MATRIZ'
                          ? 'bg-[#D92B21]/10 text-[#B4201A]'
                          : 'bg-[#0A0A0A]/8 text-[#0A0A0A]/60'
                      }`}
                    >
                      {workspace.type === 'MATRIZ' ? tr('Matriz') : tr('Filial')}
                    </span>
                  </div>
                </div>
                <h3 className="font-medium text-[#0A0A0A] mb-1">{workspace.name}</h3>
                <p className="text-xs text-[#0A0A0A]/45 mb-2">{tr('CNPJ:')}{' '}{formatCnpj(workspace.documentId)}</p>
                {location && (
                  <p className="flex items-center gap-1 text-xs text-[#0A0A0A]/45">
                    <MapPin className="w-3 h-3" />
                    {location}
                  </p>
                )}
                {workspace.legalRegimes.length > 0 && (
                  <div className="flex gap-1.5 mt-3 pt-3 border-t border-[#0A0A0A]/8">
                    {workspace.legalRegimes.map((r) => (
                      <span
                        key={r}
                        className="text-[10px] uppercase tracking-wide bg-[#D92B21]/10 text-[#0A0A0A] rounded px-1.5 py-0.5"
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

      {(showCreateModal || editing) && (
        <CreateWorkspaceModal
          editing={editing}
          onClose={() => {
            setShowCreateModal(false)
            setEditing(null)
          }}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}