import { useEffect, useState, type FormEvent } from "react";
import { X, GraduationCap } from "lucide-react";
import { createTraining } from "../api/trainingService";
import { fetchEmployees } from "../api/employeeService";
import { getErrorMessage } from "../api/errorUtils";
import { TRAINING_METHOD_LABELS, type Training, type TrainingMethod } from "../types/training";
import type { Employee } from "../types/employee";

interface Props {
  workspaceId: string;
  onClose: () => void;
  onSaved: (training: Training) => void;
}

export function TrainingModal({ workspaceId, onClose, onSaved }: Props) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [method, setMethod] = useState<TrainingMethod>("PRESENCIAL");
  const [trainingDate, setTrainingDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendeeIds, setAttendeeIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchEmployees(workspaceId).then(setEmployees).catch(() => setEmployees([]));
  }, [workspaceId]);

  function toggleAttendee(id: string) {
    setAttendeeIds((prev) => (prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (attendeeIds.length === 0) {
      setError("Selecione ao menos um participante.");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const saved = await createTraining({
        workspaceId,
        title,
        description: description || undefined,
        method,
        trainingDate,
        attendeeIds,
      });
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível registrar o treinamento."));
    } finally {
      setIsLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg bg-[#F5F2EA] text-[#1B2233] text-sm px-3 py-2 border border-[#1B2233]/10 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6] placeholder:text-[#1B2233]/40";
  const labelClass = "block text-xs font-medium text-[#1B2233]/60 mb-1.5";

  return (
    <div className="fixed inset-0 bg-[#1B2233]/40 backdrop-blur-sm flex items-center justify-center px-4 z-50 py-8 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-xl p-6 shadow-2xl border border-[#1B2233]/10 my-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#14B8A6]/10 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-[#14B8A6]" />
            </div>
            <h2 className="text-lg font-serif text-[#1B2233]">Registrar Treinamento</h2>
          </div>
          <button onClick={onClose} className="text-[#1B2233]/40 hover:text-[#1B2233] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Título</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Ex: Conscientização sobre LGPD - Turma 2026" className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Descrição <span className="text-[#1B2233]/40">(opcional)</span></label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Método</label>
              <select value={method} onChange={(e) => setMethod(e.target.value as TrainingMethod)} className={inputClass}>
                {Object.entries(TRAINING_METHOD_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Data</label>
              <input type="date" value={trainingDate} onChange={(e) => setTrainingDate(e.target.value)} required className={inputClass} />
            </div>
          </div>

          <div>
            <label className={labelClass}>Participantes ({attendeeIds.length} selecionado{attendeeIds.length !== 1 ? "s" : ""})</label>
            {employees.length === 0 ? (
              <p className="text-xs text-[#1B2233]/50">
                Nenhum colaborador cadastrado ainda. Cadastre colaboradores na tela de Colaboradores antes de registrar um treinamento.
              </p>
            ) : (
              <div className="max-h-40 overflow-y-auto border border-[#1B2233]/10 rounded-lg divide-y divide-[#1B2233]/8">
                {employees.map((employee) => (
                  <label key={employee.id} className="flex items-center gap-2 px-3 py-2 text-sm text-[#1B2233]/80 hover:bg-[#F5F2EA] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={attendeeIds.includes(employee.id)}
                      onChange={() => toggleAttendee(employee.id)}
                      className="rounded border-[#1B2233]/20 text-[#14B8A6] focus:ring-[#14B8A6]/30"
                    />
                    {employee.name}
                    {employee.jobTitle && <span className="text-[#1B2233]/40">— {employee.jobTitle}</span>}
                  </label>
                ))}
              </div>
            )}
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={isLoading} className="flex-1 bg-[#14B8A6] hover:bg-[#10a595] disabled:opacity-50 text-[#0A0D16] text-sm font-semibold rounded-lg py-2.5 transition-colors">
              {isLoading ? "Registrando..." : "Registrar treinamento"}
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