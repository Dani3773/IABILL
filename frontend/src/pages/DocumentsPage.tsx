import { useEffect, useState, type MouseEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { FileText, AlertTriangle, Clock } from "lucide-react";
import { CreateDocumentModal } from "../components/CreateDocumentModal";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Alert } from "../components/Alert";
import { getErrorMessage } from "../api/errorUtils";
import { useLocation } from "react-router-dom";
import type { Document, DocumentStatus, DocumentType } from "../types/document";
import {
  fetchDocumentsByWorkspace,
  dismissReviewFlag,
} from "../api/documentService";

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  INVENTARIO_DADOS: "Inventário de Dados",
  POLITICA_PRIVACIDADE: "Política de Privacidade",
  RELATORIO_CONFORMIDADE: "Relatório de Conformidade",
  RAT: "RAT (Registro de Atividades de Tratamento)",
  RIPD_DPIA: "RIPD/DPIA (Relatório de Impacto à Proteção de Dados)",
  POLITICA_SEGURANCA_INFORMACAO: "Política de Segurança da Informação (PSI)",
  MATERIAL_TREINAMENTO: "Material de Treinamento/Conscientização",
};

const STATUS_STYLES: Record<DocumentStatus, string> = {
  DRAFT: "bg-[#0A0A0A]/8 text-[#0A0A0A]/60",
  GENERATED: "bg-[#D92B21]/12 text-[#B4201A]",
  REVIEWED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-[#D92B21]/12 text-[#0A0A0A]",
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
  const location = useLocation();
  const prefill = location.state as { prefillType?: string; prefillTitle?: string } | null;

  useEffect(() => {
    if (!workspaceId) return;
    fetchDocumentsByWorkspace(workspaceId)
      .then(setDocuments)
      .catch((err) =>
        setError(getErrorMessage(err, "Não foi possível carregar os documentos.")),
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
      setError(getErrorMessage(err, "Não foi possível dispensar o aviso."));
    }
  }

  if (isLoading) return <LoadingSpinner label="Carregando documentos..." />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl text-[#0A0A0A]">Documentos</h1>
          <p className="text-sm text-[#0A0A0A]/50 mt-0.5">
            {documents.length} {documents.length === 1 ? "documento" : "documentos"}
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-[#0A0A0A] hover:bg-[#2A2A2A] text-white text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors"
        >
          + Novo Documento
        </button>
      </div>

      {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

      {documents.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-10 text-center">
          <FileText className="w-8 h-8 text-[#0A0A0A]/25 mx-auto mb-3" />
          <p className="text-[#0A0A0A]/60 text-sm">Nenhum documento cadastrado ainda neste workspace.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => {
            const isOverdue = doc.reviewDueAt && new Date(doc.reviewDueAt) < new Date();
            return (
              <Link
                key={doc.id}
                to={`/documents/${doc.id}`}
                className="block bg-white rounded-xl p-4 border border-[#0A0A0A]/10 hover:border-[#D92B21]/50 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-[#D92B21]/10 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4 text-[#B4201A]" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-[#0A0A0A] truncate">{doc.title}</p>
                      <p className="text-xs text-[#0A0A0A]/65">{DOCUMENT_TYPE_LABELS[doc.type]}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded shrink-0 ${STATUS_STYLES[doc.status]}`}>
                    {STATUS_LABELS[doc.status]}
                  </span>
                </div>

                {doc.reviewRecommended && (
                  <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-[#0A0A0A]/8">
                    <p className="flex items-center gap-1.5 text-xs text-amber-700">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      Revisão recomendada
                      {doc.reviewRecommendedReason && ` — ${doc.reviewRecommendedReason}`}
                    </p>
                    <button
                      onClick={(e) => handleDismissReviewFlag(e, doc.id)}
                      className="text-xs text-[#0A0A0A]/60 hover:text-[#0A0A0A]/85 shrink-0 font-medium"
                    >
                      Dispensar
                    </button>
                  </div>
                )}

                {isOverdue && (
                  <div className={doc.reviewRecommended ? "mt-2" : "mt-3 pt-3 border-t border-[#0A0A0A]/8"}>
                    <p className="flex items-center gap-1.5 text-xs text-blue-700">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      Revisão periódica vencida desde{" "}
                      {new Date(doc.reviewDueAt!).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
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