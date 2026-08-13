import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  fetchDataSubjectRequests,
  updateDataSubjectRequestStatus,
} from "../api/dataSubjectRequestService";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Alert } from "../components/Alert";
import { getErrorMessage } from "../api/errorUtils";
import type { DataSubjectRequest, DataSubjectRequestStatus, DataSubjectRequestType } from "../types/dataSubjectRequest";

const TYPE_LABELS: Record<DataSubjectRequestType, string> = {
  ACCESS: "Acesso",
  CORRECTION: "Correção",
  DELETION: "Eliminação",
  PORTABILITY: "Portabilidade",
  ANONYMIZATION: "Anonimização",
};

const STATUS_LABELS: Record<DataSubjectRequestStatus, string> = {
  RECEIVED: "Recebida",
  IN_PROGRESS: "Em Andamento",
  COMPLETED: "Concluída",
  REJECTED: "Rejeitada",
};

const STATUS_STYLES: Record<DataSubjectRequestStatus, string> = {
  RECEIVED: "bg-slate-700 text-slate-300",
  IN_PROGRESS: "bg-yellow-900 text-yellow-300",
  COMPLETED: "bg-green-900 text-green-300",
  REJECTED: "bg-red-900 text-red-300",
};

export function DataSubjectRequestsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  const [requests, setRequests] = useState<DataSubjectRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    if (!workspaceId) return;
    load(workspaceId);
  }, [workspaceId]);

  function load(id: string) {
    setIsLoading(true);
    fetchDataSubjectRequests(id)
      .then(setRequests)
      .catch((err) => setError(getErrorMessage(err, "Não foi possível carregar as solicitações.")))
      .finally(() => setIsLoading(false));
  }

  async function handleStatusChange(id: string, status: DataSubjectRequestStatus) {
    if (status === "REJECTED") {
      setRejectingId(id);
      return;
    }
    try {
      const updated = await updateDataSubjectRequestStatus(id, { status });
      setRequests((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível atualizar o status."));
    }
  }

  async function confirmRejection() {
    if (!rejectingId || !rejectionReason.trim()) return;
    try {
      const updated = await updateDataSubjectRequestStatus(rejectingId, {
        status: "REJECTED",
        rejectionReason,
      });
      setRequests((prev) => prev.map((r) => (r.id === rejectingId ? updated : r)));
      setRejectingId(null);
      setRejectionReason("");
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível rejeitar a solicitação."));
    }
  }

  if (isLoading) return <LoadingSpinner label="Carregando solicitações..." />;

  return (
    <div>
      <Link
        to={`/workspaces/${workspaceId}/documents`}
        className="text-cyan-400 hover:underline text-sm mb-4 inline-block"
      >
        ← Voltar aos Documentos
      </Link>

      <h2 className="text-xl font-semibold text-white mb-1">Solicitações de Titulares</h2>
      <p className="text-sm text-slate-400 mb-6">
        Solicitações recebidas via portal público, conforme Art. 18 da LGPD.
      </p>

      {error && (
        <div className="mb-4">
          <Alert type="error" message={error} />
        </div>
      )}

      {requests.length === 0 ? (
        <p className="text-slate-400 text-sm">Nenhuma solicitação recebida ainda.</p>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-white text-sm">{r.requesterName}</p>
                    <span className="text-xs px-2 py-0.5 rounded bg-purple-900 text-purple-300">
                      {TYPE_LABELS[r.requestType]}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{r.requesterEmail}</p>
                  <p className="text-xs text-slate-500 mt-2">{r.description}</p>
                </div>
                <select
                  value={r.status}
                  onChange={(e) => handleStatusChange(r.id, e.target.value as DataSubjectRequestStatus)}
                  className={`text-xs rounded px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-cyan-500 ${STATUS_STYLES[r.status]}`}
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              {r.status === "REJECTED" && r.rejectionReason && (
                <p className="text-xs text-red-400 mt-2 pt-2 border-t border-slate-700">
                  Motivo da rejeição: {r.rejectionReason}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {rejectingId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 z-50">
          <div className="w-full max-w-sm bg-slate-800 rounded-xl p-6 shadow-xl border border-red-900/50">
            <h3 className="text-white font-semibold mb-2">Motivo da rejeição</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              placeholder="Explique por que esta solicitação está sendo rejeitada"
              className="w-full rounded-lg bg-slate-900 text-white px-3 py-2 border border-slate-700 focus:outline-none focus:border-red-500 mb-4"
            />
            <div className="flex gap-2">
              <button
                onClick={confirmRejection}
                disabled={!rejectionReason.trim()}
                className="flex-1 bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2 transition-colors"
              >
                Confirmar rejeição
              </button>
              <button
                onClick={() => {
                  setRejectingId(null);
                  setRejectionReason("");
                }}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg py-2 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}