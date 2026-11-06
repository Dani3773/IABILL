import { Logo } from "./brand/Logo";
import { Outlet, useNavigate, Link, useLocation, useMatch } from "react-router-dom";
import {
  AlertTriangle,
  BookOpen,
  Building,
  Building2,
  Check,
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
  ClipboardList,
  FileText,
  GraduationCap,
  HelpCircle,
  Home,
  Inbox,
  ListChecks,
  LogOut,
  Menu,
  ScrollText,
  Shield,
  ShieldCheck,
  Sparkles,
  Truck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useWorkspaces, WorkspaceProvider } from "../contexts/WorkspaceContext";
import { AssistantPanel } from "../components/AssistantPanel";
import { AvatarImage } from "../components/AvatarImage";
import { MfaSetupModal } from "../components/MfaSetupModal";
import { fetchMfaStatus, disableMfa } from "../api/authService";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  USER: "Usuário",
  DPO: "Encarregado de Dados (DPO)",
  SUPER_ADMIN: "Super Administrador",
};

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  isActive?: (pathname: string) => boolean;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const OPERATIONAL_PILARES = ["ropa", "fornecedores", "setores", "treinamento"];

function buildWorkspaceNav(base: string): NavGroup[] {
  return [
    {
      items: [
        { label: "Início", path: `${base}/inicio`, icon: Home },
        {
          label: "Documentos",
          path: `${base}/documents`,
          icon: FileText,
          isActive: (pathname) =>
            pathname.startsWith(`${base}/documents`) || pathname.startsWith("/documents/"),
        },
      ],
    },
    {
      label: "Registros",
      items: [
        { label: "Inventário / ROPA", path: `${base}/pilares/ropa`, icon: ClipboardList },
        { label: "Fornecedores", path: `${base}/pilares/fornecedores`, icon: Truck },
        { label: "Setores", path: `${base}/pilares/setores`, icon: Building2 },
        { label: "Treinamento", path: `${base}/pilares/treinamento`, icon: GraduationCap },
      ],
    },
    {
      label: "Demandas",
      items: [
        { label: "Solicitações", path: `${base}/data-subject-requests`, icon: Inbox },
        { label: "Incidentes", path: `${base}/incidents`, icon: AlertTriangle },
        { label: "Plano de Ação", path: `${base}/action-plan`, icon: ListChecks },
      ],
    },
    {
      items: [
        {
          label: "Guia LGPD",
          path: `${base}/pilares`,
          icon: BookOpen,
          isActive: (pathname) =>
            pathname.startsWith(`${base}/pilares`) &&
            !OPERATIONAL_PILARES.some((page) => pathname.startsWith(`${base}/pilares/${page}`)),
        },
      ],
    },
  ];
}

export function Layout() {
  return (
    <WorkspaceProvider>
      <Shell />
    </WorkspaceProvider>
  );
}

