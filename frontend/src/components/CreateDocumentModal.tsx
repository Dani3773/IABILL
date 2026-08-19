import { useState, type FormEvent } from "react";
import { FileText, X } from "lucide-react";
import { createDocument } from "../api/documentService";
import type { Document, DocumentType } from "../types/document";
import { useAuth } from "../contexts/AuthContext";
import { getErrorMessage } from "../api/errorUtils";

interface Props {
  workspaceId: string;
  onClose: () => void;
  onCreated: (document: Document) => void;
  initialType?: DocumentType;
  initialTitle?: string;
}

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  INVENTARIO_DADOS: "Inventário de Dados",
  POLITICA_PRIVACIDADE: "Política de Privacidade",
  RELATORIO_CONFORMIDADE: "Relatório de Conformidade",
  RAT: "RAT (Registro de Atividades de Tratamento)",
  RIPD_DPIA: "RIPD/DPIA (Relatório de Impacto à Proteção de Dados)",
  POLITICA_SEGURANCA_INFORMACAO: "Política de Segurança da Informação (PSI)",
};

export function CreateDocumentModal({ workspaceId, onClose, onCreated, initialType, initialTitle }: Props) {
  const { userId } = useAuth();
  const [title, setTitle] = useState(initialTitle ?? "");
  const [type, setType] = useState<DocumentType>(initialType ?? "INVENTARIO_DADOS");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setError(null);
    setIsLoading(true);
    try {
      const document = await createDocument({
        workspaceId,
        createdByUserId: userId,
        type,
        title,
      });
      onCreated(document);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível criar o documento."));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-[#1B2233]/40 backdrop-blur-sm flex items-center justify-center px-4 z-50">
      <div className="w-full max-w-md bg-white rounded-xl p-6 shadow-2xl border border-[#1B2233]/10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#14B8A6]/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-[#14B8A6]" />
            </div>
            <h2 className="text-lg font-serif text-[#1B2233]">Novo Documento</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#1B2233]/40 hover:text-[#1B2233] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#1B2233]/60 mb-1.5">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Ex: Relatório de Conformidade - Q3 2026"
              className="w-full rounded-lg bg-[#F5F2EA] text-[#1B2233] text-sm px-3 py-2.5 border border-[#1B2233]/10 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6] transition-all placeholder:text-[#1B2233]/35"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#1B2233]/60 mb-1.5">Tipo de Documento</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as DocumentType)}
              className="w-full rounded-lg bg-[#F5F2EA] text-[#1B2233] text-sm px-3 py-2.5 border border-[#1B2233]/10 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6] transition-all"
            >
              {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-[#14B8A6] hover:bg-[#10a595] disabled:opacity-50 text-[#0A0D16] text-sm font-semibold rounded-lg py-2.5 transition-colors"
            >
              {isLoading ? "Criando..." : "Criar"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#1B2233]/5 hover:bg-[#1B2233]/10 text-[#1B2233] text-sm font-medium rounded-lg py-2.5 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}