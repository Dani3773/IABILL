import { tr } from '../i18n/tr'

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
  sectorId: string | null
  sectorName: string | null
  applicableRegime: 'LGPD' | 'RGPD'
  processName: string
  purpose: string
  legalBasis: LegalBasis
  dataSubjectCategories: string
  personalDataCategories: string
  dataSharing: string | null
  securityMeasures: string | null
  retentionPeriod: string | null
  retentionExpiresAt: string | null
  involvesSensitiveData: boolean
  ripdSuggestionDismissed: boolean
  observations: string | null
  jointControllers: string | null
  involvesAutomatedDecisions: boolean
  automatedDecisionSafeguards: string | null
  involvesChildrenData: boolean
  involvesInternationalTransfer: boolean
  internationalTransferDetails: string | null
  specialCategoryException: SpecialCategoryException | null
  createdAt: string
  updatedAt: string
}

export interface ProcessingActivityRequest {
  workspaceId: string
  sectorId?: string
  applicableRegime: 'LGPD' | 'RGPD'
  processName: string
  purpose: string
  legalBasis: LegalBasis
  dataSubjectCategories: string
  personalDataCategories: string
  dataSharing?: string
  securityMeasures?: string
  retentionPeriod?: string
  retentionExpiresAt?: string
  involvesSensitiveData: boolean
  observations?: string
  jointControllers?: string
  involvesAutomatedDecisions: boolean
  automatedDecisionSafeguards?: string
  involvesChildrenData: boolean
  involvesInternationalTransfer: boolean
  internationalTransferDetails?: string
  specialCategoryException?: SpecialCategoryException
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

// Exceções do Art. 9, n.º 2 do RGPD para categorias especiais de dados.
export type SpecialCategoryException =
  | 'EXPLICIT_CONSENT'
  | 'EMPLOYMENT_SOCIAL_SECURITY'
  | 'VITAL_INTERESTS'
  | 'NOT_FOR_PROFIT_BODY'
  | 'MADE_PUBLIC_BY_SUBJECT'
  | 'LEGAL_CLAIMS'
  | 'SUBSTANTIAL_PUBLIC_INTEREST'
  | 'HEALTH_OR_SOCIAL_CARE'
  | 'PUBLIC_HEALTH'
  | 'ARCHIVING_RESEARCH'

export const SPECIAL_CATEGORY_EXCEPTION_LABELS: Record<SpecialCategoryException, string> = {
  EXPLICIT_CONSENT: 'a) Consentimento explícito',
  EMPLOYMENT_SOCIAL_SECURITY: 'b) Direito do trabalho e segurança social',
  VITAL_INTERESTS: 'c) Interesses vitais, titular incapaz de consentir',
  NOT_FOR_PROFIT_BODY: 'd) Fundação, associação ou organismo sem fins lucrativos',
  MADE_PUBLIC_BY_SUBJECT: 'e) Dados tornados públicos pelo próprio titular',
  LEGAL_CLAIMS: 'f) Declaração, exercício ou defesa de direitos em processo',
  SUBSTANTIAL_PUBLIC_INTEREST: 'g) Interesse público importante, com base em lei',
  HEALTH_OR_SOCIAL_CARE: 'h) Medicina preventiva ou do trabalho, saúde ou ação social',
  PUBLIC_HEALTH: 'i) Saúde pública',
  ARCHIVING_RESEARCH: 'j) Arquivo de interesse público, investigação científica ou estatística',
}

export const LEGAL_REGIME_LABELS: Record<'LGPD' | 'RGPD', string> = {
  LGPD: 'LGPD (Brasil)',
  RGPD: 'RGPD (União Europeia)',
}

// As 6 bases legais do Art. 6º do RGPD mapeiam para estas 6, das 10 hipóteses
// da LGPD (Art. 7º/11) - as outras 4 (exercício de direitos, tutela da saúde,
// proteção do crédito, estudos por órgão de pesquisa) são específicas da LGPD.
export const RGPD_LEGAL_BASIS_OPTIONS: LegalBasis[] = [
  'CONSENTIMENTO',
  'EXECUCAO_CONTRATO',
  'CUMPRIMENTO_OBRIGACAO_LEGAL',
  'PROTECAO_DA_VIDA',
  'EXECUCAO_POLITICAS_PUBLICAS',
  'LEGITIMO_INTERESSE',
]

// No RGPD as mesmas 6 bases têm outros nomes (Art. 6, n.º 1, alíneas a a f).
// "Execução de políticas públicas" corresponde, no RGPD, ao interesse público ou
// exercício de autoridade pública, que é mais amplo.
export const RGPD_LEGAL_BASIS_LABELS: Partial<Record<LegalBasis, string>> = {
  CONSENTIMENTO: 'Consentimento (Art. 6, n.º 1, a)',
  EXECUCAO_CONTRATO: 'Execução de contrato (Art. 6, n.º 1, b)',
  CUMPRIMENTO_OBRIGACAO_LEGAL: 'Obrigação jurídica (Art. 6, n.º 1, c)',
  PROTECAO_DA_VIDA: 'Interesses vitais (Art. 6, n.º 1, d)',
  EXECUCAO_POLITICAS_PUBLICAS: 'Interesse público ou autoridade pública (Art. 6, n.º 1, e)',
  LEGITIMO_INTERESSE: 'Interesses legítimos (Art. 6, n.º 1, f)',
}

// Nome da base legal na lei da atividade, já traduzido para o idioma do sistema.
export function legalBasisLabel(basis: LegalBasis, regime: 'LGPD' | 'RGPD'): string {
  const label = regime === 'RGPD' ? RGPD_LEGAL_BASIS_LABELS[basis] ?? LEGAL_BASIS_LABELS[basis] : LEGAL_BASIS_LABELS[basis]
  return tr(label)
}

export function legalRegimeLabel(regime: 'LGPD' | 'RGPD'): string {
  return tr(LEGAL_REGIME_LABELS[regime])
}