import type { ActionItem } from '../types/actionItem'
import type { AdequacyConfirmation, AdequacyItem } from '../types/adequacy'
import type { ComplianceSummary } from '../types/complianceSummary'
import type { Document, DocumentType } from '../types/document'
import type { ProcessingActivity } from '../types/processingActivity'
import type { Sector } from '../types/sector'
import type { Vendor } from '../types/vendor'

import { tr, trn } from '../i18n/tr'
export type LegalRegimeCode = 'LGPD' | 'RGPD'
export type CheckState = 'done' | 'pending' | 'na'

export interface Citation {
  regime: LegalRegimeCode
  reference: string
  about: string
}

export interface PathCheck {
  id: string
  label: string
  state: CheckState
  // O que falta (ou o que foi encontrado), sempre calculado a partir dos dados reais.
  hint: string
  to?: string
  actionLabel?: string
  // Quando presente, o item depende da declaracao de um responsavel.
  manualItem?: AdequacyItem
  manualLabel?: string
  confirmation?: AdequacyConfirmation
}

export type StageStatus = 'done' | 'progress' | 'todo'

export interface PathStage {
  id: string
  number: number
  title: string
  summary: string
  why: string
  citations: Citation[]
  guide?: { label: string; to: string }
  checks: PathCheck[]
  status: StageStatus
}

export interface AdequacyPath {
  stages: PathStage[]
  doneCount: number
  totalCount: number
  percent: number
  nextStage: PathStage | null
}

export interface PathInput {
  base: string
  regimes: LegalRegimeCode[]
  summary: ComplianceSummary | null
  documents: Document[]
  activities: ProcessingActivity[]
  vendors: Vendor[]
  sectors: Sector[]
  actions: ActionItem[]
  confirmations: AdequacyConfirmation[]
}

function isApproved(documents: Document[], type: DocumentType) {
  return documents.some((d) => d.type === type && d.status === 'APPROVED')
}

function statusOf(checks: PathCheck[]): StageStatus {
  const applicable = checks.filter((c) => c.state !== 'na')
  const done = applicable.filter((c) => c.state === 'done').length
  if (done === applicable.length) return 'done'
  return done > 0 ? 'progress' : 'todo'
}

