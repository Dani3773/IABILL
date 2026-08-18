import { Outlet, useNavigate, Link, useLocation } from "react-router-dom";
import { LayoutGrid, Users, ScrollText, LogOut, Shield, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  USER: "Usuário",
  DPO: "Encarregado de Dados (DPO)",
  SUPER_ADMIN: "Super Administrador",
};

function initials(name: string | null): string {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, tenantId, username, email, clearAuth } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);

  async function handleLogout() {
    await clearAuth();
    navigate("/login");
  }

  const navItems = [
    {
      label: "Workspaces",
      path: "/dashboard",
      icon: LayoutGrid,
      adminOnly: false,
      superAdminOnly: false,
    },
    {
      label: "Usuários",
      path: "/users",
      icon: Users,
      adminOnly: true,
      superAdminOnly: false,
    },
    {
      label: "Auditoria",
      path: "/audit-logs",
      icon: ScrollText,
      adminOnly: true,
      superAdminOnly: false,
    },
    {
      label: "Plataforma",
      path: "/platform",
      icon: Shield,
      adminOnly: false,
      superAdminOnly: true,
    },
  ];

  const roleLabel = role ? (ROLE_LABELS[role] ?? role) : "—";

  return (
    <div className="flex min-h-screen bg-[#F5F2EA]">
      <aside className="w-60 bg-[#161310] flex flex-col shrink-0">
        <div className="p-5 border-b border-white/10">
          <span className="font-serif text-xl text-white tracking-tight select-none">
            IA<span className="text-[#14B8A6]">Bill</span>
          </span>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems
            .filter((item) => {
              const passesAdminCheck =
                !item.adminOnly || role === "ADMIN" || role === "SUPER_ADMIN";
              const passesSuperAdminCheck =
                !item.superAdminOnly || role === "SUPER_ADMIN";
              const passesTenantCheck =
                item.superAdminOnly || tenantId !== null;
              return (
                passesAdminCheck && passesSuperAdminCheck && passesTenantCheck
              );
            })
            .map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#14B8A6]/15 text-[#14B8A6]"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
        </nav>

        <div className="relative p-3 border-t border-white/10">
          {profileOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-[#1E1B17] border border-white/10 rounded-lg shadow-xl overflow-hidden">
              <div className="px-3 py-2.5 border-b border-white/10">
                <p className="text-sm font-medium text-white truncate">{username ?? "—"}</p>
                <p className="text-xs text-slate-500 truncate">{email ?? "—"}</p>
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
            className="flex items-center gap-2.5 w-full px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-[#14B8A6]/20 border border-[#14B8A6]/30 flex items-center justify-center shrink-0">
              <span className="text-[#14B8A6] text-xs font-semibold">{initials(username)}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{username ?? "—"}</p>
              <p className="text-[11px] text-slate-500 truncate">{roleLabel}</p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform shrink-0 ${profileOpen ? "rotate-180" : ""}`} />
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}