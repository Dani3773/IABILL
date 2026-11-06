import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  fetchDocumentById,
  generateDocumentContent,
  updateDocumentContent,
  reviewDocument,
  rejectDocument,
  approveDocument,
  publishDocument,
  unpublishDocument,
  fetchDocumentsByWorkspace,
  downloadDocumentPdf,
} from "../api/documentService";
import { getErrorMessage } from "../api/errorUtils";
import { useAuth } from "../contexts/AuthContext";
import { useWorkspaces } from "../contexts/WorkspaceContext";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Alert } from "../components/Alert";
import type { Document, DocumentType } from "../types/document";
import QRCode from "qrcode";
import { fetchWorkspaces } from "../api/workspaceService";
import { ArrowLeft, Download } from "lucide-react";
import { renderMarkdown } from "../utils/markdown";
import { DOCUMENT_STATUS_LABELS, DOCUMENT_STATUS_STYLES } from "../utils/documentLabels";

import { getSystemLanguage, tr } from '../i18n/tr'
export function DocumentDetailPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const { role } = useAuth();
  const { selectWorkspace } = useWorkspaces();
  const [document, setDocument] = useState<Document | null>(null);
  const [editedContent, setEditedContent] = useState("");
  const [instruction, setInstruction] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [publicUrl, setPublicUrl] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
    INVENTARIO_DADOS: tr('Inventário de Dados'),
    POLITICA_PRIVACIDADE: tr('Política de Privacidade'),
    RELATORIO_CONFORMIDADE: tr('Relatório de Conformidade'),
    RAT: tr('RAT (Registro de Atividades de Tratamento)'),
    RIPD_DPIA: tr('RIPD/DPIA (Relatório de Impacto à Proteção de Dados)'),
    POLITICA_SEGURANCA_INFORMACAO: tr('Política de Segurança da Informação (PSI)'),
    MATERIAL_TREINAMENTO: tr('Material de Treinamento/Conscientização'),
  };

  useEffect(() => {
    if (!documentId) return;
    loadDocument(documentId);
  }, [documentId]);

  useEffect(() => {
    if (document) selectWorkspace(document.workspaceId);
  }, [document, selectWorkspace]);

  useEffect(() => {
    if (!document || !document.isPublished) {
      setPublicUrl(null);
      setQrDataUrl(null);
      return;
    }
    fetchWorkspaces()
      .then((workspaces) => {
        const ws = workspaces.find((w) => w.id === document.workspaceId);
        if (!ws) return;
        const digitsOnly = ws.documentId.replace(/\D/g, "");
        const url = `https://iabill.com/politica-privacidade/${digitsOnly}`;
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
  }, [document]);

  function loadDocument(id: string) {
    setIsLoading(true);
    fetchDocumentById(id)
      .then((doc) => {
        setDocument(doc);
        setEditedContent(doc.generatedContent ?? "");
      })
      .catch((err) => setError(getErrorMessage(err, tr('Não foi possível carregar o documento.'))))
      .finally(() => setIsLoading(false));
  }

  function clearMessages() {
    setError(null);
    setSuccessMessage(null);
  }

  async function handleGenerate() {
    if (!documentId || !instruction.trim()) return;
    setIsActionLoading(true);
    clearMessages();
    try {
      await generateDocumentContent(documentId, { instruction });
      loadDocument(documentId);
      setInstruction("");
      setSuccessMessage(tr('Conteúdo gerado com sucesso pela IA.'));
    } catch (err) {
      setError(getErrorMessage(err, tr('Falha ao gerar conteúdo. Tente novamente.')));
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handleSaveContent() {
    if (!documentId) return;
    setIsActionLoading(true);
    clearMessages();
    try {
      const updated = await updateDocumentContent(documentId, editedContent);
      setDocument(updated);
      setSuccessMessage(tr('Conteúdo salvo.'));
    } catch (err) {
      setError(getErrorMessage(err, tr('Falha ao salvar o conteúdo.')));
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handleReview() {
    if (!documentId) return;
    setIsActionLoading(true);
    clearMessages();
    try {
      const updated = await reviewDocument(documentId);
      setDocument(updated);
      setSuccessMessage(tr('Documento marcado como revisado.'));
    } catch (err) {
      setError(getErrorMessage(err, tr('Falha ao marcar como revisado.')));
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handleReject() {
    if (!documentId || !rejectionReason.trim()) return;
    setIsActionLoading(true);
    clearMessages();
    try {
      const updated = await rejectDocument(documentId, rejectionReason);
      setDocument(updated);
      setRejectionReason("");
      setShowRejectionForm(false);
      setSuccessMessage(tr('Documento rejeitado e devolvido para rascunho.'));
    } catch (err) {
      setError(getErrorMessage(err, tr('Falha ao rejeitar o documento.')));
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handleApprove() {
    if (!documentId) return;
    setIsActionLoading(true);
    clearMessages();
    try {
      const updated = await approveDocument(documentId);
      setDocument(updated);
      setSuccessMessage(tr('Documento aprovado.'));
    } catch (err) {
      setError(getErrorMessage(err, tr('Falha ao aprovar. Verifique se você tem permissão de ADMIN.')));
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handlePublishClick() {
    if (!documentId || !document) return;
    try {
      const allDocs = await fetchDocumentsByWorkspace(document.workspaceId);
      const other = allDocs.find(
        (d) => d.type === "POLITICA_PRIVACIDADE" && d.isPublished && d.id !== documentId,
      );
      const message = other
        ? tr('Já existe uma Política de Privacidade publicada ("{{a}}"). Publicar esta substituirá a versão atual. Deseja continuar?', { a: other.title })
        : tr('Publicar esta Política de Privacidade a tornará acessível publicamente, sem necessidade de login. Deseja continuar?');
      if (!window.confirm(message)) return;
      await handlePublish();
    } catch {
      if (window.confirm(tr('Publicar esta Política de Privacidade a tornará acessível publicamente. Deseja continuar?'))) {
        await handlePublish();
      }
    }
  }

  async function handlePublish() {
    if (!documentId) return;
    setIsActionLoading(true);
    clearMessages();
    try {
      const updated = await publishDocument(documentId);
      setDocument(updated);
      setSuccessMessage(tr('Política de Privacidade publicada.'));
    } catch (err) {
      setError(getErrorMessage(err, tr('Falha ao publicar. Verifique se você tem permissão de ADMIN.')));
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handleUnpublish() {
    if (!documentId) return;
    setIsActionLoading(true);
    clearMessages();
    try {
      const updated = await unpublishDocument(documentId);
      setDocument(updated);
      setSuccessMessage(tr('Política de Privacidade despublicada.'));
    } catch (err) {
      setError(getErrorMessage(err, tr('Falha ao despublicar.')));
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handleDownloadPdf() {
    if (!documentId || !document) return;
    setIsActionLoading(true);
    clearMessages();
    try {
      await downloadDocumentPdf(documentId, document.title);
    } catch (err) {
      setError(getErrorMessage(err, tr('Não foi possível gerar o PDF.')));
    } finally {
      setIsActionLoading(false);
    }
  }

  if (isLoading) return <LoadingSpinner label={tr('Carregando documento...')} />;
  if (!document) return <Alert type="error" message={tr('Documento não encontrado.')} />;

  const inputClass =
    "w-full rounded-lg bg-[#fbfaf6] text-[#0A0A0A] px-3 py-2 border border-[#0A0A0A]/10 focus:outline-none focus:ring-2 focus:ring-[#D92B21]/30 focus:border-[#0A0A0A] mb-3";

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to={`/workspaces/${document.workspaceId}/documents`}
        className="flex items-center gap-1.5 text-[#0A0A0A] hover:text-[#B4201A] text-sm mb-4 font-medium transition-colors w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />{tr('Voltar aos Documentos')}</Link>

      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl text-[#0A0A0A]">{document.title}</h2>
        <span className={`text-xs px-2 py-1 rounded font-medium shrink-0 ${DOCUMENT_STATUS_STYLES[document.status]}`}>
          {DOCUMENT_STATUS_LABELS[document.status]}
        </span>
      </div>
      <p className="text-sm text-[#0A0A0A]/55 mb-4">{DOCUMENT_TYPE_LABELS[document.type]}</p>

      {document.status === "APPROVED" && (
        <button
          onClick={handleDownloadPdf}
          disabled={isActionLoading}
          className="flex items-center gap-1.5 bg-[#0A0A0A]/8 hover:bg-[#0A0A0A]/15 disabled:opacity-50 text-[#0A0A0A] text-sm font-medium rounded-lg px-4 py-2 transition-colors mb-4"
        >
          <Download className="w-3.5 h-3.5" />{tr('Baixar PDF')}</button>
      )}

      <div className="space-y-3 mb-4">
        {error && <Alert type="error" message={error} />}
        {successMessage && <Alert type="success" message={successMessage} />}
      </div>

      {document.status === "DRAFT" && (
        <div className="bg-white rounded-xl p-4 border border-[#0A0A0A]/10 mb-4">
          <label className="block text-sm text-[#0A0A0A]/70 mb-2">{tr('Instrução para a IA')}</label>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            rows={3}
            placeholder={tr('Ex: Escreva um resumo sobre a retenção de dados e base legal utilizada')}
            className={inputClass}
          />
          <button
            onClick={handleGenerate}
            disabled={isActionLoading || !instruction.trim()}
            className="bg-[#D92B21] hover:bg-[#B4201A] disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-2 transition-colors"
          >
            {isActionLoading ? tr('Gerando...') : tr('Gerar com IA')}
          </button>
        </div>
      )}

      {document.status !== "APPROVED" && (
        <div className="bg-white rounded-xl p-4 border border-[#0A0A0A]/10 mb-4">
          <label className="block text-sm text-[#0A0A0A]/70 mb-2">{tr('Conteúdo')}</label>
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            rows={10}
            placeholder={tr('Digite o conteúdo manualmente, ou use \'Gerar com IA\' acima')}
            className={inputClass}
          />
          <button
            onClick={handleSaveContent}
            disabled={isActionLoading || editedContent === (document.generatedContent ?? "")}
            className="bg-[#0A0A0A]/8 hover:bg-[#0A0A0A]/15 disabled:opacity-50 text-[#0A0A0A] text-sm font-medium rounded-lg px-4 py-2 transition-colors"
          >{tr('Salvar edição manual')}</button>
        </div>
      )}
      {document.status === "APPROVED" && document.generatedContent !== null && (
        <div className="bg-white rounded-xl p-4 border border-[#0A0A0A]/10 mb-4">
          <label className="block text-sm text-[#0A0A0A]/70 mb-2">{tr('Conteúdo (aprovado, somente leitura)')}</label>
          <div
            className="text-sm text-[#0A0A0A]/85 leading-relaxed max-h-96 overflow-y-auto bg-[#fbfaf6] rounded-lg p-4"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(document.generatedContent) }}
          />
        </div>
      )}

      {(document.status === "GENERATED" || document.status === "REVIEWED") && (
        <div className="flex flex-wrap gap-3">
          {document.status === "GENERATED" && (
            <button
              onClick={handleReview}
              disabled={isActionLoading}
              className="bg-[#D92B21] hover:bg-[#B4201A] disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-2 transition-colors"
            >{tr('Marcar como Revisado')}</button>
          )}
          {(role === "ADMIN" || role === "SUPER_ADMIN") && document.status === "REVIEWED" && (
            <button
              onClick={handleApprove}
              disabled={isActionLoading}
              className="bg-[#D92B21] hover:bg-[#B4201A] disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-2 transition-colors"
            >{tr('Aprovar')}</button>
          )}
          {!showRejectionForm ? (
            <button
              onClick={() => setShowRejectionForm(true)}
              disabled={isActionLoading}
              className="bg-red-50 hover:bg-red-100 disabled:opacity-50 text-red-700 font-medium rounded-lg px-4 py-2 transition-colors"
            >{tr('Rejeitar')}</button>
          ) : (
            <div className="w-full bg-white rounded-xl p-4 border border-red-200 mt-2">
              <label className="block text-sm text-[#0A0A0A]/70 mb-2">{tr('Motivo da rejeição')}</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={2}
                className="w-full rounded-lg bg-[#fbfaf6] text-[#0A0A0A] px-3 py-2 border border-[#0A0A0A]/10 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 mb-3"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  disabled={isActionLoading || !rejectionReason.trim()}
                  className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg px-4 py-2 transition-colors"
                >{tr('Confirmar rejeição')}</button>
                <button
                  onClick={() => setShowRejectionForm(false)}
                  className="text-[#0A0A0A]/50 hover:text-[#0A0A0A]/75 text-sm px-4 py-2"
                >{tr('Cancelar')}</button>
              </div>
            </div>
          )}
        </div>
      )}

      {document.status === "APPROVED" && document.type === "POLITICA_PRIVACIDADE" && (
        <div className="bg-white rounded-xl p-4 border border-[#0A0A0A]/10 mt-4">
          <h3 className="text-sm font-medium text-[#0A0A0A]/70 mb-3">{tr('Publicação Pública')}</h3>
          {document.isPublished ? (
            <>
              <p className="text-sm text-[#0A0A0A] mb-3">{tr('✓ Publicada')}{" "}
                {document.publishedAt && tr('em {{a}}', { a: new Date(document.publishedAt).toLocaleString(getSystemLanguage()) })}
              </p>
              {publicUrl && (
                <div className="flex items-center gap-4 mb-3 bg-[#fbfaf6] rounded-lg p-3">
                  {qrDataUrl && (
                    <img src={qrDataUrl} alt={tr('QR Code da política pública')} className="w-20 h-20 rounded-lg bg-white p-1" />
                  )}
                  <div className="min-w-0">
                    <p className="text-xs text-[#0A0A0A]/55 mb-1">{tr('Link público para compartilhar:')}</p>
                    <button
                      type="button"
                      onClick={() => window.open(publicUrl, "_blank", "noopener,noreferrer")}
                      className="text-[#0A0A0A] hover:underline text-sm break-all text-left"
                    >
                      {publicUrl}
                    </button>
                  </div>
                </div>
              )}
              <button
                onClick={handleUnpublish}
                disabled={isActionLoading}
                className="bg-[#0A0A0A]/8 hover:bg-[#0A0A0A]/15 disabled:opacity-50 text-[#0A0A0A] text-sm font-medium rounded-lg px-4 py-2 transition-colors"
              >{tr('Despublicar')}</button>
            </>
          ) : (
            <button
              onClick={handlePublishClick}
              disabled={isActionLoading}
              className="bg-[#D92B21] hover:bg-[#B4201A] disabled:opacity-50 text-white text-sm font-semibold rounded-lg px-4 py-2 transition-colors"
            >{tr('Publicar')}</button>
          )}
        </div>
      )}
    </div>
  );
}