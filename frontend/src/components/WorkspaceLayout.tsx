import { Outlet, useParams, Link, useLocation } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { ChatWidget } from "./ChatWidget";

export function WorkspaceLayout() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const location = useLocation();

  const tabs = [
    { label: "Pilares", path: `/workspaces/${workspaceId}/pilares` },
    { label: "Documentos", path: `/workspaces/${workspaceId}/documents` },
    { label: "Plano de Ação", path: `/workspaces/${workspaceId}/action-plan` },
    { label: "Incidentes", path: `/workspaces/${workspaceId}/incidents` },
    { label: "Solicitações", path: `/workspaces/${workspaceId}/data-subject-requests` },
    { label: "Buscar", path: `/workspaces/${workspaceId}/search` },
  ];

  return (
    <div>
      <Link
        to="/dashboard"
        className="flex items-center gap-1.5 text-[#0A0A0A] hover:text-[#B4201A] text-sm mb-4 font-medium transition-colors w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Voltar aos Workspaces
      </Link>

      <div className="flex gap-1 border-b border-[#0A0A0A]/12 mb-6">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                isActive
                  ? "border-[#0A0A0A] text-[#0A0A0A]"
                  : "border-transparent text-[#0A0A0A]/55 hover:text-[#0A0A0A]/80"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </div>

      <Outlet />
      {workspaceId && <ChatWidget workspaceId={workspaceId} />}
    </div>
  );
}