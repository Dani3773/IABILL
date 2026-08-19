import { useState, type FormEvent } from "react";
import { X, UserPlus } from "lucide-react";
import { createEmployee, updateEmployee } from "../api/employeeService";
import { getErrorMessage } from "../api/errorUtils";
import type { Employee } from "../types/employee";

interface Props {
  workspaceId: string;
  editing: Employee | null;
  onClose: () => void;
  onSaved: (employee: Employee) => void;
}

export function EmployeeModal({ workspaceId, editing, onClose, onSaved }: Props) {
  const [name, setName] = useState(editing?.name ?? "");
  const [jobTitle, setJobTitle] = useState(editing?.jobTitle ?? "");
  const [department, setDepartment] = useState(editing?.department ?? "");
  const [email, setEmail] = useState(editing?.email ?? "");
  const [active, setActive] = useState(editing?.active ?? true);
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
        department: department || undefined,
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
    "w-full rounded-lg bg-[#F5F2EA] text-[#1B2233] text-sm px-3 py-2 border border-[#1B2233]/10 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6] placeholder:text-[#1B2233]/40";
  const labelClass = "block text-xs font-medium text-[#1B2233]/60 mb-1.5";

  return (
    <div className="fixed inset-0 bg-[#1B2233]/40 backdrop-blur-sm flex items-center justify-center px-4 z-50">
      <div className="w-full max-w-md bg-white rounded-xl p-6 shadow-2xl border border-[#1B2233]/10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#14B8A6]/10 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-[#14B8A6]" />
            </div>
            <h2 className="text-lg font-serif text-[#1B2233]">
              {editing ? "Editar Colaborador" : "Novo Colaborador"}
            </h2>
          </div>
          <button onClick={onClose} className="text-[#1B2233]/40 hover:text-[#1B2233] transition-colors">
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
              <label className={labelClass}>Cargo <span className="text-[#1B2233]/40">(opcional)</span></label>
              <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Departamento <span className="text-[#1B2233]/40">(opcional)</span></label>
              <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>E-mail <span className="text-[#1B2233]/40">(opcional, só para registro)</span></label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
          </div>
          <label className="flex items-center gap-2 text-sm text-[#1B2233]/70 cursor-pointer">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="rounded border-[#1B2233]/20 text-[#14B8A6] focus:ring-[#14B8A6]/30"
            />
            Colaborador ativo
          </label>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-[#14B8A6] hover:bg-[#10a595] disabled:opacity-50 text-[#0A0D16] text-sm font-semibold rounded-lg py-2.5 transition-colors"
            >
              {isLoading ? "Salvando..." : editing ? "Salvar alterações" : "Adicionar colaborador"}
            </button>
            <button type="button" onClick={onClose} className="flex-1 bg-[#1B2233]/5 hover:bg-[#1B2233]/10 text-[#1B2233] text-sm font-medium rounded-lg py-2.5 transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}