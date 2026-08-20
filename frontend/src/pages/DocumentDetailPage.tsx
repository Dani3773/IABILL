import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  fetchDocumentById,
  generateDocumentContent,
  updateDocumentContent,
  reviewDocument,
  rejectDocument,
  approveDocument,
} from "../api/documentService";
import { getErrorMessage } from "../api/errorUtils";
import { useAuth } from "../contexts/AuthContext";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Alert } from "../components/Alert";
import type { Document } from "../types/document";
import {
  publishDocument,
  unpublishDocument,
  fetchDocumentsByWorkspace,
} from "../api/documentService";
import QRCode from "qrcode";
import { fetchWorkspaces } from "../api/workspaceService";

export function DocumentDetailPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const { role } = useAuth();

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

  useEffect(() => {
    if (!documentId) return;
    loadDocument(documentId);
  }, [documentId]);

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
        const url = `https://iabill.com/politica-privacidade/${ws.documentId}`;
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
      .catch((err) =>
        setError(
          getErrorMessage(err, "Não foi possível carregar o documento."),
        ),
      )
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
      setSuccessMessage("Conteúdo gerado com sucesso pela IA.");
    } catch (err) {
      setError(
        getErrorMessage(err, "Falha ao gerar conteúdo. Tente novamente."),
      );
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
      setSuccessMessage("Conteúdo salvo.");
    } catch (err) {
      setError(getErrorMessage(err, "Falha ao salvar o conteúdo."));
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
      setSuccessMessage("Documento marcado como revisado.");
    } catch (err) {
      setError(getErrorMessage(err, "Falha ao marcar como revisado."));
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
      setSuccessMessage("Documento rejeitado e devolvido para rascunho.");
    } catch (err) {
      setError(getErrorMessage(err, "Falha ao rejeitar o documento."));
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
      setSuccessMessage("Documento aprovado.");
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Falha ao aprovar. Verifique se você tem permissão de ADMIN.",
        ),
      );
    } finally {
      setIsActionLoading(false);
    }
  }

  async function handlePublishClick() {
    if (!documentId || !document) return;
    try {
      const allDocs = await fetchDocumentsByWorkspace(document.workspaceId);
      const other = allDocs.find(
        (d) =>
          d.type === "POLITICA_PRIVACIDADE" &&
          d.isPublished &&
          d.id !== documentId,
      );
      const message = other
        ? `Já existe uma Política de Privacidade publicada ("${other.title}"). Publicar esta substituirá a versão atual. Deseja continuar?`
        : "Publicar esta Política de Privacidade a tornará acessível publicamente, sem necessidade de login. Deseja continuar?";
      if (!window.confirm(message)) return;
      await handlePublish();
    } catch {
      if (
        window.confirm(
          "Publicar esta Política de Privacidade a tornará acessível publicamente. Deseja continuar?",
        )
      ) {
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
      setSuccessMessage("Política de Privacidade publicada.");
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Falha ao publicar. Verifique se você tem permissão de ADMIN.",
        ),
      );
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
      setSuccessMessage("Política de Privacidade despublicada.");
    } catch (err) {
      setError(getErrorMessage(err, "Falha ao despublicar."));
    } finally {
      setIsActionLoading(false);
    }
  }

  if (isLoading) return <LoadingSpinner label="Carregando documento..." />;
  if (!document)
    return <Alert type="error" message="Documento não encontrado." />;

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to={`/workspaces/${document.workspaceId}/documents`}
        className="text-cyan-400 hover:underline text-sm mb-4 inline-block"
      >
        ← Voltar aos Documentos
      </Link>

      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold text-white">{document.title}</h2>
        <span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300">
          {document.status}
        </span>
      </div>
      <p className="text-sm text-slate-400 mb-6">{document.type}</p>

      <div className="space-y-3 mb-4">
        {error && <Alert type="error" message={error} />}
        {successMessage && <Alert type="success" message={successMessage} />}
      </div>

      {document.status === "DRAFT" && (
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mb-4">
          <label className="block text-sm text-slate-300 mb-2">
            Instrução para a IA
          </label>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            rows={3}
            placeholder="Ex: Escreva um resumo sobre a retenção de dados e base legal utilizada"
            className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:outline-none focus:border-cyan-500 mb-3"
          />
          <button
            onClick={handleGenerate}
            disabled={isActionLoading || !instruction.trim()}
            className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 transition-colors"
          >
            {isActionLoading ? "Gerando..." : "Gerar com IA"}
          </button>
        </div>
      )}

      {document.generatedContent !== null && (
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mb-4">
          <label className="block text-sm text-slate-300 mb-2">
            Conteúdo{" "}
            {document.status === "APPROVED"
              ? "(aprovado, somente leitura)"
              : ""}
          </label>
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            rows={10}
            readOnly={document.status === "APPROVED"}
            className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:outline-none focus:border-cyan-500 mb-3 disabled:opacity-70"
          />
          {document.status !== "APPROVED" && (
            <button
              onClick={handleSaveContent}
              disabled={
                isActionLoading || editedContent === document.generatedContent
              }
              className="bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
            >
              Salvar edição manual
            </button>
          )}
        </div>
      )}

      {(document.status === "GENERATED" || document.status === "REVIEWED") && (
        <div className="flex flex-wrap gap-3">
          {document.status === "GENERATED" && (
            <button
              onClick={handleReview}
              disabled={isActionLoading}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 transition-colors"
            >
              Marcar como Revisado
            </button>
          )}

          {(role === "ADMIN" || role === "SUPER_ADMIN") &&
            document.status === "REVIEWED" && (
              <button
                onClick={handleApprove}
                disabled={isActionLoading}
                className="bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 transition-colors"
              >
                Aprovar
              </button>
            )}

          {!showRejectionForm ? (
            <button
              onClick={() => setShowRejectionForm(true)}
              disabled={isActionLoading}
              className="bg-red-900 hover:bg-red-800 disabled:opacity-50 text-red-300 font-medium rounded-lg px-4 py-2 transition-colors"
            >
              Rejeitar
            </button>
          ) : (
            <div className="w-full bg-slate-800 rounded-lg p-4 border border-red-900 mt-2">
              <label className="block text-sm text-slate-300 mb-2">
                Motivo da rejeição
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={2}
                className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:outline-none focus:border-red-500 mb-3"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  disabled={isActionLoading || !rejectionReason.trim()}
                  className="bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
                >
                  Confirmar rejeição
                </button>
                <button
                  onClick={() => setShowRejectionForm(false)}
                  className="text-slate-400 hover:text-slate-300 text-sm px-4 py-2"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {document.status === "APPROVED" &&
        document.type === "POLITICA_PRIVACIDADE" && (
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mt-4">
            <h3 className="text-sm font-medium text-slate-300 mb-3">
              Publicação Pública
            </h3>
            {document.isPublished ? (
              <>
                <p className="text-sm text-emerald-400 mb-3">
                  ✓ Publicada{" "}
                  {document.publishedAt &&
                    `em ${new Date(document.publishedAt).toLocaleString("pt-BR")}`}
                </p>
                              {publicUrl && (
                  <div className="flex items-center gap-4 mb-3">
                    {qrDataUrl && (
                      <img
                        src={qrDataUrl}
                        alt="QR Code da política pública"
                        className="w-24 h-24 rounded-lg bg-white p-1"
                      />
                    )}
                    <div className="min-w-0">
                      <p className="text-xs text-slate-400 mb-1">
                        Link público para compartilhar:
                      </p>
                      <button
                        type="button"
                        onClick={() => window.open(publicUrl, "_blank", "noopener,noreferrer")}
                        className="text-cyan-400 hover:underline text-sm break-all text-left"
                      >
                        {publicUrl}
                      </button>
                    </div>
                  </div>
                )}
                <button
                  onClick={handleUnpublish}
                  disabled={isActionLoading}
                  className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
                >
                  Despublicar
                </button>
              </>
            ) : (
              <button
                onClick={handlePublishClick}
                disabled={isActionLoading}
                className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
              >
                Publicar
              </button>
            )}
          </div>
        )}
    </div>
  );
}