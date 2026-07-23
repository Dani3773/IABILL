import { useEffect, useState } from 'react'
import { fetchUsers } from '../api/userService'
import { CreateUserModal } from '../components/CreateUserModal'
import { AssignWorkspaceModal } from '../components/AssignWorkspaceModal'
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
      .catch(() => setError('Não foi possível carregar os usuários.'))
      .finally(() => setIsLoading(false))
  }, [])

  function handleCreated(newUser: User) {
    setUsers((prev) => [...prev, newUser])
  }

  if (isLoading) return <p className="text-slate-400">Carregando...</p>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Usuários</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
        >
          + Novo Usuário
        </button>
      </div>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      <div className="space-y-2">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between bg-slate-800 rounded-lg p-4 border border-slate-700"
          >
            <div>
              <p className="font-medium text-white">{user.username}</p>
              <p className="text-xs text-slate-400">{user.email}</p>
            </div>
            <div className="flex items-center gap-3">
              <span
                className={`text-xs px-2 py-1 rounded ${
                  user.role === 'ADMIN'
                    ? 'bg-blue-900 text-blue-300'
                    : 'bg-slate-700 text-slate-300'
                }`}
              >
                {user.role}
              </span>
              <button
                onClick={() => setAssigningUser(user)}
                className="text-sm text-cyan-400 hover:underline"
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