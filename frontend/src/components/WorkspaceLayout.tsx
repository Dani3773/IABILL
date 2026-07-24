import { Outlet, useParams, Link, useLocation } from 'react-router-dom'
import { ChatWidget } from './ChatWidget'

export function WorkspaceLayout() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const location = useLocation()

  const tabs = [
    { label: 'Documentos', path: `/workspaces/${workspaceId}/documents` },
    { label: 'Plano de Ação', path: `/workspaces/${workspaceId}/action-plan` },
  ]

  return (
    <div>
      <Link to="/dashboard" className="text-cyan-400 hover:underline text-sm mb-4 inline-block">
        ← Voltar aos Workspaces
      </Link>

      <div className="flex gap-1 border-b border-slate-700 mb-6">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? 'border-cyan-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      <Outlet />
      {workspaceId && <ChatWidget workspaceId={workspaceId} />}
    </div>
  )
}