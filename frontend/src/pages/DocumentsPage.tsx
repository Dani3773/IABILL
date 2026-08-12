import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CreateDocumentModal } from "../components/CreateDocumentModal";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Alert } from "../components/Alert";
import { getErrorMessage } from "../api/errorUtils";
import type { Document, DocumentStatus } from "../types/document";
import {
  fetchDocumentsByWorkspace,
  dismissReviewFlag,
} from "../api/documentService";

const STATUS_STYLES: Record<DocumentStatus, string> = {
  DRAFT: "bg-slate-700 text-slate-300",
  GENERATED: "bg-yellow-900 text-yellow-300",
  REVIEWED: "bg-blue-900 text-blue-300",
  APPROVED: "bg-green-900 text-green-300",
};

const STATUS_LABELS: Record<DocumentStatus, string> = {
  DRAFT: "Rascunho",
  GENERATED: "Gerado por IA",
  REVIEWED: "Revisado",
  APPROVED: "Aprovado",
};

export function DocumentsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;

    fetchDocumentsByWorkspace(workspaceId)
      .then(setDocuments)
      .catch((err) =>
        setError(
          getErrorMessage(err, "Não foi possível carregar os documentos."),
        ),
      )
      .finally(() => setIsLoading(false));
  }, [workspaceId]);

  function handleCreated(newDocument: Document) {
    setDocuments((prev) => [...prev, newDocument]);
  }

  if (isLoading) return <LoadingSpinner label="Carregando documentos..." />;

  async function handleDismissReviewFlag(
    e: React.MouseEvent,
    documentId: string,
  ) {
    e.preventDefault(); // evita navegar para o documento ao clicar no botao
    e.stopPropagation();
    try {
      const updated = await dismissReviewFlag(documentId);
      setDocuments((prev) =>
        prev.map((d) => (d.id === documentId ? updated : d)),
      );
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível dispensar o aviso."));
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Documentos</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
        >
          + Novo Documento
        </button>
      </div>

      {error && (
        <div className="mb-4">
          <Alert type="error" message={error} />
        </div>
      )}

      {documents.length === 0 ? (
        <p className="text-slate-400">
          Nenhum documento cadastrado ainda neste workspace.
        </p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <Link
              key={doc.id}
              to={`/documents/${doc.id}`}
              className="block bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-cyan-500 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{doc.title}</p>
                  <p className="text-xs text-slate-400">{doc.type}</p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded ${STATUS_STYLES[doc.status]}`}
                >
                  {STATUS_LABELS[doc.status]}
                </span>
              </div>
              {doc.reviewRecommended && (
                <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-amber-900/40">
                  <p className="text-xs text-amber-400">
                    ⚠ Revisão recomendada
                    {doc.reviewRecommendedReason &&
                      ` — ${doc.reviewRecommendedReason}`}
                  </p>
                  {doc.reviewDueAt && new Date(doc.reviewDueAt) < new Date() && (
                <p className="text-xs text-blue-400 mt-2">
                  🕐 Revisão periódica vencida desde{" "}
                  {new Date(doc.reviewDueAt).toLocaleDateString("pt-BR")}
                </p>
              )}
                  <button
                    onClick={(e) => handleDismissReviewFlag(e, doc.id)}
                    className="text-xs text-slate-400 hover:text-slate-300 shrink-0"
                  >
                    Dispensar
                  </button>
                </div>
              )}
            </Link>
          ))}
        </div>
      )}

      {showCreateModal && workspaceId && (
        <CreateDocumentModal
          workspaceId={workspaceId}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}
