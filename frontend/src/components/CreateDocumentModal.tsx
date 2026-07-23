import { useState, type FormEvent } from "react";
import { createDocument } from "../api/documentService";
import type { Document, DocumentType } from "../types/document";
import { useAuth } from "../contexts/AuthContext";
import { getErrorMessage } from "../api/errorUtils";

interface Props {
  workspaceId: string;
  onClose: () => void;
  onCreated: (document: Document) => void;
}

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  INVENTARIO_DADOS: "Inventário de Dados",
  POLITICA_PRIVACIDADE: "Política de Privacidade",
  RELATORIO_CONFORMIDADE: "Relatório de Conformidade",
  RAT: "RAT (Registro de Atividades de Tratamento)",
};

export function CreateDocumentModal({
  workspaceId,
  onClose,
  onCreated,
}: Props) {
  const { userId } = useAuth();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<DocumentType>("INVENTARIO_DADOS");
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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 z-50">
      <div className="w-full max-w-md bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Novo Documento</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Título</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Ex: Relatório de Conformidade - Q3 2026"
              className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Tipo de Documento
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as DocumentType)}
              className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:outline-none focus:border-cyan-500"
            >
              {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-medium rounded-lg py-2 transition-colors"
            >
              {isLoading ? "Criando..." : "Criar"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg py-2 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
