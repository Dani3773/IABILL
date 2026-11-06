import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { Building2, Trash2 } from "lucide-react";
import { fetchSectors, createSector, deleteSector } from "../api/sectorService";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Alert } from "../components/Alert";
import { getErrorMessage } from "../api/errorUtils";
import type { Sector } from "../types/sector";

export function SectorsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    load(workspaceId);
  }, [workspaceId]);

  function load(id: string) {
    setIsLoading(true);
    fetchSectors(id)
      .then(setSectors)
      .catch((err) => setError(getErrorMessage(err, "Não foi possível carregar os setores.")))
      .finally(() => setIsLoading(false));
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!workspaceId || !newName.trim()) return;
    setIsSaving(true);
    setError(null);
    try {
      const created = await createSector({ workspaceId, name: newName });
      setSectors((prev) => [...prev, created]);
      setNewName("");
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível criar o setor."));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Remover este setor? Colaboradores, atividades e fornecedores vinculados ficarão sem setor definido.")) return;
    try {
      await deleteSector(id);
      setSectors((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível remover o setor."));
    }
  }

  if (isLoading) return <LoadingSpinner label="Carregando setores..." />;

  return (
    <div className="max-w-xl mx-auto">

      <h1 className="text-xl text-[#0A0A0A] mb-1">Setores / Departamentos</h1>
      <p className="text-sm text-[#0A0A0A]/55 mb-6">
        Cadastre os setores da empresa para organizar colaboradores, atividades de tratamento e fornecedores por área.
      </p>

      {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

      <form onSubmit={handleCreate} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Ex: Recursos Humanos, TI, Marketing"
          className="flex-1 rounded-lg bg-white text-[#0A0A0A] text-sm px-3 py-2.5 border border-[#0A0A0A]/10 focus:outline-none focus:ring-2 focus:ring-[#D92B21]/30 focus:border-[#0A0A0A] placeholder:text-[#0A0A0A]/40"
        />
        <button
          type="submit"
          disabled={isSaving || !newName.trim()}
          className="bg-[#D92B21] hover:bg-[#B4201A] disabled:opacity-50 text-white text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors"
        >
          {isSaving ? "Adicionando..." : "+ Adicionar"}
        </button>
      </form>

      {sectors.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-10 text-center">
          <Building2 className="w-8 h-8 text-[#0A0A0A]/25 mx-auto mb-3" />
          <p className="text-[#0A0A0A]/55 text-sm">Nenhum setor cadastrado ainda.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sectors.map((sector) => (
            <div key={sector.id} className="bg-white rounded-xl p-4 border border-[#0A0A0A]/10 flex items-center justify-between">
              <p className="font-medium text-[#0A0A0A]">{sector.name}</p>
              <button onClick={() => handleDelete(sector.id)} className="text-[#0A0A0A]/40 hover:text-red-600 transition-colors" title="Remover">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}