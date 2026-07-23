import { useEffect, useState } from 'react'
import { fetchWorkspaces } from '../api/workspaceService'
import { addUserToWorkspace, fetchUserWorkspaces } from '../api/userService'
import type { Workspace } from '../types/workspace'
import type { WorkspaceMembership } from '../types/user'

interface Props {
  userId: string
  username: string
  onClose: () => void
}

export function AssignWorkspaceModal({ userId, username, onClose }: Props) {
  const [allWorkspaces, setAllWorkspaces] = useState<Workspace[]>([])
  const [memberships, setMemberships] = useState<WorkspaceMembership[]>([])
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    Promise.all([fetchWorkspaces(), fetchUserWorkspaces(userId)]).then(
      ([workspaces, userMemberships]) => {
        setAllWorkspaces(workspaces)
        setMemberships(userMemberships)
        const available = workspaces.find(
          (w) => !userMemberships.some((m) => m.workspaceId === w.id)
        )
        if (available) setSelectedWorkspaceId(available.id)
      }
    )
  }, [userId])

  const availableWorkspaces = allWorkspaces.filter(
    (w) => !memberships.some((m) => m.workspaceId === w.id)
  )

  async function handleAssign() {
    if (!selectedWorkspaceId) return
    setError(null)
    setIsLoading(true)
    try {
      await addUserToWorkspace(userId, selectedWorkspaceId)
      const updated = await fetchUserWorkspaces(userId)
      setMemberships(updated)
      const nextAvailable = allWorkspaces.find(
        (w) => !updated.some((m) => m.workspaceId === w.id)
      )
      setSelectedWorkspaceId(nextAvailable?.id ?? '')
    } catch {
      setError('Não foi possível vincular o workspace.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 z-50">
      <div className="w-full max-w-md bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">
            Workspaces de {username}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-xl leading-none">
            ×
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-slate-300 mb-2">Já vinculado a:</p>
          {memberships.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum workspace ainda.</p>
          ) : (
            <ul className="space-y-1">
              {memberships.map((m) => (
                <li
                  key={m.workspaceId}
                  className="text-sm text-slate-300 bg-slate-700 rounded px-3 py-1.5"
                >
                  {m.workspaceName} ({m.workspaceType})
                </li>
              ))}
            </ul>
          )}
        </div>

        {availableWorkspaces.length > 0 && (
          <div className="border-t border-slate-700 pt-4">
            <label className="block text-sm text-slate-300 mb-1">
              Vincular a um novo workspace
            </label>
            <div className="flex gap-2">
              <select
                value={selectedWorkspaceId}
                onChange={(e) => setSelectedWorkspaceId(e.target.value)}
                className="flex-1 rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:outline-none focus:border-cyan-500"
              >
                {availableWorkspaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleAssign}
                disabled={isLoading}
                className="bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
              >
                Vincular
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-red-400 text-sm mt-3">{error}</p>}
      </div>
    </div>
  )
}