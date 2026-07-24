import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom'
import { LayoutGrid, Users, ScrollText, LogOut } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { role, clearAuth } = useAuth()

  function handleLogout() {
    clearAuth()
    navigate('/login')
  }

  const navItems = [
    { label: 'Workspaces', path: '/dashboard', icon: LayoutGrid, adminOnly: false },
    { label: 'Usuários', path: '/users', icon: Users, adminOnly: true },
    { label: 'Auditoria', path: '/audit-logs', icon: ScrollText, adminOnly: true },
  ]

  return (
    <div className="flex min-h-screen bg-slate-900">
      <aside className="w-56 bg-slate-800 border-r border-slate-700 flex flex-col">
        <div className="p-4 border-b border-slate-700">
          <img src="../../public/logo.png" alt="IABill" className="h-8" />
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems
            .filter((item) => !item.adminOnly || role === 'ADMIN')
            .map((item) => {
              const Icon = item.icon
              const isActive = location.pathname.startsWith(item.path)
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-cyan-600/20 text-cyan-400'
                      : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              )
            })}
        </nav>

        <div className="p-3 border-t border-slate-700">
          <div className="px-3 py-2 text-xs text-slate-500 mb-1">Papel: {role}</div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium text-red-400 hover:bg-red-950/50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}