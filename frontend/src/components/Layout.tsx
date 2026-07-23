import { Outlet, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function Layout() {
  const navigate = useNavigate()
  const { role, clearAuth } = useAuth()

  function handleLogout() {
    clearAuth()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <h1 className="text-lg font-semibold text-white">LGPD Assistant</h1>
          <nav className="flex items-center gap-4">
            <Link to="/dashboard" className="text-sm text-slate-300 hover:text-white transition-colors">
              Workspaces
            </Link>
            {role === 'ADMIN' && (
              <Link to="/users" className="text-sm text-slate-300 hover:text-white transition-colors">
                Usuários
              </Link>
            )}
            {role === 'ADMIN' && (
              <Link to="/audit-logs" className="text-sm text-slate-300 hover:text-white transition-colors">
                Auditoria
              </Link>
           )}
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">Papel: {role}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="p-6">
        <Outlet />
      </main>
    </div>
  )
}