function Shell() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    role,
    tenantId,
    username,
    email,
    jobTitle,
    committeeRole,
    clearAuth,
  } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unitsOpen, setUnitsOpen] = useState(false);
  const {
    workspaces,
    currentWorkspace,
    currentWorkspaceId,
    assistantOpen,
    openAssistant,
    closeAssistant,
  } = useWorkspaces();
  const workspaceMatch = useMatch("/workspaces/:workspaceId/*");
  const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null);
  const [showMfaModal, setShowMfaModal] = useState(false);

  useEffect(() => {
    fetchMfaStatus()
      .then((status) => setMfaEnabled(status.enabled))
      .catch(() => setMfaEnabled(null));
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setUnitsOpen(false);
  }, [location.pathname]);

  function switchWorkspace(id: string) {
    setUnitsOpen(false);
    const suffix = workspaceMatch?.params["*"];
    navigate(`/workspaces/${id}/${suffix || "inicio"}`);
  }

  async function handleLogout() {
    await clearAuth();
    navigate("/login");
  }

  async function handleDisableMfa() {
    if (
      !window.confirm(
        "Desativar a verificação em 2 etapas? Sua conta ficará protegida só por senha.",
      )
    )
      return;
    try {
      await disableMfa();
      setMfaEnabled(false);
    } catch {
      // silencioso - falha rara, usuario pode tentar de novo pelo mesmo menu
    }
  }

  const footerItems: NavItem[] = [
    { label: "Unidades", path: "/dashboard", icon: Building },
    { label: "Usuários", path: "/users", icon: Users, adminOnly: true },
    { label: "Auditoria", path: "/audit-logs", icon: ScrollText, adminOnly: true },
    { label: "Ajuda", path: "/ajuda", icon: HelpCircle },
    { label: "Plataforma", path: "/platform", icon: Shield, superAdminOnly: true },
  ].filter((item: NavItem) => {
    const passesAdminCheck = !item.adminOnly || role === "ADMIN" || role === "SUPER_ADMIN";
    const passesSuperAdminCheck = !item.superAdminOnly || role === "SUPER_ADMIN";
    const passesTenantCheck = item.superAdminOnly || tenantId !== null;
    return passesAdminCheck && passesSuperAdminCheck && passesTenantCheck;
  });

  const activeWorkspaceId = workspaceMatch?.params.workspaceId ?? currentWorkspaceId;
  const workspaceGroups =
    tenantId !== null && activeWorkspaceId
      ? buildWorkspaceNav(`/workspaces/${activeWorkspaceId}`)
      : [];

  function renderItem(item: NavItem) {
    const Icon = item.icon;
    const isActive = item.isActive
      ? item.isActive(location.pathname)
      : location.pathname.startsWith(item.path);
    return (
      <Link
        key={item.path}
        to={item.path}
        aria-current={isActive ? "page" : undefined}
        title={collapsed ? item.label : undefined}
        className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
          collapsed ? "md:justify-center" : ""
        } ${
          isActive
            ? "bg-[#D92B21]/20 text-[#FFB3AD]"
            : "text-[#c8c3b8] hover:bg-white/5 hover:text-white"
        }`}
      >
        <Icon className="w-4 h-4 shrink-0" />
        <span className={collapsed ? "md:hidden" : ""}>{item.label}</span>
      </Link>
    );
  }

  const roleLabel = role ? (ROLE_LABELS[role] ?? role) : "—";

  return (
    <div className="flex h-dvh bg-[#fbfaf6] overflow-hidden">
      {mobileOpen && (
        <button
          aria-label="Fechar menu"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 md:static md:z-auto ${
          collapsed ? "md:w-16" : "md:w-64"
        } h-full bg-[#17130e] flex flex-col shrink-0 transition-all duration-200 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div
          className={`px-4 py-4 border-b border-white/10 flex items-center ${collapsed ? "md:justify-center justify-between" : "justify-between"}`}
        >
          <span className={`text-xl text-white tracking-tight select-none ${collapsed ? "md:hidden" : ""}`}>
            <Logo />
          </span>
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="hidden md:block text-[#9b968b] hover:text-white transition-colors"
            title={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? (
              <ChevronsRight className="w-4 h-4" />
            ) : (
              <ChevronsLeft className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-[#9b968b] hover:text-white"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {currentWorkspace && (
          <div className="relative px-3 pt-3">
            <button
              onClick={() => setUnitsOpen((v) => !v)}
              aria-expanded={unitsOpen}
              title={collapsed ? currentWorkspace.name : undefined}
              className={`flex items-center gap-2 w-full rounded-lg bg-white/8 hover:bg-white/12 transition-colors text-left px-3 py-2 ${
                collapsed ? "md:justify-center md:px-0" : ""
              }`}
            >
              <Building2 className="w-4 h-4 text-[#c8c3b8] shrink-0" />
              <span className={`min-w-0 flex-1 ${collapsed ? "md:hidden" : ""}`}>
                <span className="block text-sm font-medium text-white truncate">
                  {currentWorkspace.name}
                </span>
                <span className="block text-[11px] text-[#9b968b]">
                  {currentWorkspace.type === "MATRIZ" ? "Matriz" : "Filial"}
                </span>
              </span>
              <ChevronsUpDown
                className={`w-3.5 h-3.5 text-[#9b968b] shrink-0 ${collapsed ? "md:hidden" : ""}`}
              />
            </button>
            {unitsOpen && (
              <div
                className={`absolute z-20 top-full mt-1 bg-[#262019] border border-white/10 rounded-lg shadow-xl overflow-hidden ${
                  collapsed ? "left-3 w-60" : "left-3 right-3"
                }`}
              >
                <div className="max-h-64 overflow-y-auto">
                  {workspaces.map((workspace) => (
                    <button
                      key={workspace.id}
                      onClick={() => switchWorkspace(workspace.id)}
                      className="flex items-center gap-2 w-full px-3 py-2.5 text-left text-sm text-[#e5e0d6] hover:bg-white/8 transition-colors"
                    >
                      <span className="min-w-0 flex-1 truncate">{workspace.name}</span>
                      {workspace.id === currentWorkspace.id && (
                        <Check className="w-4 h-4 text-[#FFB3AD] shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
                <Link
                  to="/dashboard"
                  className="block px-3 py-2.5 text-sm text-[#c8c3b8] hover:bg-white/8 hover:text-white border-t border-white/10 transition-colors"
                >
                  Gerenciar unidades
                </Link>
              </div>
            )}
          </div>
        )}

        {currentWorkspace && (
          <div className="px-3 pt-2">
            <button
              onClick={() => {
                setMobileOpen(false);
                if (assistantOpen) closeAssistant();
                else openAssistant();
              }}
              aria-pressed={assistantOpen}
              title={collapsed ? "Assistente IA" : undefined}
              className={`flex items-center gap-2.5 w-full rounded-lg px-3 py-2 text-sm font-semibold text-white bg-[#D92B21] hover:bg-[#B4201A] transition-colors ${
                collapsed ? "md:justify-center" : ""
              }`}
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span className={collapsed ? "md:hidden" : ""}>Assistente IA</span>
            </button>
          </div>
        )}

        <nav aria-label="Menu principal" className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-3">
          {workspaceGroups.map((group, index) => (
            <div key={group.label ?? index} className="space-y-0.5">
              {group.label && !collapsed && (
                <p className="px-3 pb-1 text-[11px] font-medium uppercase tracking-wide text-[#8f8a7f]">
                  {group.label}
                </p>
              )}
              {group.items.map(renderItem)}
            </div>
          ))}
          <div className="mt-auto pt-3 border-t border-white/10 space-y-0.5">
            {footerItems.map(renderItem)}
          </div>
        </nav>

        <div className="relative p-3 border-t border-white/10">
          {profileOpen && (
            <div
              className={`absolute bottom-full mb-2 bg-[#262019] border border-white/10 rounded-lg shadow-xl overflow-hidden ${
                collapsed ? "left-3 w-56" : "left-3 right-3"
              }`}
            >
              <div className="px-3 py-2.5 border-b border-white/10">
                <p className="text-sm font-medium text-white truncate">
                  {username ?? "—"}
                </p>
                <p className="text-xs text-[#9b968b] truncate">
                  {email ?? "—"}
                </p>
                {jobTitle && (
                  <p className="text-xs text-[#c8c3b8] mt-1 truncate">
                    {jobTitle}
                  </p>
                )}
                {committeeRole && (
                  <p className="text-[11px] text-[#FFB3AD] mt-0.5 truncate">
                    Comitê LGPD: {committeeRole}
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  if (mfaEnabled) {
                    handleDisableMfa();
                  } else {
                    setShowMfaModal(true);
                    setProfileOpen(false);
                  }
                }}
                className="flex items-center justify-between gap-2.5 w-full px-3 py-2.5 text-sm font-medium text-[#e5e0d6] hover:bg-white/5 transition-colors border-b border-white/10"
              >
                <span className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4" />
                  Verificação em 2 Etapas
                </span>
                <span
                  className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${
                    mfaEnabled
                      ? "bg-[#D92B21]/15 text-[#FFB3AD]"
                      : "bg-white/5 text-[#9b968b]"
                  }`}
                >
                  {mfaEnabled ? "Ativa" : "Inativa"}
                </span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-950/40 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sair
              </button>
            </div>
          )}
          <button
            onClick={() => setProfileOpen((v) => !v)}
            className={`flex items-center gap-2.5 w-full py-1.5 rounded-lg hover:bg-white/5 transition-colors text-left ${
              collapsed ? "md:justify-center md:px-0 px-2" : "px-2"
            }`}
          >
            <AvatarImage email={email} name={username} size={32} />
            {(
              <>
                <div className={`min-w-0 flex-1 ${collapsed ? "md:hidden" : ""}`}>
                  <p className="text-sm font-medium text-white truncate">
                    {username ?? "—"}
                  </p>
                  <p className="text-[11px] text-[#9b968b] truncate">
                    {jobTitle || roleLabel}
                  </p>
                </div>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-[#9b968b] transition-transform shrink-0 ${collapsed ? "md:hidden" : ""} ${profileOpen ? "rotate-180" : ""}`}
                />
              </>
            )}
          </button>
        </div>
      </aside>

      <div className="flex-1 min-w-0 h-full flex flex-col">
        <header className="md:hidden flex items-center gap-3 px-4 h-14 bg-[#17130e] text-white shrink-0">
          <button onClick={() => setMobileOpen(true)} aria-label="Abrir menu">
            <Menu className="w-5 h-5" />
          </button>
          <span className="min-w-0 flex-1 truncate text-sm font-medium">
            {currentWorkspace?.name ?? "IABill"}
          </span>
          {currentWorkspace && (
            <button onClick={() => openAssistant()} aria-label="Abrir assistente" className="text-[#FFB3AD]">
              <Sparkles className="w-5 h-5" />
            </button>
          )}
        </header>
        <main className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-[1200px]">
            <Outlet />
          </div>
        </main>
      </div>

      {assistantOpen && currentWorkspace && (
        <AssistantPanel key={currentWorkspace.id} workspaceId={currentWorkspace.id} />
      )}

      {showMfaModal && (
        <MfaSetupModal
          onClose={() => setShowMfaModal(false)}
          onEnabled={() => setMfaEnabled(true)}
        />
      )}
    </div>
  );
}
