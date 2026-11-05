import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardList,
  AlertTriangle,
  Trash2,
  Pencil,
  ShieldCheck,
  Clock,
} from "lucide-react";
import {
  fetchProcessingActivities,
  deleteProcessingActivity,
} from "../api/processingActivityService";
import { ProcessingActivityModal } from "../components/ProcessingActivityModal";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Alert } from "../components/Alert";
import { getErrorMessage } from "../api/errorUtils";
import {
  LEGAL_BASIS_LABELS,
  LEGAL_REGIME_LABELS,
  type ProcessingActivity,
} from "../types/processingActivity";
import { useNavigate } from "react-router-dom";
import { dismissRipdSuggestion } from "../api/processingActivityService";
import { ConsentRecordsModal } from "../components/ConsentRecordsModal";

export function ProcessingActivitiesPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [activities, setActivities] = useState<ProcessingActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ProcessingActivity | null>(null);
  const navigate = useNavigate();
  const [consentActivity, setConsentActivity] =
    useState<ProcessingActivity | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    load(workspaceId);
  }, [workspaceId]);

  function load(id: string) {
    setIsLoading(true);
    fetchProcessingActivities(id)
      .then(setActivities)
      .catch((err) =>
        setError(
          getErrorMessage(
            err,
            "Não foi possível carregar o registro de tratamento.",
          ),
        ),
      )
      .finally(() => setIsLoading(false));
  }

  function handleSaved(activity: ProcessingActivity) {
    setActivities((prev) => {
      const exists = prev.some((a) => a.id === activity.id);
      return exists
        ? prev.map((a) => (a.id === activity.id ? activity : a))
        : [...prev, activity];
    });
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Remover esta atividade de tratamento do registro?"))
      return;
    try {
      await deleteProcessingActivity(id);
      setActivities((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível remover a atividade."));
    }
  }

  async function handleDismissRipdSuggestion(id: string) {
    try {
      const updated = await dismissRipdSuggestion(id);
      setActivities((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível dispensar a sugestão."));
    }
  }

  function handleCreateRipd(activity: ProcessingActivity) {
    navigate(`/workspaces/${workspaceId}/documents`, {
      state: {
        prefillType: "RIPD_DPIA",
        prefillTitle: `RIPD/DPIA - ${activity.processName}`,
      },
    });
  }

  if (isLoading)
    return <LoadingSpinner label="Carregando registro de tratamento..." />;

  return (
    <div>
      <Link
        to={`/workspaces/${workspaceId}/pilares`}
        className="flex items-center gap-1.5 text-[#0A0A0A] hover:text-[#B4201A] text-sm mb-4 font-medium transition-colors w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Voltar aos Pilares
      </Link>

      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl text-[#0A0A0A]">
            Registro de Operações de Tratamento
          </h1>
          <p className="text-sm text-[#0A0A0A]/55 mt-0.5">
            Inventário estruturado das atividades de tratamento de dados
            pessoais, no formato recomendado pela ANPD.
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowModal(true);
          }}
          className="bg-[#0A0A0A] hover:bg-[#2A2A2A] text-white text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors shrink-0"
        >
          + Nova Atividade
        </button>
      </div>

      {error && (
        <div className="my-4">
          <Alert type="error" message={error} />
        </div>
      )}

      {activities.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-10 text-center mt-6">
          <ClipboardList className="w-8 h-8 text-[#0A0A0A]/25 mx-auto mb-3" />
          <p className="text-[#0A0A0A]/55 text-sm">
            Nenhuma atividade de tratamento registrada ainda.
          </p>
        </div>
      ) : (
        <div className="space-y-2 mt-6">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="bg-white rounded-xl p-4 border border-[#0A0A0A]/10"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-medium text-[#0A0A0A]">
                      {activity.processName}
                    </p>
                    {activity.sectorName && (
                      <span className="text-[10px] uppercase tracking-wide bg-[#0A0A0A]/8 text-[#0A0A0A]/60 rounded px-1.5 py-0.5">
                        {activity.sectorName}
                      </span>
                    )}
                    <span className="text-[10px] uppercase tracking-wide bg-[#D92B21]/12 text-[#B4201A] rounded px-1.5 py-0.5">
                      {LEGAL_REGIME_LABELS[activity.applicableRegime]}
                    </span>
                    <span className="text-[10px] uppercase tracking-wide bg-[#D92B21]/10 text-[#0A0A0A] rounded px-1.5 py-0.5">
                      {LEGAL_BASIS_LABELS[activity.legalBasis]}
                    </span>
                    {activity.involvesSensitiveData && (
                      <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide bg-amber-100 text-amber-700 rounded px-1.5 py-0.5">
                        <AlertTriangle className="w-3 h-3" />
                        Dado sensível
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#0A0A0A]/60 mb-2">
                    {activity.purpose}
                  </p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-[#0A0A0A]/50">
                    <p>
                      <span className="text-[#0A0A0A]/70">Titulares:</span>{" "}
                      {activity.dataSubjectCategories}
                    </p>
                    <p>
                      <span className="text-[#0A0A0A]/70">Dados:</span>{" "}
                      {activity.personalDataCategories}
                    </p>
                    {activity.retentionPeriod && (
                      <p>
                        <span className="text-[#0A0A0A]/70">Retenção:</span>{" "}
                        {activity.retentionPeriod}
                      </p>
                    )}
                  </div>
                  {activity.retentionExpiresAt &&
                    new Date(activity.retentionExpiresAt) < new Date() && (
                      <p className="flex items-center gap-1.5 text-xs text-blue-700 mt-2">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        Prazo de retenção vencido desde{" "}
                        {new Date(activity.retentionExpiresAt).toLocaleDateString("pt-BR")}
                      </p>
                    )}

                  {activity.involvesSensitiveData &&
                    !activity.ripdSuggestionDismissed && (
                      <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-amber-200">
                        <p className="text-xs text-amber-700">
                          Esta atividade envolve dado sensível — considere criar
                          um RIPD/DPIA para ela.
                        </p>
                        <div className="flex gap-3 shrink-0">
                          <button
                            onClick={() => handleCreateRipd(activity)}
                            className="text-xs font-medium text-[#0A0A0A] hover:underline"
                          >
                            Criar RIPD/DPIA
                          </button>
                          <button
                            onClick={() =>
                              handleDismissRipdSuggestion(activity.id)
                            }
                            className="text-xs text-[#0A0A0A]/45 hover:text-[#0A0A0A]/70"
                          >
                            Dispensar
                          </button>
                        </div>
                      </div>
                    )}
                </div>
                <div className="flex gap-2 shrink-0">
                  {activity.legalBasis === "CONSENTIMENTO" && (
                    <button
                      onClick={() => setConsentActivity(activity)}
                      className="text-[#0A0A0A]/40 hover:text-[#B4201A] transition-colors"
                      title="Prova de consentimento"
                    >
                      <ShieldCheck className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setEditing(activity);
                      setShowModal(true);
                    }}
                    className="text-[#0A0A0A]/40 hover:text-[#B4201A] transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(activity.id)}
                    className="text-[#0A0A0A]/40 hover:text-red-600 transition-colors"
                    title="Remover"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && workspaceId && (
        <ProcessingActivityModal
          workspaceId={workspaceId}
          editing={editing}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}

      {consentActivity && (
        <ConsentRecordsModal
          activityId={consentActivity.id}
          activityName={consentActivity.processName}
          onClose={() => setConsentActivity(null)}
        />
      )}
    </div>
  );
}