export function buildAdequacyPath(input: PathInput): AdequacyPath {
  const { base, regimes, summary, documents, activities, vendors, sectors, actions, confirmations } = input
  const confirmationOf = (item: AdequacyItem) => confirmations.find((c) => c.item === item)
  const ropaCount = summary?.ropaActivityCount ?? activities.length

  function manual(
    id: string,
    item: AdequacyItem,
    label: string,
    manualLabel: string,
    hint: string,
    link?: { to: string; actionLabel: string },
  ): PathCheck {
    const confirmation = confirmationOf(item)
    return {
      id,
      label,
      state: confirmation ? 'done' : 'pending',
      hint,
      manualItem: item,
      manualLabel,
      confirmation,
      to: link?.to,
      actionLabel: link?.actionLabel,
    }
  }

  // ---- 3. Mapeamento
  const uncoveredSectors = sectors.filter((s) => !activities.some((a) => a.sectorId === s.id))

  // ---- 4. Bases legais
  const missingRetention = activities.filter((a) => !a.retentionPeriod?.trim()).length
  const retentionOverdue = summary?.retentionOverdueCount ?? 0
  const consentMissing = summary?.consentActivitiesMissingProof ?? 0

  // ---- 5. Documentos
  const sensitive = activities.filter((a) => a.involvesSensitiveData && !a.ripdSuggestionDismissed)
  const ripdApproved = isApproved(documents, 'RIPD_DPIA')

  // ---- 6. Fornecedores
  const withoutDpa = vendors.filter((v) => !v.dpaSigned)
  const transfers = vendors.filter((v) => v.involvesInternationalTransfer)
  const transfersWithoutSafeguard = transfers.filter((v) => !v.transferSafeguard)
  const noVendorsConfirmation = confirmationOf('SEM_FORNECEDORES')

  // ---- 7. Pessoas
  const employees = summary?.employeesActiveTotal ?? 0
  const untrained = employees - (summary?.employeesTrainedCount ?? 0)

  // ---- 9. Manutencao
  const toReview = documents.filter(
    (d) => d.reviewRecommended || (d.reviewDueAt && new Date(d.reviewDueAt) < new Date()),
  ).length
  const openActions = actions.filter((a) => a.status !== 'DONE').length

  const definitions: Omit<PathStage, 'number' | 'status'>[] = [
    {
      id: 'diagnostico',
      title: tr('Diagnóstico'),
      summary: tr('Descobrir o que falta'),
      why: tr('A lei cobra que a empresa consiga demonstrar as medidas que adota. Antes de agir, é preciso saber o ponto de partida.'),
      citations: [
        { regime: 'LGPD', reference: tr('Art. 6º, X'), about: tr('responsabilização e prestação de contas') },
        { regime: 'LGPD', reference: tr('Art. 50'), about: tr('boas práticas e governança') },
        { regime: 'RGPD', reference: tr('Art. 5.º, n.º 2'), about: tr('responsabilidade demonstrável') },
        { regime: 'RGPD', reference: tr('Art. 24.º'), about: tr('responsabilidade do responsável pelo tratamento') },
      ],
      guide: { label: tr('Evidências e monitoramento'), to: `${base}/pilares/evidencias-monitoramento` },
      checks: [
        {
          id: 'diagnostico',
          label: tr('Diagnóstico Inicial respondido'),
          state: confirmationOf('DIAGNOSTICO') ? 'done' : 'pending',
          hint: confirmationOf('DIAGNOSTICO')
            ? tr('As lacunas viraram tarefas no Plano de Ação.')
            : tr('Responda às perguntas. Cada lacuna vira uma tarefa no Plano de Ação.'),
          to: `${base}/pilares/diagnostico`,
          actionLabel: confirmationOf('DIAGNOSTICO') ? tr('Refazer') : tr('Fazer o diagnóstico'),
          confirmation: confirmationOf('DIAGNOSTICO'),
        },
      ],
    },
    {
      id: 'responsaveis',
      title: tr('Responsáveis'),
      summary: tr('Definir quem cuida do tema'),
      why: tr('Alguém precisa responder pelos dados pessoais da empresa e ser o contato de titulares e da autoridade. Sem responsável, o restante do trabalho se perde.'),
      citations: [
        { regime: 'LGPD', reference: tr('Art. 41'), about: tr('indicação do Encarregado') },
        { regime: 'LGPD', reference: tr('Art. 41, § 1º'), about: tr('identidade e contato divulgados publicamente') },
        { regime: 'LGPD', reference: tr('Resolução CD/ANPD 18/2024'), about: tr('regras de atuação do Encarregado') },
        { regime: 'LGPD', reference: tr('Resolução CD/ANPD 2/2022'), about: tr('tratamento simplificado para agentes de pequeno porte') },
        { regime: 'RGPD', reference: tr('Art. 37.º, n.º 1'), about: tr('casos em que a designação do encarregado é obrigatória') },
        { regime: 'RGPD', reference: tr('Art. 37.º, n.º 7'), about: tr('publicação dos contactos do encarregado') },
      ],
      guide: { label: tr('Quem é Quem'), to: `${base}/pilares/quem-e-quem` },
      checks: [
        {
          id: 'dpo',
          label: tr('Encarregado (DPO) designado'),
          state: summary?.dpoDesignated ? 'done' : 'pending',
          hint: summary?.dpoDesignated
            ? tr('{{a}} é o Encarregado.', { a: summary.dpoName })
            : regimes.includes('LGPD')
              ? tr('Atribua o papel em Usuários. Agentes de pequeno porte podem ser dispensados, mas precisam manter um canal com o titular.')
              : tr('Na RGPD, a designação é obrigatória nos casos do art. 37.º, n.º 1. Atribua o papel em Usuários.'),
          to: '/users',
          actionLabel: tr('Abrir Usuários'),
        },
        manual(
          'encarregado-publicado',
          'ENCARREGADO_PUBLICADO',
          tr('Contato do Encarregado divulgado'),
          tr('Confirmar divulgação'),
          tr('Nome e contato precisam estar acessíveis ao público, de preferência no site da empresa.'),
        ),
        manual(
          'comite',
          'COMITE',
          tr('Comitê de privacidade formado'),
          tr('Confirmar comitê'),
          tr('Boa prática, não exigência legal: representantes de cada setor acompanham o tema.'),
          { to: `${base}/pilares/comite`, actionLabel: tr('Como formar') },
        ),
      ],
    },
    {
      id: 'mapeamento',
      title: tr('Mapeamento'),
      summary: tr('Registrar quais dados a empresa trata'),
      why: tr('A empresa precisa manter registro das operações com dados pessoais. Esse inventário é a base de todas as etapas seguintes.'),
      citations: [
        { regime: 'LGPD', reference: tr('Art. 37'), about: tr('registro das operações de tratamento') },
        { regime: 'LGPD', reference: tr('Resolução CD/ANPD 2/2022'), about: tr('registro simplificado para agentes de pequeno porte') },
        { regime: 'RGPD', reference: tr('Art. 30.º'), about: tr('registos das atividades de tratamento') },
        { regime: 'RGPD', reference: tr('Art. 30.º, n.º 5'), about: tr('exceção condicionada para menos de 250 trabalhadores') },
      ],
      checks: [
        {
          id: 'setores',
          label: tr('Setores cadastrados'),
          state: sectors.length > 0 ? 'done' : 'pending',
          hint:
            sectors.length > 0
              ? trn(sectors.length, '{{n}} setor cadastrado.', '{{n}} setores cadastrados.')
              : tr('Cadastre os setores que lidam com dados pessoais.'),
          to: `${base}/pilares/setores`,
          actionLabel: tr('Abrir Setores'),
        },
        {
          id: 'ropa',
          label: tr('Atividades de tratamento registradas'),
          state: ropaCount > 0 ? 'done' : 'pending',
          hint:
            ropaCount > 0
              ? trn(ropaCount, '{{n}} atividade registrada.', '{{n}} atividades registradas.')
              : tr('Registre cada processo que usa dados pessoais.'),
          to: `${base}/pilares/ropa`,
          actionLabel: tr('Abrir Inventário'),
        },
        {
          id: 'cobertura',
          label: tr('Todos os setores têm atividades'),
          state: sectors.length === 0 ? 'na' : uncoveredSectors.length === 0 ? 'done' : 'pending',
          hint:
            uncoveredSectors.length === 0
              ? tr('Cada setor tem ao menos uma atividade.')
              : tr('Sem atividade: {{a}}.', { a: uncoveredSectors.map((s) => s.name).join(', ') }),
          to: `${base}/pilares/ropa`,
          actionLabel: tr('Abrir Inventário'),
        },
      ],
    },
    {
      id: 'bases-legais',
      title: tr('Bases legais'),
      summary: tr('Justificar cada uso e definir prazos'),
      why: tr('Todo uso de dado pessoal precisa de fundamento legal e não pode durar para sempre. Quando o fundamento é o consentimento, a empresa precisa conseguir prová-lo.'),
      citations: [
        { regime: 'LGPD', reference: tr('Arts. 7º e 11'), about: tr('hipóteses de tratamento, inclusive de dados sensíveis') },
        { regime: 'LGPD', reference: tr('Art. 8º'), about: tr('consentimento e ônus da prova') },
        { regime: 'LGPD', reference: tr('Arts. 15 e 16'), about: tr('término do tratamento e eliminação') },
        { regime: 'RGPD', reference: tr('Arts. 6.º e 9.º'), about: tr('licitude e categorias especiais de dados') },
        { regime: 'RGPD', reference: tr('Art. 7.º'), about: tr('condições aplicáveis ao consentimento') },
        { regime: 'RGPD', reference: tr('Art. 5.º, n.º 1, al. e)'), about: tr('limitação da conservação') },
      ],
      guide: { label: tr('Base Legal'), to: `${base}/pilares/base-legal` },
      checks: [
        {
          id: 'base-legal',
          label: tr('Base legal definida em cada atividade'),
          state: activities.length > 0 ? 'done' : 'pending',
          hint:
            activities.length > 0
              ? trn(activities.length, '{{n}} atividade com hipótese legal.', '{{n}} atividades com hipótese legal.')
              : tr('Depende do inventário: cada atividade registrada tem sua hipótese legal.'),
          to: `${base}/pilares/ropa`,
          actionLabel: tr('Abrir Inventário'),
        },
        {
          id: 'retencao',
          label: tr('Prazo de guarda em cada atividade'),
          state: activities.length > 0 && missingRetention === 0 ? 'done' : 'pending',
          hint:
            activities.length === 0
              ? tr('Depende do inventário.')
              : missingRetention === 0
                ? tr('Todas as atividades têm prazo de guarda.')
                : trn(missingRetention, '{{n}} atividade sem prazo de guarda.', '{{n}} atividades sem prazo de guarda.'),
          to: `${base}/pilares/ropa`,
          actionLabel: tr('Abrir Inventário'),
        },
        {
          id: 'retencao-vencida',
          label: tr('Nenhum prazo de guarda vencido'),
          state: activities.length === 0 ? 'na' : retentionOverdue === 0 ? 'done' : 'pending',
          hint:
            retentionOverdue === 0
              ? tr('Nenhum prazo vencido.')
              : trn(retentionOverdue, '{{n}} atividade com prazo vencido.', '{{n}} atividades com prazo vencido.'),
          to: `${base}/pilares/ropa`,
          actionLabel: tr('Abrir Inventário'),
        },
        {
          id: 'consentimento',
          label: tr('Prova de consentimento coletada'),
          state: !summary?.consentActivitiesTotal ? 'na' : consentMissing === 0 ? 'done' : 'pending',
          hint: !summary?.consentActivitiesTotal
            ? tr('Nenhuma atividade usa consentimento.')
            : consentMissing === 0
              ? tr('Todas as atividades com consentimento têm prova.')
              : trn(consentMissing, '{{n}} atividade sem prova coletada.', '{{n}} atividades sem prova coletada.'),
          to: `${base}/pilares/ropa`,
          actionLabel: tr('Abrir Inventário'),
        },
      ],
    },
    {
      id: 'documentos',
      title: tr('Documentos'),
      summary: tr('Formalizar o que a empresa faz'),
      why: tr('O titular tem direito a informações claras, a segurança precisa ser organizada e tratamentos de maior risco pedem avaliação de impacto.'),
      citations: [
        { regime: 'LGPD', reference: tr('Art. 9º'), about: tr('acesso facilitado às informações do tratamento') },
        { regime: 'LGPD', reference: tr('Arts. 10, § 3º, e 38'), about: tr('relatório de impacto, quando a ANPD determinar') },
        { regime: 'LGPD', reference: tr('Art. 46'), about: tr('medidas de segurança') },
        { regime: 'RGPD', reference: tr('Arts. 13.º e 14.º'), about: tr('informações a facultar ao titular') },
        { regime: 'RGPD', reference: tr('Art. 32.º'), about: tr('segurança do tratamento') },
        { regime: 'RGPD', reference: tr('Art. 35.º'), about: tr('avaliação de impacto, obrigatória em tratamento de elevado risco') },
      ],
      guide: { label: tr('Retenção e Descarte'), to: `${base}/pilares/retencao-descarte` },
      checks: [
        {
          id: 'politica',
          label: tr('Política de Privacidade publicada'),
          state: summary?.privacyPolicyPublished ? 'done' : 'pending',
          hint: summary?.privacyPolicyPublished
            ? tr('Disponível no link público.')
            : tr('Gere, aprove e publique o documento.'),
          to: `${base}/documents?tipo=POLITICA_PRIVACIDADE`,
          actionLabel: tr('Abrir Documentos'),
        },
        {
          id: 'psi',
          label: tr('Política de Segurança da Informação aprovada'),
          state: isApproved(documents, 'POLITICA_SEGURANCA_INFORMACAO') ? 'done' : 'pending',
          hint: isApproved(documents, 'POLITICA_SEGURANCA_INFORMACAO')
            ? tr('Documento aprovado.')
            : tr('Gere e aprove o documento.'),
          to: `${base}/documents?tipo=POLITICA_SEGURANCA_INFORMACAO`,
          actionLabel: tr('Abrir Documentos'),
        },
        {
          id: 'ripd',
          label: tr('RIPD/DPIA aprovado'),
          state: sensitive.length === 0 ? 'na' : ripdApproved ? 'done' : 'pending',
          hint:
            sensitive.length === 0
              ? tr('Nenhuma atividade com dados sensíveis aberta para este relatório.')
              : ripdApproved
                ? tr('Relatório aprovado.')
                : trn(sensitive.length, '{{n}} atividade envolve dados sensíveis. Recomendamos preparar o relatório antes que seja exigido.', '{{n}} atividades envolvem dados sensíveis. Recomendamos preparar o relatório antes que seja exigido.'),
          to: `${base}/documents?tipo=RIPD_DPIA`,
          actionLabel: tr('Abrir Documentos'),
        },
      ],
    },
    {
      id: 'fornecedores',
      title: tr('Fornecedores'),
      summary: tr('Controlar quem trata dados por você'),
      why: tr('Quem trata dados em nome da empresa precisa seguir suas instruções, e enviar dados para outro país exige uma garantia prevista em lei.'),
      citations: [
        { regime: 'LGPD', reference: tr('Art. 39'), about: tr('operador segue as instruções do controlador') },
        { regime: 'LGPD', reference: tr('Art. 33'), about: tr('transferência internacional') },
        { regime: 'LGPD', reference: tr('Resolução CD/ANPD 19/2024'), about: tr('regulamento e cláusulas-padrão de transferência') },
        { regime: 'RGPD', reference: tr('Art. 28.º'), about: tr('contrato com o subcontratante') },
        { regime: 'RGPD', reference: tr('Arts. 44.º a 49.º'), about: tr('transferências para países terceiros') },
      ],
      checks: [
        vendors.length > 0
          ? {
              id: 'fornecedores',
              label: tr('Fornecedores cadastrados'),
              state: 'done',
              hint: trn(vendors.length, '{{n}} fornecedor cadastrado.', '{{n}} fornecedores cadastrados.'),
              to: `${base}/pilares/fornecedores`,
              actionLabel: tr('Abrir Fornecedores'),
            }
          : manual(
              'fornecedores',
              'SEM_FORNECEDORES',
              tr('Fornecedores cadastrados'),
              tr('Não temos fornecedores que tratam dados'),
              noVendorsConfirmation
                ? tr('A empresa declarou não ter fornecedores que tratam dados.')
                : tr('Cadastre nuvem, folha, ferramentas de IA e outros que recebem dados.'),
              { to: `${base}/pilares/fornecedores`, actionLabel: tr('Abrir Fornecedores') },
            ),
        {
          id: 'dpa',
          label: tr('Contrato (DPA) assinado com todos'),
          state: vendors.length === 0 ? 'na' : withoutDpa.length === 0 ? 'done' : 'pending',
          hint:
            vendors.length === 0
              ? tr('Nenhum fornecedor cadastrado.')
              : withoutDpa.length === 0
                ? tr('Todos têm DPA assinado.')
                : tr('Sem DPA: {{a}}.', { a: withoutDpa.map((v) => v.name).join(', ') }),
          to: `${base}/pilares/fornecedores`,
          actionLabel: tr('Abrir Fornecedores'),
        },
        {
          id: 'transferencia',
          label: tr('Garantia para transferência internacional'),
          state: transfers.length === 0 ? 'na' : transfersWithoutSafeguard.length === 0 ? 'done' : 'pending',
          hint:
            transfers.length === 0
              ? tr('Nenhum fornecedor envia dados para fora do país.')
              : transfersWithoutSafeguard.length === 0
                ? tr('Todas as transferências têm garantia registrada.')
                : tr('Sem garantia: {{a}}.', { a: transfersWithoutSafeguard.map((v) => v.name).join(', ') }),
          to: `${base}/pilares/fornecedores`,
          actionLabel: tr('Abrir Fornecedores'),
        },
      ],
    },
    {
      id: 'pessoas',
      title: tr('Pessoas'),
      summary: tr('Preparar a equipe'),
      why: tr('Quem lida com dados no dia a dia precisa saber o que fazer. Orientar funcionários e contratados faz parte das atribuições do Encarregado.'),
      citations: [
        { regime: 'LGPD', reference: tr('Art. 41, § 2º, III'), about: tr('orientar funcionários e contratados') },
        { regime: 'RGPD', reference: tr('Art. 39.º, n.º 1, al. b)'), about: tr('sensibilização e formação do pessoal') },
      ],
      checks: [
        {
          id: 'colaboradores',
          label: tr('Colaboradores cadastrados'),
          state: employees > 0 ? 'done' : 'pending',
          hint:
            employees > 0
              ? trn(employees, '{{n}} colaborador ativo.', '{{n}} colaboradores ativos.')
              : tr('Cadastre a equipe para registrar os treinamentos.'),
          to: `${base}/pilares/treinamento/colaboradores`,
          actionLabel: tr('Abrir Colaboradores'),
        },
        {
          id: 'treinamento',
          label: tr('Equipe treinada'),
          state: employees === 0 ? 'na' : untrained === 0 ? 'done' : 'pending',
          hint:
            employees === 0
              ? tr('Depende do cadastro de colaboradores.')
              : untrained === 0
                ? tr('Todos os colaboradores foram treinados.')
                : trn(untrained, '{{n}} colaborador sem treinamento.', '{{n}} colaboradores sem treinamento.'),
          to: `${base}/pilares/treinamento`,
          actionLabel: tr('Abrir Treinamento'),
        },
      ],
    },
    {
      id: 'atendimento',
      title: tr('Atendimento'),
      summary: tr('Responder titulares e incidentes'),
      why: tr('Titulares podem exercer direitos sobre seus dados, com prazo de resposta. Incidentes de risco relevante precisam ser comunicados à autoridade e, conforme o caso, às pessoas afetadas.'),
      citations: [
        { regime: 'LGPD', reference: tr('Arts. 18 e 19'), about: tr('direitos do titular; declaração completa em até 15 dias') },
        { regime: 'LGPD', reference: tr('Art. 48'), about: tr('comunicação de incidente de segurança') },
        { regime: 'LGPD', reference: tr('Resolução CD/ANPD 15/2024'), about: tr('comunicação à ANPD e ao titular em três dias úteis') },
        { regime: 'RGPD', reference: tr('Arts. 12.º a 22.º'), about: tr('direitos do titular; resposta em até um mês, prorrogável') },
        { regime: 'RGPD', reference: tr('Art. 33.º'), about: tr('notificação à autoridade de controlo em 72 horas, sempre que possível') },
        { regime: 'RGPD', reference: tr('Art. 34.º'), about: tr('comunicação ao titular, sem demora injustificada, em caso de elevado risco') },
      ],
      checks: [
        manual(
          'canal',
          'CANAL_TITULAR',
          tr('Canal do titular divulgado'),
          tr('Confirmar divulgação'),
          tr('O sistema já tem um portal público. Divulgue o link ou o QR code onde o titular consiga encontrar.'),
          { to: `${base}/data-subject-requests`, actionLabel: tr('Ver link público') },
        ),
        {
          id: 'solicitacoes',
          label: tr('Nenhuma solicitação pendente'),
          state: summary && summary.dsrPendingCount === 0 ? 'done' : 'pending',
          hint:
            summary && summary.dsrPendingCount === 0
              ? tr('Nenhuma solicitação aguardando resposta.')
              : trn(summary?.dsrPendingCount ?? 0, '{{n}} solicitação aguardando resposta.', '{{n}} solicitações aguardando resposta.'),
          to: `${base}/data-subject-requests`,
          actionLabel: tr('Abrir Solicitações'),
        },
        manual(
          'plano-incidentes',
          'PLANO_INCIDENTES',
          tr('Equipe sabe como agir em um incidente'),
          tr('Confirmar procedimento'),
          tr('Defina quem avalia, quem comunica e como registrar um incidente no sistema.'),
          { to: `${base}/incidents`, actionLabel: tr('Abrir Incidentes') },
        ),
        {
          id: 'prazo-incidentes',
          label: tr('Nenhuma comunicação de incidente atrasada'),
          state: summary && summary.incidentNotificationOverdueCount === 0 ? 'done' : 'pending',
          hint:
            summary && summary.incidentNotificationOverdueCount === 0
              ? tr('Nenhum prazo vencido.')
              : trn(summary?.incidentNotificationOverdueCount ?? 0, '{{n}} incidente com prazo vencido.', '{{n}} incidentes com prazo vencido.'),
          to: `${base}/incidents`,
          actionLabel: tr('Abrir Incidentes'),
        },
      ],
    },
    {
      id: 'manutencao',
      title: tr('Manutenção'),
      summary: tr('Manter tudo em dia'),
      why: tr('Adequação não termina: documentos envelhecem, processos mudam e a empresa precisa continuar demonstrando o que faz.'),
      citations: [
        { regime: 'LGPD', reference: tr('Art. 6º, X'), about: tr('responsabilização e prestação de contas') },
        { regime: 'LGPD', reference: tr('Art. 50'), about: tr('programa de governança') },
        { regime: 'RGPD', reference: tr('Art. 5.º, n.º 2'), about: tr('responsabilidade demonstrável') },
        { regime: 'RGPD', reference: tr('Art. 24.º, n.º 1'), about: tr('medidas revistas e atualizadas sempre que necessário') },
      ],
      guide: { label: tr('Evidências e monitoramento'), to: `${base}/pilares/evidencias-monitoramento` },
      checks: [
        {
          id: 'revisoes',
          label: tr('Documentos com revisão em dia'),
          state: documents.length > 0 && toReview === 0 ? 'done' : 'pending',
          hint:
            documents.length === 0
              ? tr('Depende dos documentos.')
              : toReview === 0
                ? tr('Nenhum documento pede revisão.')
                : trn(toReview, '{{n}} documento precisa de revisão.', '{{n}} documentos precisam de revisão.'),
          to: `${base}/documents?atencao=1`,
          actionLabel: tr('Abrir Documentos'),
        },
        {
          id: 'plano-acao',
          label: tr('Plano de Ação concluído'),
          state: openActions === 0 ? 'done' : 'pending',
          hint:
            openActions === 0
              ? tr('Nenhuma tarefa aberta.')
              : trn(openActions, '{{n}} tarefa aberta.', '{{n}} tarefas abertas.'),
          to: `${base}/action-plan`,
          actionLabel: tr('Abrir Plano de Ação'),
        },
        manual(
          'revisao-periodica',
          'REVISAO_PERIODICA',
          tr('Revisão periódica definida'),
          tr('Confirmar rotina'),
          tr('Defina quem revisa este caminho e a trilha de auditoria, e com que frequência.'),
        ),
      ],
    },
  ]

  const stages: PathStage[] = definitions.map((definition, index) => ({
    ...definition,
    citations: definition.citations.filter((c) => regimes.includes(c.regime)),
    number: index + 1,
    status: statusOf(definition.checks),
  }))

  const applicable = stages.flatMap((s) => s.checks).filter((c) => c.state !== 'na')
  const doneCount = applicable.filter((c) => c.state === 'done').length

  return {
    stages,
    doneCount,
    totalCount: applicable.length,
    percent: applicable.length ? Math.round((doneCount / applicable.length) * 100) : 0,
    nextStage: stages.find((s) => s.status !== 'done') ?? null,
  }
}
