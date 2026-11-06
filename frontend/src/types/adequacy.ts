export type AdequacyItem =
  | 'DIAGNOSTICO'
  | 'COMITE'
  | 'ENCARREGADO_PUBLICADO'
  | 'SEM_FORNECEDORES'
  | 'CANAL_TITULAR'
  | 'PLANO_INCIDENTES'
  | 'REVISAO_PERIODICA'

export interface AdequacyConfirmation {
  item: AdequacyItem
  confirmedByName: string
  confirmedAt: string
}
