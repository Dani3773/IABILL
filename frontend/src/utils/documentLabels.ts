import type { DocumentStatus, DocumentType } from '../types/document'

import { tr } from '../i18n/tr'
export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  INVENTARIO_DADOS: tr('Inventário de Dados'),
  POLITICA_PRIVACIDADE: tr('Política de Privacidade'),
  RELATORIO_CONFORMIDADE: tr('Relatório de Conformidade'),
  RAT: tr('RAT (Registro de Atividades de Tratamento)'),
  RIPD_DPIA: tr('RIPD/DPIA (Relatório de Impacto à Proteção de Dados)'),
  POLITICA_SEGURANCA_INFORMACAO: tr('Política de Segurança da Informação (PSI)'),
  MATERIAL_TREINAMENTO: tr('Material de Treinamento/Conscientização'),
}

export const DOCUMENT_TYPE_SHORT_LABELS: Record<DocumentType, string> = {
  INVENTARIO_DADOS: tr('Inventário de Dados'),
  POLITICA_PRIVACIDADE: tr('Política de Privacidade'),
  RELATORIO_CONFORMIDADE: tr('Relatório de Conformidade'),
  RAT: tr('RAT'),
  RIPD_DPIA: tr('RIPD/DPIA'),
  POLITICA_SEGURANCA_INFORMACAO: tr('Segurança da Informação'),
  MATERIAL_TREINAMENTO: tr('Treinamento'),
}

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  DRAFT: tr('Rascunho'),
  GENERATED: tr('Gerado por IA'),
  REVIEWED: tr('Revisado'),
  APPROVED: tr('Aprovado'),
}

export const DOCUMENT_STATUS_STYLES: Record<DocumentStatus, string> = {
  DRAFT: 'bg-[#0A0A0A]/8 text-[#0A0A0A]/70',
  GENERATED: 'bg-amber-100 text-amber-800',
  REVIEWED: 'bg-blue-100 text-blue-700',
  APPROVED: 'bg-emerald-100 text-emerald-800',
}
