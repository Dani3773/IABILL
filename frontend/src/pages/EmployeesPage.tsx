import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Users, Pencil, Trash2 } from "lucide-react";
import { fetchEmployees, deleteEmployee } from "../api/employeeService";
import { EmployeeModal } from "../components/EmployeeModal";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Alert } from "../components/Alert";
import { getErrorMessage } from "../api/errorUtils";
import type { Employee } from "../types/employee";

export function EmployeesPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    load(workspaceId);
  }, [workspaceId]);

  function load(id: string) {
    setIsLoading(true);
    fetchEmployees(id)
      .then(setEmployees)
      .catch((err) => setError(getErrorMessage(err, "Não foi possível carregar os colaboradores.")))
      .finally(() => setIsLoading(false));
  }

  function handleSaved(employee: Employee) {
    setEmployees((prev) => {
      const exists = prev.some((e) => e.id === employee.id);
      return exists ? prev.map((e) => (e.id === employee.id ? employee : e)) : [...prev, employee];
    });
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Remover este colaborador do registro?")) return;
    try {
      await deleteEmployee(id);
      setEmployees((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível remover o colaborador."));
    }
  }

  if (isLoading) return <LoadingSpinner label="Carregando colaboradores..." />;

  return (
    <div>
      <Link
        to={`/workspaces/${workspaceId}/pilares/treinamento`}
        className="flex items-center gap-1.5 text-[#0d7a6d] hover:text-[#14B8A6] text-sm mb-4 font-medium transition-colors w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Voltar aos Treinamentos
      </Link>

      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl font-serif text-[#1B2233]">Colaboradores</h1>
          <p className="text-sm text-[#1B2233]/55 mt-0.5">
            Lista de colaboradores da empresa, usada para registrar participação em treinamentos. Não têm acesso ao sistema.
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="bg-[#14B8A6] hover:bg-[#10a595] text-[#0A0D16] text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors shrink-0"
        >
          + Novo Colaborador
        </button>
      </div>

      {error && <div className="my-4"><Alert type="error" message={error} /></div>}

      {employees.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#1B2233]/10 p-10 text-center mt-6">
          <Users className="w-8 h-8 text-[#1B2233]/25 mx-auto mb-3" />
          <p className="text-[#1B2233]/55 text-sm">Nenhum colaborador registrado ainda.</p>
        </div>
      ) : (
        <div className="space-y-2 mt-6">
          {employees.map((employee) => (
            <div key={employee.id} className="bg-white rounded-xl p-4 border border-[#1B2233]/10 flex items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-[#1B2233]">{employee.name}</p>
                  {!employee.active && (
                    <span className="text-[10px] font-mono uppercase tracking-wide bg-[#1B2233]/8 text-[#1B2233]/50 rounded px-1.5 py-0.5">Inativo</span>
                  )}
                </div>
                <p className="text-xs text-[#1B2233]/50">
                  {[employee.jobTitle, employee.department].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button onClick={() => { setEditing(employee); setShowModal(true); }} className="text-[#1B2233]/40 hover:text-[#14B8A6] transition-colors" title="Editar">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(employee.id)} className="text-[#1B2233]/40 hover:text-red-600 transition-colors" title="Remover">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && workspaceId && (
        <EmployeeModal workspaceId={workspaceId} editing={editing} onClose={() => setShowModal(false)} onSaved={handleSaved} />
      )}
    </div>
  );
}