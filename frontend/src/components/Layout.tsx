import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { LayoutGrid, Users, ScrollText, LogOut, Shield, ChevronDown, ChevronsLeft, ChevronsRight } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { AvatarImage } from "../components/AvatarImage";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  USER: "Usuário",
  DPO: "Encarregado de Dados (DPO)",
  SUPER_ADMIN: "Super Administrador",
};

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, tenantId, username, email, jobTitle, committeeRole, clearAuth } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  async function handleLogout() {
    await clearAuth();
    navigate("/login");
  }

  const navItems = [
    { label: "Workspaces", path: "/dashboard", icon: LayoutGrid, adminOnly: false, superAdminOnly: false },
    { label: "Usuários", path: "/users", icon: Users, adminOnly: true, superAdminOnly: false },
    { label: "Auditoria", path: "/audit-logs", icon: ScrollText, adminOnly: true, superAdminOnly: false },
    { label: "Plataforma", path: "/platform", icon: Shield, adminOnly: false, superAdminOnly: true },
  ];

  const roleLabel = role ? (ROLE_LABELS[role] ?? role) : "—";

  return (
    <div className="flex h-screen bg-[#F5F2EA] overflow-hidden">
      <aside className={`${collapsed ? "w-16" : "w-60"} h-full bg-[#161310] flex flex-col shrink-0 transition-all duration-200`}>
        <div className={`p-5 border-b border-white/10 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed && (
            <span className="font-serif text-xl text-white tracking-tight select-none">
              IA<span className="text-[#14B8A6]">Bill</span>
            </span>
          )}
          <button
            onClick={() => setCollapsed((v) => !v)}
            className="text-slate-500 hover:text-slate-300 transition-colors"
            title={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? <ChevronsRight className="w-4 h-4" /> : <ChevronsLeft className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems
            .filter((item) => {
              const passesAdminCheck = !item.adminOnly || role === "ADMIN" || role === "SUPER_ADMIN";
              const passesSuperAdminCheck = !item.superAdminOnly || role === "SUPER_ADMIN";
              const passesTenantCheck = item.superAdminOnly || tenantId !== null;
              return passesAdminCheck && passesSuperAdminCheck && passesTenantCheck;
            })
            .map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    collapsed ? "justify-center" : ""
                  } ${
                    isActive
                      ? "bg-[#14B8A6]/15 text-[#14B8A6]"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {!collapsed && item.label}
                </Link>
              );
            })}
        </nav>

        <div className="relative p-3 border-t border-white/10">
          {profileOpen && (
            <div className={`absolute bottom-full mb-2 bg-[#1E1B17] border border-white/10 rounded-lg shadow-xl overflow-hidden ${
              collapsed ? "left-3 w-56" : "left-3 right-3"
            }`}>
              <div className="px-3 py-2.5 border-b border-white/10">
                <p className="text-sm font-medium text-white truncate">{username ?? "—"}</p>
                <p className="text-xs text-slate-500 truncate">{email ?? "—"}</p>
                {jobTitle && <p className="text-xs text-slate-400 mt-1 truncate">{jobTitle}</p>}
                {committeeRole && (
                  <p className="text-[11px] text-[#14B8A6] mt-0.5 truncate">Comitê LGPD: {committeeRole}</p>
                )}
              </div>
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
              collapsed ? "justify-center px-0" : "px-2"
            }`}
          >
            <AvatarImage email={email} name={username} size={32} />
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">{username ?? "—"}</p>
                  <p className="text-[11px] text-slate-500 truncate">{jobTitle || roleLabel}</p>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform shrink-0 ${profileOpen ? "rotate-180" : ""}`} />
              </>
            )}
          </button>
        </div>
      </aside>

      <main className="flex-1 h-full overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}