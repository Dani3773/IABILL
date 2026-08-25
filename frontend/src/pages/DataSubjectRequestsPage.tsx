import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Inbox, Search, QrCode } from "lucide-react";
import {
  fetchDataSubjectRequests,
  updateDataSubjectRequestStatus,
} from "../api/dataSubjectRequestService";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Alert } from "../components/Alert";
import { getErrorMessage } from "../api/errorUtils";
import type {
  DataSubjectRequest,
  DataSubjectRequestStatus,
  DataSubjectRequestType,
} from "../types/dataSubjectRequest";
import QRCode from "qrcode";
import { fetchWorkspaces } from "../api/workspaceService";

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

type SortOrder = "recent" | "oldest";

export function DataSubjectRequestsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [requests, setRequests] = useState<DataSubjectRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const [typeFilter, setTypeFilter] = useState<DataSubjectRequestType | "ALL">(
    "ALL",
  );
  const [statusFilter, setStatusFilter] = useState<
    DataSubjectRequestStatus | "ALL"
  >("ALL");
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("recent");

  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    load(workspaceId);
  }, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;
    fetchWorkspaces()
      .then((workspaces) => {
        const ws = workspaces.find((w) => w.id === workspaceId);
        if (!ws) return;
        const digitsOnly = ws.documentId.replace(/\D/g, "");
        const url = `https://iabill.com/solicitacao/${digitsOnly}`;
        setPublicUrl(url);
        return QRCode.toDataURL(url);
      })
      .then((dataUrl) => {
        if (dataUrl) setQrDataUrl(dataUrl);
      })
      .catch(() => {
        setPublicUrl(null);
        setQrDataUrl(null);
      });
  }, [workspaceId]);

  function load(id: string) {
    setIsLoading(true);
    fetchDataSubjectRequests(id)
      .then(setRequests)
      .catch((err) =>
        setError(
          getErrorMessage(err, "Não foi possível carregar as solicitações."),
        ),
      )
      .finally(() => setIsLoading(false));
  }

  async function handleStatusChange(
    id: string,
    status: DataSubjectRequestStatus,
  ) {
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
      setRequests((prev) =>
        prev.map((r) => (r.id === rejectingId ? updated : r)),
      );
      setRejectingId(null);
      setRejectionReason("");
    } catch (err) {
      setError(
        getErrorMessage(err, "Não foi possível rejeitar a solicitação."),
      );
    }
  }

  const filtered = requests
    .filter((r) => typeFilter === "ALL" || r.requestType === typeFilter)
    .filter((r) => statusFilter === "ALL" || r.status === statusFilter)
    .filter((r) => {
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        r.requesterName.toLowerCase().includes(q) ||
        r.requesterEmail.toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const diff =
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return sortOrder === "recent" ? diff : -diff;
    });

  const pendingCount = requests.filter(
    (r) => r.status === "RECEIVED" || r.status === "IN_PROGRESS",
  ).length;

  if (isLoading) return <LoadingSpinner label="Carregando solicitações..." />;

  return (
    <div>
      <h1 className="text-xl font-serif text-[#1B2233] mb-1">
        Direitos do Titular
      </h1>
      <p className="text-sm text-[#1B2233]/55 mb-2">
        Solicitações recebidas via portal público, conforme Art. 18 da LGPD.
      </p>
      <div className="bg-white rounded-xl p-4 border border-[#1B2233]/10 mb-6 text-xs text-[#1B2233]/60 leading-relaxed">
        A LGPD garante a qualquer titular o direito de solicitar{" "}
        <span className="font-medium text-[#1B2233]">acesso</span> aos seus
        dados, <span className="font-medium text-[#1B2233]">correção</span> de
        dados incorretos,{" "}
        <span className="font-medium text-[#1B2233]">eliminação</span> quando
        aplicável,{" "}
        <span className="font-medium text-[#1B2233]">portabilidade</span> para
        outro fornecedor,{" "}
        <span className="font-medium text-[#1B2233]">anonimização</span>, e{" "}
        <span className="font-medium text-[#1B2233]">
          revogação de consentimento
        </span>{" "}
        a qualquer momento. Toda solicitação recebida aqui já gera
        automaticamente uma tarefa vinculada no Plano de Ação, e não existe
        prazo legal fixo único para resposta, recomenda-se atender dentro de um
        prazo razoável, geralmente interpretado como até 15 dias.
      </div>

      {error && (
        <div className="mb-4">
          <Alert type="error" message={error} />
        </div>
      )}

      {publicUrl && (
        <div className="bg-white rounded-xl p-4 border border-[#1B2233]/10 mb-6 flex items-center gap-4">
          {qrDataUrl && (
            <img
              src={qrDataUrl}
              alt="QR Code do portal de solicitação"
              className="w-20 h-20 rounded-lg bg-[#F5F2EA] p-1"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-xs font-medium text-[#1B2233]/70 mb-1">
              <QrCode className="w-3.5 h-3.5" />
              Link público do portal, compartilhe com clientes e funcionários
            </p>
            <button
              type="button"
              onClick={() =>
                window.open(publicUrl, "_blank", "noopener,noreferrer")
              }
              className="text-[#0d7a6d] hover:underline text-sm break-all text-left"
            >
              {publicUrl}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-4 border border-[#1B2233]/10 mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="w-3.5 h-3.5 text-[#1B2233]/35 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou e-mail"
            className="w-full rounded-lg bg-[#F5F2EA] text-[#1B2233] text-sm pl-8 pr-3 py-2 border border-[#1B2233]/10 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6] placeholder:text-[#1B2233]/40"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) =>
            setTypeFilter(e.target.value as DataSubjectRequestType | "ALL")
          }
          className="text-sm rounded-lg bg-[#F5F2EA] text-[#1B2233] px-3 py-2 border border-[#1B2233]/10 focus:outline-none focus:border-[#14B8A6]"
        >
          <option value="ALL">Todos os tipos</option>
          {Object.entries(TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) =>
            setStatusFilter(e.target.value as DataSubjectRequestStatus | "ALL")
          }
          className="text-sm rounded-lg bg-[#F5F2EA] text-[#1B2233] px-3 py-2 border border-[#1B2233]/10 focus:outline-none focus:border-[#14B8A6]"
        >
          <option value="ALL">Todos os status</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as SortOrder)}
          className="text-sm rounded-lg bg-[#F5F2EA] text-[#1B2233] px-3 py-2 border border-[#1B2233]/10 focus:outline-none focus:border-[#14B8A6]"
        >
          <option value="recent">Mais recentes primeiro</option>
          <option value="oldest">Mais antigas primeiro</option>
        </select>
      </div>

      <p className="text-xs text-[#1B2233]/45 mb-3">
        {filtered.length} de {requests.length} solicitaç
        {requests.length !== 1 ? "ões" : "ão"}
        {pendingCount > 0 &&
          `, ${pendingCount} pendente${pendingCount !== 1 ? "s" : ""}`}
      </p>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#1B2233]/10 p-10 text-center">
          <Inbox className="w-8 h-8 text-[#1B2233]/25 mx-auto mb-3" />
          <p className="text-[#1B2233]/55 text-sm">
            {requests.length === 0
              ? "Nenhuma solicitação recebida ainda."
              : "Nenhuma solicitação corresponde aos filtros."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-xl p-4 border border-[#1B2233]/10"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-medium text-[#1B2233] text-sm">
                      {r.requesterName}
                    </p>
                    <span className="text-xs px-2 py-0.5 rounded bg-[#B8862B]/12 text-[#B8862B] font-medium">
                      {TYPE_LABELS[r.requestType]}
                    </span>
                    <span className="text-[10px] text-[#1B2233]/40">
                      {new Date(r.createdAt).toLocaleDateString("pt-BR")}
                    </span>
                  </div>
                  <p className="text-xs text-[#1B2233]/60">
                    {r.requesterEmail}
                  </p>
                  <p className="text-xs text-[#1B2233]/45 mt-2">
                    {r.description}
                  </p>
                </div>
                <select
                  value={r.status}
                  onChange={(e) =>
                    handleStatusChange(
                      r.id,
                      e.target.value as DataSubjectRequestStatus,
                    )
                  }
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
            <h3 className="text-[#1B2233] font-semibold mb-2">
              Motivo da rejeição
            </h3>
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
