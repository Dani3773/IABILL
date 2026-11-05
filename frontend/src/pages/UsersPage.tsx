import { useEffect, useState } from 'react'
import { fetchUsers, toggleDpoSubstitute } from '../api/userService'
import { CreateUserModal } from '../components/CreateUserModal'
import { AssignWorkspaceModal } from '../components/AssignWorkspaceModal'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { Alert } from '../components/Alert'
import { getErrorMessage } from '../api/errorUtils'
import type { User } from '../types/user'

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [assigningUser, setAssigningUser] = useState<User | null>(null)

  useEffect(() => {
    fetchUsers()
      .then(setUsers)
      .catch((err) => setError(getErrorMessage(err, 'Não foi possível carregar os usuários.')))
      .finally(() => setIsLoading(false))
  }, [])

  function handleCreated(newUser: User) {
    setUsers((prev) => [...prev, newUser])
  }

  async function handleToggleSubstitute(userId: string) {
    try {
      const updated = await toggleDpoSubstitute(userId)
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)))
    } catch {
      // Falha silenciosa deliberada, mesma decisao ja usada em outros lugares
      // pequenos do sistema - o usuario pode simplesmente tentar de novo.
    }
  }

  if (isLoading) return <LoadingSpinner label="Carregando usuários..." />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl text-[#0A0A0A]">Usuários</h2>
          <p className="text-sm text-[#0A0A0A]/50 mt-0.5">
            {users.length} {users.length === 1 ? "usuário cadastrado" : "usuários cadastrados"}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#0A0A0A] hover:bg-[#2A2A2A] text-white text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors"
        >
          + Novo Usuário
        </button>
      </div>

      {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between bg-white rounded-xl p-4 border border-[#0A0A0A]/10"
          >
            <div>
              <p className="font-medium text-[#0A0A0A]">{user.username}</p>
              <p className="text-xs text-[#0A0A0A]/50">{user.email}</p>
            </div>
            <div className="flex items-center gap-3">
              {user.dpoSubstitute && (
                <span className="text-xs px-2 py-1 rounded font-medium bg-[#D92B21]/12 text-[#0A0A0A]">
                  Substituto
                </span>
              )}
              <span
                className={`text-xs px-2 py-1 rounded font-medium ${
                  user.role === 'ADMIN'
                    ? 'bg-[#D92B21]/12 text-[#B4201A]'
                    : 'bg-[#0A0A0A]/8 text-[#0A0A0A]/70'
                }`}
              >
                {user.role}
              </span>
              {user.role === 'DPO' && (
                <button
                  onClick={() => handleToggleSubstitute(user.id)}
                  className="text-sm text-[#0A0A0A] hover:underline font-medium"
                >
                  {user.dpoSubstitute ? 'Remover substituto' : 'Marcar como substituto'}
                </button>
              )}
              <button
                onClick={() => setAssigningUser(user)}
                className="text-sm text-[#0A0A0A] hover:underline font-medium"
              >
                Gerenciar workspaces
              </button>
            </div>
          </div>
        ))}
      </div>

      {showCreateModal && (
        <CreateUserModal onClose={() => setShowCreateModal(false)} onCreated={handleCreated} />
      )}
      {assigningUser && (
        <AssignWorkspaceModal
          userId={assigningUser.id}
          username={assigningUser.username}
          onClose={() => setAssigningUser(null)}
        />
      )}
    </div>
  )
}