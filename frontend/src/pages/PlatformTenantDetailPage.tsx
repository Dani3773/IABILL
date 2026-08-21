import { useEffect, useState, type FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  fetchTenantDetail,
  updateTenant,
  updateUserRole,
  resetUserPassword,
  setTenantActive,
} from "../api/platformService";
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
  const [documentId, setDocumentId] = useState("");
  const [country, setCountry] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState<"ADMIN" | "USER" | "DPO" | "SUPER_ADMIN">("USER");
  const [tempPassword, setTempPassword] = useState<string | null>(null);

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
        setDocumentId(data.documentId);
        setCountry(data.country);
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
      const updated = await updateTenant(tenantId, { name, documentId, country });
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

  if (isLoading) return <LoadingSpinner label="Carregando empresa..." />;
  if (!tenant) return <Alert type="error" message="Empresa não encontrada." />;

  const inputClass =
    "w-full rounded-lg bg-[#F5F2EA] text-[#1B2233] text-sm px-3 py-2 border border-[#1B2233]/10 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6]";

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to="/platform"
        className="flex items-center gap-1.5 text-[#0d7a6d] hover:text-[#14B8A6] text-sm mb-4 font-medium transition-colors w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Voltar à Plataforma
      </Link>

      <div className="space-y-3 mb-4">
        {error && <Alert type="error" message={error} />}
        {successMessage && <Alert type="success" message={successMessage} />}
      </div>

      <div className="bg-white rounded-xl p-5 border border-[#1B2233]/10 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-serif text-[#1B2233]">Dados da Empresa</h2>
          <div className="flex items-center gap-3">
            <span
              className={`text-xs px-2 py-1 rounded font-medium ${
                tenant.active ? "bg-[#14B8A6]/12 text-[#0d7a6d]" : "bg-red-50 text-red-700"
              }`}
            >
              {tenant.active ? "Ativa" : "Desativada"}
            </span>
            {!isEditing && (
              <>
                <button onClick={() => setIsEditing(true)} className="text-sm text-[#0d7a6d] hover:underline font-medium">
                  Editar
                </button>
                <button
                  onClick={handleToggleActive}
                  className={`text-sm hover:underline font-medium ${tenant.active ? "text-red-600" : "text-[#0d7a6d]"}`}
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
              <label className="block text-xs font-medium text-[#1B2233]/60 mb-1">Nome</label>
              <input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1B2233]/60 mb-1">CNPJ</label>
              <input value={documentId} onChange={(e) => setDocumentId(e.target.value)} required className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#1B2233]/60 mb-1">País</label>
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value.toUpperCase())}
                maxLength={2}
                required
                className={inputClass}
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="bg-[#14B8A6] hover:bg-[#10a595] disabled:opacity-50 text-[#0A0D16] text-sm font-semibold rounded-lg px-4 py-2 transition-colors"
              >
                {saving ? "Salvando..." : "Salvar"}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-sm text-[#1B2233]/55 hover:text-[#1B2233]/80 px-4 py-2"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-[#1B2233]/50">Nome</dt>
              <dd className="text-[#1B2233]">{tenant.name}</dd>
            </div>
            <div>
              <dt className="text-[#1B2233]/50">Cadastrada em</dt>
              <dd className="text-[#1B2233]">{new Date(tenant.createdAt).toLocaleDateString("pt-BR")}</dd>
            </div>
          </dl>
        )}
      </div>

      <div className="bg-white rounded-xl p-5 border border-[#1B2233]/10 mb-6">
        <h2 className="text-lg font-serif text-[#1B2233] mb-3">Usuários ({tenant.users.length})</h2>
        <div className="space-y-2">
          {tenant.users.map((u) => (
            <div key={u.id} className="bg-[#F5F2EA] rounded-lg px-3 py-2.5 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#1B2233]">{u.username}</p>
                  <p className="text-[#1B2233]/50 text-xs">{u.email}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded bg-[#1B2233]/8 text-[#1B2233]/70 font-medium">
                    {u.role}
                  </span>
                  <button
                    onClick={() => {
                      setEditingUserId(editingUserId === u.id ? null : u.id);
                      setNewRole(u.role);
                    }}
                    className="text-xs text-[#0d7a6d] hover:underline font-medium"
                  >
                    Mudar papel
                  </button>
                  <button
                    onClick={() => handleResetPassword(u.id)}
                    className="text-xs text-[#B8862B] hover:underline font-medium"
                  >
                    Resetar senha
                  </button>
                </div>
              </div>
              {editingUserId === u.id && (
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#1B2233]/10">
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as "ADMIN" | "USER" | "DPO" | "SUPER_ADMIN")}
                    className="text-xs rounded bg-white text-[#1B2233] px-2 py-1 border border-[#1B2233]/10 focus:outline-none focus:border-[#14B8A6]"
                  >
                    <option value="USER">USER</option>
                    <option value="DPO">DPO</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                  </select>
                  <button
                    onClick={() => handleChangeRole(u.id)}
                    className="text-xs bg-[#14B8A6] hover:bg-[#10a595] text-[#0A0D16] font-semibold rounded px-3 py-1 transition-colors"
                  >
                    Salvar
                  </button>
                  <button
                    onClick={() => setEditingUserId(null)}
                    className="text-xs text-[#1B2233]/50 hover:text-[#1B2233]/75 px-2"
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
        <div className="fixed inset-0 bg-[#1B2233]/40 backdrop-blur-sm flex items-center justify-center px-4 z-50">
          <div className="w-full max-w-sm bg-white rounded-xl p-6 shadow-2xl border border-amber-300">
            <h3 className="text-[#1B2233] font-serif text-lg mb-2">Senha temporária gerada</h3>
            <p className="text-[#1B2233]/55 text-xs mb-3">
              Copie e envie ao usuário por um canal seguro. Essa senha não pode ser recuperada depois de fechar
              esta janela.
            </p>
            <div className="bg-[#F5F2EA] rounded-lg px-3 py-2 font-mono text-[#0d7a6d] text-sm mb-4 select-all border border-[#1B2233]/10">
              {tempPassword}
            </div>
            <button
              onClick={() => setTempPassword(null)}
              className="w-full bg-[#14B8A6] hover:bg-[#10a595] text-[#0A0D16] text-sm font-semibold rounded-lg py-2 transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-5 border border-[#1B2233]/10">
        <h2 className="text-lg font-serif text-[#1B2233] mb-3">Workspaces ({tenant.workspaces.length})</h2>
        <div className="space-y-2">
          {tenant.workspaces.map((w) => (
            <div key={w.id} className="flex items-center justify-between bg-[#F5F2EA] rounded-lg px-3 py-2 text-sm">
              <div>
                <p className="text-[#1B2233]">{w.name}</p>
                <p className="text-[#1B2233]/45 text-xs font-mono">{w.documentId}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-[#B8862B]/12 text-[#B8862B] font-medium">
                {w.type}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}