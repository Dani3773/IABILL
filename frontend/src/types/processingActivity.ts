export type LegalBasis =
  | 'CONSENTIMENTO'
  | 'CUMPRIMENTO_OBRIGACAO_LEGAL'
  | 'EXECUCAO_CONTRATO'
  | 'EXERCICIO_REGULAR_DE_DIREITOS'
  | 'PROTECAO_DA_VIDA'
  | 'TUTELA_DA_SAUDE'
  | 'LEGITIMO_INTERESSE'
  | 'PROTECAO_DO_CREDITO'
  | 'EXECUCAO_POLITICAS_PUBLICAS'
  | 'ESTUDOS_POR_ORGAO_PESQUISA'

export interface ProcessingActivity {
  id: string
  workspaceId: string
  processName: string
  purpose: string
  legalBasis: LegalBasis
  dataSubjectCategories: string
  personalDataCategories: string
  dataSharing: string | null
  securityMeasures: string | null
  retentionPeriod: string | null
  involvesSensitiveData: boolean
  observations: string | null
  createdAt: string
  updatedAt: string
}

export interface ProcessingActivityRequest {
  workspaceId: string
  processName: string
  purpose: string
  legalBasis: LegalBasis
  dataSubjectCategories: string
  personalDataCategories: string
  dataSharing?: string
  securityMeasures?: string
  retentionPeriod?: string
  involvesSensitiveData: boolean
  observations?: string
}

export const LEGAL_BASIS_LABELS: Record<LegalBasis, string> = {
  CONSENTIMENTO: 'Consentimento',
  CUMPRIMENTO_OBRIGACAO_LEGAL: 'Cumprimento de obrigação legal',
  EXECUCAO_CONTRATO: 'Execução de contrato',
  EXERCICIO_REGULAR_DE_DIREITOS: 'Exercício regular de direitos',
  PROTECAO_DA_VIDA: 'Proteção da vida',
  TUTELA_DA_SAUDE: 'Tutela da saúde',
  LEGITIMO_INTERESSE: 'Legítimo interesse',
  PROTECAO_DO_CREDITO: 'Proteção do crédito',
  EXECUCAO_POLITICAS_PUBLICAS: 'Execução de políticas públicas',
  ESTUDOS_POR_ORGAO_PESQUISA: 'Estudos por órgão de pesquisa',
}