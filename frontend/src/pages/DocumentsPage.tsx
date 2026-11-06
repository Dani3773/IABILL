import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { useParams, Link, useLocation, useSearchParams } from "react-router-dom";
import { AlertTriangle, Clock, FileText, Search, Sparkles, X } from "lucide-react";
import { CreateDocumentModal } from "../components/CreateDocumentModal";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Alert } from "../components/Alert";
import { getErrorMessage } from "../api/errorUtils";
import { useWorkspaces } from "../contexts/WorkspaceContext";
import type { Document, DocumentStatus, DocumentType } from "../types/document";
import {
  fetchDocumentsByWorkspace,
  dismissReviewFlag,
} from "../api/documentService";
import {
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUS_STYLES,
  DOCUMENT_TYPE_LABELS,
  DOCUMENT_TYPE_SHORT_LABELS,
} from "../utils/documentLabels";

import { getSystemLanguage, tr, trn } from '../i18n/tr'
const FILTER_CLASS =
  "rounded-lg bg-white text-sm text-[#0A0A0A] px-3 py-2.5 border border-[#0A0A0A]/20 hover:border-[#0A0A0A]/40 focus:outline-none focus:border-[#D92B21] transition-colors";

function isOverdue(doc: Document) {
  return Boolean(doc.reviewDueAt && new Date(doc.reviewDueAt) < new Date());
}

function needsAttention(doc: Document) {
  return doc.reviewRecommended || isOverdue(doc);
}

