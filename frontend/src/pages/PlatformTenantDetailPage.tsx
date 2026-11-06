import { useEffect, useState, type FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Pencil } from "lucide-react";
import {
  fetchTenantDetail,
  updateTenant,
  updateUserRole,
  resetUserPassword,
  setTenantActive,
  updateWorkspace,
  fetchWorkspaceDetail,
} from "../api/platformService";
import { CreateWorkspaceModal } from "../components/CreateWorkspaceModal";
import type { Workspace, WorkspaceRequest } from "../types/workspace";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Alert } from "../components/Alert";
import { getErrorMessage } from "../api/errorUtils";
import type { PlatformTenantDetail } from "../types/platform";

export function PlatformTenantDetailPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [tenant, setTenant] = useState<PlatformTenantDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<"ADMIN" | "USER" | "DPO" | "SUPER_ADMIN">("USER");
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [editingWorkspace, setEditingWorkspace] = useState<Workspace | null>(null);

  useEffect(() => {
    if (!tenantId) return;
    load(tenantId);
  }, [tenantId]);

  function load(id: string) {
    setIsLoading(true);
    fetchTenantDetail(id)
      .then((data) => {
        setTenant(data);
        setName(data.name);
      })
      .catch((err) => setError(getErrorMessage(err, "Não foi possível carregar o tenant.")))
      .finally(() => setIsLoading(false));
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!tenantId) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await updateTenant(tenantId, { name });
      setTenant(updated);
      setIsEditing(false);
      setSuccessMessage("Dados da empresa atualizados.");
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível salvar as alterações."));
    } finally {
      setSaving(false);
    }
  }

  async function handleChangeRole(userId: string) {
    setError(null);
    try {
      await updateUserRole(userId, newRole);
      if (tenantId) load(tenantId);
      setEditingUserId(null);
      setSuccessMessage("Papel do usuário atualizado.");
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível atualizar o papel."));
    }
  }

  async function handleResetPassword(userId: string) {
    setError(null);
    try {
      const result = await resetUserPassword(userId);
      setTempPassword(result.temporaryPassword);
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível resetar a senha."));
    }
  }

  async function handleToggleActive() {
    if (!tenantId || !tenant) return;
    const newStatus = !tenant.active;
    const confirmMessage = newStatus
      ? "Reativar esta empresa? Os usuários voltarão a ter acesso normal."
      : "Desativar esta empresa? Todos os usuários perderão acesso em até 60 segundos.";
    if (!window.confirm(confirmMessage)) return;
    setError(null);
    try {
      await setTenantActive(tenantId, newStatus);
      load(tenantId);
      setSuccessMessage(newStatus ? "Empresa reativada." : "Empresa desativada.");
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível alterar o status da empresa."));
    }
  }

  async function handleClickEditWorkspace(workspaceId: string) {
    setError(null);
    try {
      const full = await fetchWorkspaceDetail(workspaceId);
      setEditingWorkspace(full);
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível carregar os dados da unidade."));
    }
  }

  async function handleWorkspaceSaveOverride(payload: WorkspaceRequest): Promise<Workspace> {
    if (!editingWorkspace) throw new Error("Nenhum workspace em edição");
    const { tenantId: _tenantId, ...rest } = payload;
    const updated = await updateWorkspace(editingWorkspace.id, rest);
    if (tenantId) load(tenantId);
    setSuccessMessage("Unidade atualizada.");
    return updated as unknown as Workspace;
  }

  if (isLoading) return <LoadingSpinner label="Carregando empresa..." />;
  if (!tenant) return <Alert type="error" message="Empresa não encontrada." />;

  const inputClass =
    "w-full rounded-lg bg-[#fbfaf6] text-[#0A0A0A] text-sm px-3 py-2 border border-[#0A0A0A]/10 focus:outline-none focus:ring-2 focus:ring-[#D92B21]/30 focus:border-[#0A0A0A]";

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to="/platform"
        className="flex items-center gap-1.5 text-[#0A0A0A] hover:text-[#B4201A] text-sm mb-4 font-medium transition-colors w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Voltar à Plataforma
      </Link>

      <div className="space-y-3 mb-4">
        {error && <Alert type="error" message={error} />}
        {successMessage && <Alert type="success" message={successMessage} />}
      </div>

      <div className="bg-white rounded-xl p-5 border border-[#0A0A0A]/10 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg text-[#0A0A0A]">Dados da Empresa</h2>
          <div className="flex items-center gap-3">
            <span
              className={`text-xs px-2 py-1 rounded font-medium ${
                tenant.active ? "bg-[#D92B21]/12 text-[#0A0A0A]" : "bg-red-50 text-red-700"
              }`}
            >
              {tenant.active ? "Ativa" : "Desativada"}
            </span>
            {!isEditing && (
              <>
                <button onClick={() => setIsEditing(true)} className="text-sm text-[#0A0A0A] hover:underline font-medium">
                  Editar
                </button>
                <button
                  onClick={handleToggleActive}
                  className={`text-sm hover:underline font-medium ${tenant.active ? "text-red-600" : "text-[#0A0A0A]"}`}
                >
                  {tenant.active ? "Desativar" : "Reativar"}
                </button>
              </>
            )}
          </div>
        </div>
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-[#0A0A0A]/60 mb-1">Nome</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#D92B21] hover:bg-[#B4201A] disabled:opacity-50 text-white text-sm font-semibold rounded-lg px-4 py-2 transition-colors"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-sm text-[#0A0A0A]/55 hover:text-[#0A0A0A]/80 px-4 py-2"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-[#0A0A0A]/50">Nome</dt>
              <dd className="text-[#0A0A0A]">{tenant.name}</dd>
            </div>
            <div>
              <dt className="text-[#0A0A0A]/50">Cadastrada em</dt>
              <dd className="text-[#0A0A0A]">{new Date(tenant.createdAt).toLocaleDateString("pt-BR")}</dd>
            </div>
          </dl>
        )}
      </div>

      <div className="bg-white rounded-xl p-5 border border-[#0A0A0A]/10 mb-6">
        <h2 className="text-lg text-[#0A0A0A] mb-3">Usuários ({tenant.users.length})</h2>
        <div className="space-y-2">
          {tenant.users.map((u) => (
            <div key={u.id} className="bg-[#fbfaf6] rounded-lg px-3 py-2.5 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#0A0A0A]">{u.username}</p>
                  <p className="text-[#0A0A0A]/50 text-xs">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  {u.dpoSubstitute && (
                    <span className="text-xs px-2 py-1 rounded bg-[#D92B21]/12 text-[#0A0A0A] font-medium">
                      Substituto
                    </span>
                  )}
                  <span className="text-xs px-2 py-1 rounded bg-[#0A0A0A]/8 text-[#0A0A0A]/70 font-medium">
                    {u.role}
                  </span>
                  <button
                    onClick={() => {
                      setEditingUserId(editingUserId === u.id ? null : u.id);
                      setNewRole(u.role);
                    }}
                    className="text-xs text-[#0A0A0A] hover:underline font-medium"
                  >
                    Mudar papel
                  </button>
                  <button
                    onClick={() => handleResetPassword(u.id)}
                    className="text-xs text-[#B4201A] hover:underline font-medium"
                  >
                    Resetar senha
                  </button>
                </div>
              </div>
              {editingUserId === u.id && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#0A0A0A]/10">
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as "ADMIN" | "USER" | "DPO" | "SUPER_ADMIN")}
                    className="text-xs rounded bg-white text-[#0A0A0A] px-2 py-1 border border-[#0A0A0A]/10 focus:outline-none focus:border-[#0A0A0A]"
                  >
                    <option value="USER">USER</option>
                    <option value="DPO">DPO</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  </select>
                  <button
                    onClick={() => handleChangeRole(u.id)}
                    className="text-xs bg-[#D92B21] hover:bg-[#B4201A] text-white font-semibold rounded px-3 py-1 transition-colors"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setEditingUserId(null)}
                    className="text-xs text-[#0A0A0A]/50 hover:text-[#0A0A0A]/75 px-2"
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {tempPassword && (
        <div className="fixed inset-0 bg-[#0A0A0A]/40 flex items-center justify-center px-4 z-50">
          <div className="w-full max-w-sm bg-white rounded-xl p-6 shadow-2xl border border-amber-300">
            <h3 className="text-[#0A0A0A] text-lg mb-2">Senha temporária gerada</h3>
            <p className="text-[#0A0A0A]/55 text-xs mb-3">
              Copie e envie ao usuário por um canal seguro. Essa senha não pode ser recuperada depois de fechar
              esta janela.
            </p>
            <div className="bg-[#fbfaf6] rounded-lg px-3 py-2 text-[#0A0A0A] text-sm mb-4 select-all border border-[#0A0A0A]/10">
              {tempPassword}
            </div>
            <button
              onClick={() => setTempPassword(null)}
              className="w-full bg-[#D92B21] hover:bg-[#B4201A] text-white text-sm font-semibold rounded-lg py-2 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-5 border border-[#0A0A0A]/10">
        <h2 className="text-lg text-[#0A0A0A] mb-3">Unidades ({tenant.workspaces.length})</h2>
        <div className="space-y-2">
          {tenant.workspaces.map((w) => (
            <div key={w.id} className="flex items-center justify-between bg-[#fbfaf6] rounded-lg px-3 py-2.5 text-sm">
              <div>
                <p className="text-[#0A0A0A]">{w.name}</p>
                <p className="text-[#0A0A0A]/45 text-xs ">{w.documentId}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 rounded bg-[#D92B21]/12 text-[#B4201A] font-medium">
                  {w.type}
                </span>
                <button
                  onClick={() => handleClickEditWorkspace(w.id)}
                  className="text-[#0A0A0A]/40 hover:text-[#B4201A] transition-colors"
                  title="Editar"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div> 

            {editingWorkspace && (
        <CreateWorkspaceModal
          editing={editingWorkspace}
          onClose={() => setEditingWorkspace(null)}
          onCreated={() => setEditingWorkspace(null)}
          saveOverride={handleWorkspaceSaveOverride}
        />
      )}
      
    </div>
  );
}