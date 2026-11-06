import type { DocumentStatus, DocumentType } from '../types/document'

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  INVENTARIO_DADOS: 'Inventário de Dados',
  POLITICA_PRIVACIDADE: 'Política de Privacidade',
  RELATORIO_CONFORMIDADE: 'Relatório de Conformidade',
  RAT: 'RAT (Registro de Atividades de Tratamento)',
  RIPD_DPIA: 'RIPD/DPIA (Relatório de Impacto à Proteção de Dados)',
  POLITICA_SEGURANCA_INFORMACAO: 'Política de Segurança da Informação (PSI)',
  MATERIAL_TREINAMENTO: 'Material de Treinamento/Conscientização',
}

export const DOCUMENT_TYPE_SHORT_LABELS: Record<DocumentType, string> = {
  INVENTARIO_DADOS: 'Inventário de Dados',
  POLITICA_PRIVACIDADE: 'Política de Privacidade',
  RELATORIO_CONFORMIDADE: 'Relatório de Conformidade',
  RAT: 'RAT',
  RIPD_DPIA: 'RIPD/DPIA',
  POLITICA_SEGURANCA_INFORMACAO: 'Segurança da Informação',
  MATERIAL_TREINAMENTO: 'Treinamento',
}

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  DRAFT: 'Rascunho',
  GENERATED: 'Gerado por IA',
  REVIEWED: 'Revisado',
  APPROVED: 'Aprovado',
}

export const DOCUMENT_STATUS_STYLES: Record<DocumentStatus, string> = {
  DRAFT: 'bg-[#0A0A0A]/8 text-[#0A0A0A]/70',
  GENERATED: 'bg-amber-100 text-amber-800',
  REVIEWED: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-emerald-100 text-emerald-800',
}