export function DocumentsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const location = useLocation();
  const { openAssistant } = useWorkspaces();
  const [searchParams, setSearchParams] = useSearchParams();
  const [titleQuery, setTitleQuery] = useState("");
  const typeFilter = (searchParams.get("tipo") ?? "") as DocumentType | "";
  const statusFilter = (searchParams.get("status") ?? "") as DocumentStatus | "";
  const attentionOnly = searchParams.get("atencao") === "1";
  const prefill = location.state as { prefillType?: string; prefillTitle?: string } | null;

  useEffect(() => {
    if (!workspaceId) return;
    fetchDocumentsByWorkspace(workspaceId)
      .then(setDocuments)
      .catch((err) =>
        setError(getErrorMessage(err, tr('Não foi possível carregar os documentos.'))),
      )
      .finally(() => setIsLoading(false));
  }, [workspaceId]);

  useEffect(() => {
    if (prefill?.prefillType) {
      setShowCreateModal(true);
      // Limpa o state da navegacao para nao reabrir o modal se a pessoa
      // atualizar a pagina ou voltar/avancar no historico do navegador.
      window.history.replaceState({}, "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleCreated(newDocument: Document) {
    setDocuments((prev) => [...prev, newDocument]);
  }

  async function handleDismissReviewFlag(e: MouseEvent, documentId: string) {
    e.preventDefault(); // evita navegar para o documento ao clicar no botao
    e.stopPropagation();
    try {
      const updated = await dismissReviewFlag(documentId);
      setDocuments((prev) => prev.map((d) => (d.id === documentId ? updated : d)));
    } catch (err) {
      setError(getErrorMessage(err, tr('Não foi possível dispensar o aviso.')));
    }
  }

  function setFilter(key: string, value: string) {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true, state: null },
    );
  }

  function clearFilters() {
    setTitleQuery("");
    setSearchParams({}, { replace: true, state: null });
  }

  const attentionCount = documents.filter(needsAttention).length;
  const hasFilters = Boolean(titleQuery || typeFilter || statusFilter || attentionOnly);

  // Quem pede revisao vem primeiro; dentro de cada grupo, os mais recentes.
  const visibleDocuments = useMemo(() => {
    const term = titleQuery.trim().toLocaleLowerCase("pt-BR");
    return documents
      .filter(
        (doc) =>
          (!term || doc.title.toLocaleLowerCase("pt-BR").includes(term)) &&
          (!typeFilter || doc.type === typeFilter) &&
          (!statusFilter || doc.status === statusFilter) &&
          (!attentionOnly || needsAttention(doc)),
      )
      .sort(
        (a, b) =>
          Number(needsAttention(b)) - Number(needsAttention(a)) ||
          b.createdAt.localeCompare(a.createdAt),
      );
  }, [documents, titleQuery, typeFilter, statusFilter, attentionOnly]);

  if (isLoading) return <LoadingSpinner label={tr('Carregando documentos...')} />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl text-[#0A0A0A]">{tr('Documentos')}</h1>
          <p className="text-sm text-[#0A0A0A]/50 mt-0.5">
            {trn(documents.length, '{{n}} documento', '{{n}} documentos')}
            {attentionCount > 0 && trn(attentionCount, ' · {{n}} precisa de revisão', ' · {{n}} precisam de revisão')}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#D92B21] hover:bg-[#B4201A] text-white text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors"
        >{tr('+ Novo Documento')}</button>
      </div>

      {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

      {documents.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-10 text-center">
          <FileText className="w-8 h-8 text-[#0A0A0A]/25 mx-auto mb-3" />
          <p className="text-[#0A0A0A]/60 text-sm">{tr('Nenhum documento cadastrado ainda nesta unidade.')}</p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 text-[#0A0A0A]/45 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={titleQuery}
                onChange={(e) => setTitleQuery(e.target.value)}
                aria-label={tr('Buscar documento pelo título')}
                placeholder={tr('Buscar pelo título')}
                className={`${FILTER_CLASS} w-full pl-9`}
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setFilter("tipo", e.target.value)}
              aria-label={tr('Filtrar por tipo')}
              className={FILTER_CLASS}
            >
              <option value="">{tr('Todos os tipos')}</option>
              {(Object.keys(DOCUMENT_TYPE_LABELS) as DocumentType[]).map((type) => (
                <option key={type} value={type}>
                  {DOCUMENT_TYPE_SHORT_LABELS[type]}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setFilter("status", e.target.value)}
              aria-label={tr('Filtrar por status')}
              className={FILTER_CLASS}
            >
              <option value="">{tr('Todos os status')}</option>
              {(Object.keys(DOCUMENT_STATUS_LABELS) as DocumentStatus[]).map((status) => (
                <option key={status} value={status}>
                  {DOCUMENT_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setFilter("atencao", attentionOnly ? "" : "1")}
              aria-pressed={attentionOnly}
              className={`${FILTER_CLASS} flex items-center gap-1.5 ${
                attentionOnly ? "border-[#D92B21] text-[#B4201A] bg-[#D92B21]/8" : ""
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />{tr('Precisam de revisão')}</button>
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1 text-sm text-[#0A0A0A]/65 hover:text-[#0A0A0A] px-1 py-2"
              >
                <X className="w-3.5 h-3.5" />{' '}{tr('Limpar')}</button>
            )}
          </div>

          <button
            type="button"
            onClick={() => openAssistant("search")}
            className="flex items-center gap-1.5 text-[13px] text-[#B4201A] hover:underline mb-3"
          >
            <Sparkles className="w-3.5 h-3.5" />{tr('Procurar por assunto dentro dos documentos')}</button>

          {visibleDocuments.length === 0 ? (
            <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-10 text-center">
              <p className="text-[#0A0A0A]/60 text-sm">{tr('Nenhum documento com esses filtros.')}</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#0A0A0A]/10 overflow-hidden">
              <div className="hidden md:grid grid-cols-[minmax(0,1fr)_190px_120px_100px] gap-4 px-4 py-2.5 border-b border-[#0A0A0A]/10 text-xs font-medium text-[#0A0A0A]/60">
                <span>{tr('Documento')}</span>
                <span>{tr('Tipo')}</span>
                <span>{tr('Status')}</span>
                <span>{tr('Criado em')}</span>
              </div>
              {visibleDocuments.map((doc) => (
                <div key={doc.id} className="relative border-b border-[#0A0A0A]/8 last:border-0 hover:bg-[#0A0A0A]/3 transition-colors">
                  <Link
                    to={`/documents/${doc.id}`}
                    className="grid grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[minmax(0,1fr)_190px_120px_100px] gap-x-4 gap-y-1 items-center px-4 py-3"
                  >
                    <span className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-[#0A0A0A]/40 shrink-0" />
                      <span className="text-sm font-medium text-[#0A0A0A] truncate">{doc.title}</span>
                    </span>
                    <span
                      title={DOCUMENT_TYPE_LABELS[doc.type]}
                      className="order-3 md:order-none text-[13px] text-[#0A0A0A]/65 truncate"
                    >
                      {DOCUMENT_TYPE_SHORT_LABELS[doc.type]}
                    </span>
                    <span>
                      <span className={`text-xs px-2 py-1 rounded whitespace-nowrap ${DOCUMENT_STATUS_STYLES[doc.status]}`}>
                        {DOCUMENT_STATUS_LABELS[doc.status]}
                      </span>
                    </span>
                    <span className="order-4 md:order-none text-[13px] text-[#0A0A0A]/65 text-right md:text-left">
                      {new Date(doc.createdAt).toLocaleDateString(getSystemLanguage())}
                    </span>
                  </Link>

                  {doc.reviewRecommended && (
                    <div className="flex items-center justify-between gap-3 px-4 pb-3 md:pl-10.5">
                      <p className="flex items-center gap-1.5 text-[13px] text-amber-800 min-w-0">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{tr('Revisão recomendada')}{doc.reviewRecommendedReason && ` — ${doc.reviewRecommendedReason}`}
                        </span>
                      </p>
                      <button
                        onClick={(e) => handleDismissReviewFlag(e, doc.id)}
                        className="text-[13px] text-[#0A0A0A]/65 hover:text-[#0A0A0A] shrink-0 font-medium"
                      >{tr('Dispensar')}</button>
                    </div>
                  )}

                  {isOverdue(doc) && (
                    <p className="flex items-center gap-1.5 text-[13px] text-blue-700 px-4 pb-3 md:pl-10.5">
                      <Clock className="w-3.5 h-3.5 shrink-0" />{tr('Revisão periódica vencida desde')}{" "}
                      {new Date(doc.reviewDueAt!).toLocaleDateString(getSystemLanguage())}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showCreateModal && workspaceId && (
        <CreateDocumentModal
          workspaceId={workspaceId}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
          initialType={prefill?.prefillType as never}
          initialTitle={prefill?.prefillTitle}
        />
      )}
    </div>
  );
}