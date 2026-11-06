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

import { getSystemLanguage, tr, trn } from '../i18n/tr'
const TYPE_LABELS: Record<DataSubjectRequestType, string> = {
  ACCESS: tr('Acesso'),
  CORRECTION: tr('Correção'),
  DELETION: tr('Eliminação'),
  PORTABILITY: tr('Portabilidade'),
  ANONYMIZATION: tr('Anonimização'),
  CONSENT_REVOCATION: tr('Revogação de Consentimento'),
};

const STATUS_LABELS: Record<DataSubjectRequestStatus, string> = {
  RECEIVED: tr('Recebida'),
  IN_PROGRESS: tr('Em Andamento'),
  COMPLETED: tr('Concluída'),
  REJECTED: tr('Rejeitada'),
};

const STATUS_STYLES: Record<DataSubjectRequestStatus, string> = {
  RECEIVED: "bg-[#0A0A0A]/8 text-[#0A0A0A]/70",
  IN_PROGRESS: "bg-[#D92B21]/12 text-[#B4201A]",
  COMPLETED: "bg-[#D92B21]/12 text-[#0A0A0A]",
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
          getErrorMessage(err, tr('Não foi possível carregar as solicitações.')),
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
      setError(getErrorMessage(err, tr('Não foi possível atualizar o status.')));
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
        getErrorMessage(err, tr('Não foi possível rejeitar a solicitação.')),
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

  if (isLoading) return <LoadingSpinner label={tr('Carregando solicitações...')} />;

  return (
    <div>
      <h1 className="text-xl text-[#0A0A0A] mb-1">{tr('Direitos do Titular')}</h1>
      <p className="text-sm text-[#0A0A0A]/55 mb-2">{tr('Solicitações recebidas via portal público, conforme Art. 18 da LGPD.')}</p>
      <div className="bg-white rounded-xl p-4 border border-[#0A0A0A]/10 mb-6 text-xs text-[#0A0A0A]/60 leading-relaxed">{tr('A LGPD garante a qualquer titular o direito de solicitar')}{" "}
        <span className="font-medium text-[#0A0A0A]">{tr('acesso')}</span>{' '}{tr('aos seus dados,')}{' '}<span className="font-medium text-[#0A0A0A]">{tr('correção')}</span>{' '}{tr('de dados incorretos,')}{" "}
        <span className="font-medium text-[#0A0A0A]">{tr('eliminação')}</span>{' '}{tr('quando aplicável,')}{" "}
        <span className="font-medium text-[#0A0A0A]">{tr('portabilidade')}</span>{' '}{tr('para outro fornecedor,')}{" "}
        <span className="font-medium text-[#0A0A0A]">{tr('anonimização')}</span>{tr(', e')}{" "}
        <span className="font-medium text-[#0A0A0A]">{tr('revogação de consentimento')}</span>{" "}{tr('a qualquer momento. Toda solicitação recebida aqui já gera automaticamente uma tarefa vinculada no Plano de Ação. Pelo Art. 19 da LGPD, a declaração completa de confirmação de existência ou de acesso aos dados deve ser fornecida em até 15 dias, e os demais direitos seguem os prazos previstos em regulamento, recomendando-se atender sem demora.')}</div>

      {error && (
        <div className="mb-4">
          <Alert type="error" message={error} />
        </div>
      )}

      {publicUrl && (
        <div className="bg-white rounded-xl p-4 border border-[#0A0A0A]/10 mb-6 flex items-center gap-4">
          {qrDataUrl && (
            <img
              src={qrDataUrl}
              alt={tr('QR Code do portal de solicitação')}
              className="w-20 h-20 rounded-lg bg-[#fbfaf6] p-1"
            />
          )}
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-xs font-medium text-[#0A0A0A]/70 mb-1">
              <QrCode className="w-3.5 h-3.5" />{tr('Link público do portal, compartilhe com clientes e funcionários')}</p>
            <button
              type="button"
              onClick={() =>
                window.open(publicUrl, "_blank", "noopener,noreferrer")
              }
              className="text-[#0A0A0A] hover:underline text-sm break-all text-left"
            >
              {publicUrl}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl p-4 border border-[#0A0A0A]/10 mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="w-3.5 h-3.5 text-[#0A0A0A]/35 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tr('Buscar por nome ou e-mail')}
            className="w-full rounded-lg bg-[#fbfaf6] text-[#0A0A0A] text-sm pl-8 pr-3 py-2 border border-[#0A0A0A]/10 focus:outline-none focus:ring-2 focus:ring-[#D92B21]/30 focus:border-[#0A0A0A] placeholder:text-[#0A0A0A]/40"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) =>
            setTypeFilter(e.target.value as DataSubjectRequestType | "ALL")
          }
          className="text-sm rounded-lg bg-[#fbfaf6] text-[#0A0A0A] px-3 py-2 border border-[#0A0A0A]/10 focus:outline-none focus:border-[#0A0A0A]"
        >
          <option value="ALL">{tr('Todos os tipos')}</option>
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
          className="text-sm rounded-lg bg-[#fbfaf6] text-[#0A0A0A] px-3 py-2 border border-[#0A0A0A]/10 focus:outline-none focus:border-[#0A0A0A]"
        >
          <option value="ALL">{tr('Todos os status')}</option>
          {Object.entries(STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value as SortOrder)}
          className="text-sm rounded-lg bg-[#fbfaf6] text-[#0A0A0A] px-3 py-2 border border-[#0A0A0A]/10 focus:outline-none focus:border-[#0A0A0A]"
        >
          <option value="recent">{tr('Mais recentes primeiro')}</option>
          <option value="oldest">{tr('Mais antigas primeiro')}</option>
        </select>
      </div>

      <p className="text-xs text-[#0A0A0A]/45 mb-3">
        {tr(requests.length === 1 ? '{{a}} de {{b}} solicitação' : '{{a}} de {{b}} solicitações', { a: filtered.length, b: requests.length })}
        {pendingCount > 0 &&
          trn(pendingCount, ', {{n}} pendente', ', {{n}} pendentes')}
      </p>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-10 text-center">
          <Inbox className="w-8 h-8 text-[#0A0A0A]/25 mx-auto mb-3" />
          <p className="text-[#0A0A0A]/55 text-sm">
            {requests.length === 0
              ? tr('Nenhuma solicitação recebida ainda.')
              : tr('Nenhuma solicitação corresponde aos filtros.')}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-xl p-4 border border-[#0A0A0A]/10"
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="font-medium text-[#0A0A0A] text-sm">
                      {r.requesterName}
                    </p>
                    <span className="text-xs px-2 py-0.5 rounded bg-[#D92B21]/12 text-[#B4201A] font-medium">
                      {TYPE_LABELS[r.requestType]}
                    </span>
                    <span className="text-[10px] text-[#0A0A0A]/40">
                      {new Date(r.createdAt).toLocaleDateString(getSystemLanguage())}
                    </span>
                  </div>
                  <p className="text-xs text-[#0A0A0A]/60">
                    {r.requesterEmail}
                  </p>
                  <p className="text-xs text-[#0A0A0A]/45 mt-2">
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
                  className={`text-xs rounded px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-[#0A0A0A] font-medium ${STATUS_STYLES[r.status]}`}
                >
                  {Object.entries(STATUS_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              {r.status === "REJECTED" && r.rejectionReason && (
                <p className="text-xs text-red-700 mt-2 pt-2 border-t border-[#0A0A0A]/8">{tr('Motivo da rejeição:')}{' '}{r.rejectionReason}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {rejectingId && (
        <div className="fixed inset-0 bg-[#0A0A0A]/40 flex items-center justify-center px-4 z-50">
          <div className="w-full max-w-sm bg-white rounded-xl p-6 shadow-2xl border border-red-200">
            <h3 className="text-[#0A0A0A] font-semibold mb-2">{tr('Motivo da rejeição')}</h3>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              placeholder={tr('Explique por que esta solicitação está sendo rejeitada')}
              className="w-full rounded-lg bg-[#fbfaf6] text-[#0A0A0A] px-3 py-2 border border-[#0A0A0A]/10 focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 mb-4 placeholder:text-[#0A0A0A]/40"
            />
            <div className="flex gap-2">
              <button
                onClick={confirmRejection}
                disabled={!rejectionReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg py-2 transition-colors"
              >{tr('Confirmar rejeição')}</button>
              <button
                onClick={() => {
                  setRejectingId(null);
                  setRejectionReason("");
                }}
                className="flex-1 bg-[#0A0A0A]/5 hover:bg-[#0A0A0A]/10 text-[#0A0A0A] text-sm font-medium rounded-lg py-2 transition-colors"
              >{tr('Cancelar')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
