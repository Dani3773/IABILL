import { X, UserPlus } from "lucide-react";
import { createEmployee, updateEmployee } from "../api/employeeService";
import { getErrorMessage } from "../api/errorUtils";
import type { Employee } from "../types/employee";
import { useEffect, useState, type FormEvent } from "react";
import { fetchSectors } from "../api/sectorService";
import type { Sector } from "../types/sector";

interface Props {
  workspaceId: string;
  editing: Employee | null;
  onClose: () => void;
  onSaved: (employee: Employee) => void;
}

export function EmployeeModal({ workspaceId, editing, onClose, onSaved }: Props) {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [name, setName] = useState(editing?.name ?? "");
  const [jobTitle, setJobTitle] = useState(editing?.jobTitle ?? "");
  const [sectorId, setSectorId] = useState(editing?.sectorId ?? "");
  const [email, setEmail] = useState(editing?.email ?? "");
  const [active, setActive] = useState(editing?.active ?? true);

  useEffect(() => {
    fetchSectors(workspaceId).then(setSectors).catch(() => setSectors([]));
  }, [workspaceId]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const payload = {
        workspaceId,
        name,
        jobTitle: jobTitle || undefined,
        sectorId: sectorId || undefined,
        email: email || undefined,
        active,
      };
      const saved = editing ? await updateEmployee(editing.id, payload) : await createEmployee(payload);
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível salvar o colaborador."));
    } finally {
      setIsLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg bg-[#FBF8F8] text-[#0A0A0A] text-sm px-3 py-2 border border-[#0A0A0A]/10 focus:outline-none focus:ring-2 focus:ring-[#D92B21]/30 focus:border-[#0A0A0A] placeholder:text-[#0A0A0A]/40";
  const labelClass = "block text-xs font-medium text-[#0A0A0A]/60 mb-1.5";

  return (
    <div className="fixed inset-0 bg-[#0A0A0A]/40 flex items-center justify-center px-4 z-50">
      <div className="w-full max-w-md bg-white rounded-xl p-6 shadow-2xl border border-[#0A0A0A]/10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D92B21]/10 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-[#B4201A]" />
            </div>
            <h2 className="text-lg text-[#0A0A0A]">
              {editing ? "Editar Colaborador" : "Novo Colaborador"}
            </h2>
          </div>
          <button onClick={onClose} className="text-[#0A0A0A]/40 hover:text-[#0A0A0A] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Nome completo</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Cargo <span className="text-[#0A0A0A]/40">(opcional)</span></label>
              <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Setor <span className="text-[#0A0A0A]/40">(opcional)</span></label>
              <select value={sectorId} onChange={(e) => setSectorId(e.target.value)} className={inputClass}>
                <option value="">Sem setor definido</option>
                {sectors.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className={labelClass}>E-mail <span className="text-[#0A0A0A]/40">(opcional, só para registro)</span></label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>
          <label className="flex items-center gap-2 text-sm text-[#0A0A0A]/70 cursor-pointer">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded border-[#0A0A0A]/20 text-[#B4201A] focus:ring-[#D92B21]/30"
            />
            Colaborador ativo
          </label>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-[#0A0A0A] hover:bg-[#2A2A2A] disabled:opacity-50 text-white text-sm font-semibold rounded-lg py-2.5 transition-colors"
            >
              {isLoading ? "Salvando..." : editing ? "Salvar alterações" : "Adicionar colaborador"}
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-[#0A0A0A]/5 hover:bg-[#0A0A0A]/10 text-[#0A0A0A] text-sm font-medium rounded-lg py-2.5 transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}