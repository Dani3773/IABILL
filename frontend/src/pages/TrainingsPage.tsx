import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { GraduationCap, Users, Sparkles, Trash2 } from "lucide-react";
import { fetchTrainings, deleteTraining } from "../api/trainingService";
import { TrainingModal } from "../components/TrainingModal";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Alert } from "../components/Alert";
import { getErrorMessage } from "../api/errorUtils";
import { TRAINING_METHOD_LABELS, type Training } from "../types/training";

export function TrainingsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const [trainings, setTrainings] = useState<Training[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    load(workspaceId);
  }, [workspaceId]);

  function load(id: string) {
    setIsLoading(true);
    fetchTrainings(id)
      .then(setTrainings)
      .catch((err) => setError(getErrorMessage(err, "Não foi possível carregar os treinamentos.")))
      .finally(() => setIsLoading(false));
  }

  function handleSaved(training: Training) {
    setTrainings((prev) => [training, ...prev]);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Remover este registro de treinamento?")) return;
    try {
      await deleteTraining(id);
      setTrainings((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível remover o treinamento."));
    }
  }

  function handleGenerateMaterial() {
    navigate(`/workspaces/${workspaceId}/documents`, {
      state: {
        prefillType: "MATERIAL_TREINAMENTO",
        prefillTitle: "Material de Treinamento - Conscientização LGPD",
      },
    });
  }

  if (isLoading) return <LoadingSpinner label="Carregando treinamentos..." />;

  return (
    <div>

      <div className="flex items-center justify-between mb-2 flex-wrap gap-3">
        <div>
          <h1 className="text-xl text-[#0A0A0A]">Treinamento de Colaboradores</h1>
          <p className="text-sm text-[#0A0A0A]/55 mt-0.5">
            Registro de conscientização sobre proteção de dados, conforme boas práticas recomendadas pela ANPD.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            to={`/workspaces/${workspaceId}/pilares/treinamento/colaboradores`}
            className="flex items-center gap-1.5 bg-[#0A0A0A]/5 hover:bg-[#0A0A0A]/10 text-[#0A0A0A] text-sm font-medium rounded-lg px-4 py-2.5 transition-colors"
          >
            <Users className="w-4 h-4" />
            Colaboradores
          </Link>
          <button
            onClick={handleGenerateMaterial}
            className="flex items-center gap-1.5 bg-[#D92B21] hover:bg-[#B4201A] text-white text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Gerar Material com IA
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="bg-[#D92B21] hover:bg-[#B4201A] text-white text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors"
          >
            + Novo Treinamento
          </button>
        </div>
      </div>

      {error && <div className="my-4"><Alert type="error" message={error} /></div>}

      {trainings.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-10 text-center mt-6">
          <GraduationCap className="w-8 h-8 text-[#0A0A0A]/25 mx-auto mb-3" />
          <p className="text-[#0A0A0A]/55 text-sm">Nenhum treinamento registrado ainda.</p>
        </div>
      ) : (
        <div className="space-y-2 mt-6">
          {trainings.map((training) => (
            <div key={training.id} className="bg-white rounded-xl p-4 border border-[#0A0A0A]/10">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-medium text-[#0A0A0A]">{training.title}</p>
                    <span className="text-[10px] uppercase tracking-wide bg-[#D92B21]/10 text-[#0A0A0A] rounded px-1.5 py-0.5">
                      {TRAINING_METHOD_LABELS[training.method]}
                    </span>
                  </div>
                  {training.description && <p className="text-xs text-[#0A0A0A]/60 mb-2">{training.description}</p>}
                  <p className="text-xs text-[#0A0A0A]/50">
                    {new Date(training.trainingDate).toLocaleDateString("pt-BR")} · {training.attendees.length} participante{training.attendees.length !== 1 ? "s" : ""}: {" "}
                    {training.attendees.map((a) => a.name).join(", ")}
                  </p>
                </div>
                <button onClick={() => handleDelete(training.id)} className="text-[#0A0A0A]/40 hover:text-red-600 transition-colors shrink-0" title="Remover">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && workspaceId && (
        <TrainingModal workspaceId={workspaceId} onClose={() => setShowModal(false)} onSaved={handleSaved} />
      )}
    </div>
  );
}