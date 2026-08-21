import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Inbox } from "lucide-react";
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
  CONSENT_REVOCATION: "Revogação de Consentimento",
};

const STATUS_LABELS: Record<DataSubjectRequestStatus, string> = {
  RECEIVED: "Recebida",
  IN_PROGRESS: "Em Andamento",
  COMPLETED: "Concluída",
  REJECTED: "Rejeitada",
};

const STATUS_STYLES: Record<DataSubjectRequestStatus, string> = {
  RECEIVED: "bg-[#1B2233]/8 text-[#1B2233]/70",
  IN_PROGRESS: "bg-[#B8862B]/12 text-[#B8862B]",
  COMPLETED: "bg-[#14B8A6]/12 text-[#0d7a6d]",
  REJECTED: "bg-red-50 text-red-700",
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

      <h1 className="text-xl font-serif text-[#1B2233] mb-1">Solicitações de Titulares</h1>
      <p className="text-sm text-[#1B2233]/55 mb-6">
        Solicitações recebidas via portal público, conforme Art. 18 da LGPD.
      </p>

      {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

      {requests.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#1B2233]/10 p-10 text-center">
          <Inbox className="w-8 h-8 text-[#1B2233]/25 mx-auto mb-3" />
          <p className="text-[#1B2233]/55 text-sm">Nenhuma solicitação recebida ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <div key={r.id} className="bg-white rounded-xl p-4 border border-[#1B2233]/10">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-[#1B2233] text-sm">{r.requesterName}</p>
                    <span className="text-xs px-2 py-0.5 rounded bg-[#B8862B]/12 text-[#B8862B] font-medium">
                      {TYPE_LABELS[r.requestType]}
                    </span>
                  </div>
                  <p className="text-xs text-[#1B2233]/60">{r.requesterEmail}</p>
                  <p className="text-xs text-[#1B2233]/45 mt-2">{r.description}</p>
                </div>
                <select
                  value={r.status}
                  onChange={(e) => handleStatusChange(r.id, e.target.value as DataSubjectRequestStatus)}
                  className={`text-xs rounded px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-[#14B8A6] font-medium ${STATUS_STYLES[r.status]}`}
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              {r.status === "REJECTED" && r.rejectionReason && (
                <p className="text-xs text-red-700 mt-2 pt-2 border-t border-[#1B2233]/8">
                  Motivo da rejeição: {r.rejectionReason}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {rejectingId && (
        <div className="fixed inset-0 bg-[#1B2233]/40 backdrop-blur-sm flex items-center justify-center px-4 z-50">
          <div className="w-full max-w-sm bg-white rounded-xl p-6 shadow-2xl border border-red-200">
            <h3 className="text-[#1B2233] font-semibold mb-2">Motivo da rejeição</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              placeholder="Explique por que esta solicitação está sendo rejeitada"
              className="w-full rounded-lg bg-[#F5F2EA] text-[#1B2233] px-3 py-2 border border-[#1B2233]/10 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 mb-4 placeholder:text-[#1B2233]/40"
            />
            <div className="flex gap-2">
              <button
                onClick={confirmRejection}
                disabled={!rejectionReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg py-2 transition-colors"
              >
                Confirmar rejeição
              </button>
              <button
                onClick={() => {
                  setRejectingId(null);
                  setRejectionReason("");
                }}
                className="flex-1 bg-[#1B2233]/5 hover:bg-[#1B2233]/10 text-[#1B2233] text-sm font-medium rounded-lg py-2 transition-colors"
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