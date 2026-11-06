import { useState, type FormEvent } from "react";
import { FileText, X } from "lucide-react";
import { createDocument } from "../api/documentService";
import type { Document, DocumentType } from "../types/document";
import { getErrorMessage } from "../api/errorUtils";

import { tr } from '../i18n/tr'
interface Props {
  workspaceId: string;
  onClose: () => void;
  onCreated: (document: Document) => void;
  initialType?: DocumentType;
  initialTitle?: string;
}

const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  INVENTARIO_DADOS: tr('Inventário de Dados'),
  POLITICA_PRIVACIDADE: tr('Política de Privacidade'),
  RELATORIO_CONFORMIDADE: tr('Relatório de Conformidade'),
  RAT: tr('RAT (Registro de Atividades de Tratamento)'),
  RIPD_DPIA: tr('RIPD/DPIA (Relatório de Impacto à Proteção de Dados)'),
  POLITICA_SEGURANCA_INFORMACAO: tr('Política de Segurança da Informação (PSI)'),
  MATERIAL_TREINAMENTO: tr('Material de Treinamento/Conscientização'),
};

export function CreateDocumentModal({ workspaceId, onClose, onCreated, initialType, initialTitle }: Props) {
  const [title, setTitle] = useState(initialTitle ?? "");
  const [type, setType] = useState<DocumentType>(initialType ?? "INVENTARIO_DADOS");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const document = await createDocument({
        workspaceId,
        type,
        title,
      });
      onCreated(document);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, tr('Não foi possível criar o documento.')));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-[#0A0A0A]/40 flex items-center justify-center px-4 z-50">
      <div className="w-full max-w-md bg-white rounded-xl p-6 shadow-2xl border border-[#0A0A0A]/10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D92B21]/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-[#B4201A]" />
            </div>
            <h2 className="text-lg text-[#0A0A0A]">{tr('Novo Documento')}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#0A0A0A]/40 hover:text-[#0A0A0A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#0A0A0A]/60 mb-1.5">{tr('Título')}</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder={tr('Ex: Relatório de Conformidade - Q3 2026')}
              className="w-full rounded-lg bg-[#fbfaf6] text-[#0A0A0A] text-sm px-3 py-2.5 border border-[#0A0A0A]/10 focus:outline-none focus:ring-2 focus:ring-[#D92B21]/30 focus:border-[#0A0A0A] transition-all placeholder:text-[#0A0A0A]/35"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#0A0A0A]/60 mb-1.5">{tr('Tipo de Documento')}</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as DocumentType)}
              className="w-full rounded-lg bg-[#fbfaf6] text-[#0A0A0A] text-sm px-3 py-2.5 border border-[#0A0A0A]/10 focus:outline-none focus:ring-2 focus:ring-[#D92B21]/30 focus:border-[#0A0A0A] transition-all"
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
              className="flex-1 bg-[#D92B21] hover:bg-[#B4201A] disabled:opacity-50 text-white text-sm font-semibold rounded-lg py-2.5 transition-colors"
            >
              {isLoading ? tr('Criando...') : tr('Criar')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#0A0A0A]/5 hover:bg-[#0A0A0A]/10 text-[#0A0A0A] text-sm font-medium rounded-lg py-2.5 transition-colors"
            >{tr('Cancelar')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}