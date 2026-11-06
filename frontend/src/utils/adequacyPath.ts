import type { ActionItem } from '../types/actionItem'
import type { AdequacyConfirmation, AdequacyItem } from '../types/adequacy'
import type { ComplianceSummary } from '../types/complianceSummary'
import type { Document, DocumentType } from '../types/document'
import type { ProcessingActivity } from '../types/processingActivity'
import type { Sector } from '../types/sector'
import type { Vendor } from '../types/vendor'

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

function plural(count: number, one: string, many: string) {
  return `${count} ${count === 1 ? one : many}`
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
      title: 'Diagnóstico',
      summary: 'Descobrir o que falta',
      why: 'A lei cobra que a empresa consiga demonstrar as medidas que adota. Antes de agir, é preciso saber o ponto de partida.',
      citations: [
        { regime: 'LGPD', reference: 'Art. 6º, X', about: 'responsabilização e prestação de contas' },
        { regime: 'LGPD', reference: 'Art. 50', about: 'boas práticas e governança' },
        { regime: 'RGPD', reference: 'Art. 5.º, n.º 2', about: 'responsabilidade demonstrável' },
        { regime: 'RGPD', reference: 'Art. 24.º', about: 'responsabilidade do responsável pelo tratamento' },
      ],
      guide: { label: 'Evidências e monitoramento', to: `${base}/pilares/evidencias-monitoramento` },
      checks: [
        {
          id: 'diagnostico',
          label: 'Diagnóstico Inicial respondido',
          state: confirmationOf('DIAGNOSTICO') ? 'done' : 'pending',
          hint: confirmationOf('DIAGNOSTICO')
            ? 'As lacunas viraram tarefas no Plano de Ação.'
            : 'Responda às perguntas. Cada lacuna vira uma tarefa no Plano de Ação.',
          to: `${base}/pilares/diagnostico`,
          actionLabel: confirmationOf('DIAGNOSTICO') ? 'Refazer' : 'Fazer o diagnóstico',
          confirmation: confirmationOf('DIAGNOSTICO'),
        },
      ],
    },
    {
      id: 'responsaveis',
      title: 'Responsáveis',
      summary: 'Definir quem cuida do tema',
      why: 'Alguém precisa responder pelos dados pessoais da empresa e ser o contato de titulares e da autoridade. Sem responsável, o restante do trabalho se perde.',
      citations: [
        { regime: 'LGPD', reference: 'Art. 41', about: 'indicação do Encarregado' },
        { regime: 'LGPD', reference: 'Art. 41, § 1º', about: 'identidade e contato divulgados publicamente' },
        { regime: 'LGPD', reference: 'Resolução CD/ANPD 18/2024', about: 'regras de atuação do Encarregado' },
        { regime: 'LGPD', reference: 'Resolução CD/ANPD 2/2022', about: 'tratamento simplificado para agentes de pequeno porte' },
        { regime: 'RGPD', reference: 'Art. 37.º, n.º 1', about: 'casos em que a designação do encarregado é obrigatória' },
        { regime: 'RGPD', reference: 'Art. 37.º, n.º 7', about: 'publicação dos contactos do encarregado' },
      ],
      guide: { label: 'Quem é Quem', to: `${base}/pilares/quem-e-quem` },
      checks: [
        {
          id: 'dpo',
          label: 'Encarregado (DPO) designado',
          state: summary?.dpoDesignated ? 'done' : 'pending',
          hint: summary?.dpoDesignated
            ? `${summary.dpoName} é o Encarregado.`
            : regimes.includes('LGPD')
              ? 'Atribua o papel em Usuários. Agentes de pequeno porte podem ser dispensados, mas precisam manter um canal com o titular.'
              : 'Na RGPD, a designação é obrigatória nos casos do art. 37.º, n.º 1. Atribua o papel em Usuários.',
          to: '/users',
          actionLabel: 'Abrir Usuários',
        },
        manual(
          'encarregado-publicado',
          'ENCARREGADO_PUBLICADO',
          'Contato do Encarregado divulgado',
          'Confirmar divulgação',
          'Nome e contato precisam estar acessíveis ao público, de preferência no site da empresa.',
        ),
        manual(
          'comite',
          'COMITE',
          'Comitê de privacidade formado',
          'Confirmar comitê',
          'Boa prática, não exigência legal: representantes de cada setor acompanham o tema.',
          { to: `${base}/pilares/comite`, actionLabel: 'Como formar' },
        ),
      ],
    },
    {
      id: 'mapeamento',
      title: 'Mapeamento',
      summary: 'Registrar quais dados a empresa trata',
      why: 'A empresa precisa manter registro das operações com dados pessoais. Esse inventário é a base de todas as etapas seguintes.',
      citations: [
        { regime: 'LGPD', reference: 'Art. 37', about: 'registro das operações de tratamento' },
        { regime: 'LGPD', reference: 'Resolução CD/ANPD 2/2022', about: 'registro simplificado para agentes de pequeno porte' },
        { regime: 'RGPD', reference: 'Art. 30.º', about: 'registos das atividades de tratamento' },
        { regime: 'RGPD', reference: 'Art. 30.º, n.º 5', about: 'exceção condicionada para menos de 250 trabalhadores' },
      ],
      checks: [
        {
          id: 'setores',
          label: 'Setores cadastrados',
          state: sectors.length > 0 ? 'done' : 'pending',
          hint:
            sectors.length > 0
              ? `${plural(sectors.length, 'setor cadastrado', 'setores cadastrados')}.`
              : 'Cadastre os setores que lidam com dados pessoais.',
          to: `${base}/pilares/setores`,
          actionLabel: 'Abrir Setores',
        },
        {
          id: 'ropa',
          label: 'Atividades de tratamento registradas',
          state: ropaCount > 0 ? 'done' : 'pending',
          hint:
            ropaCount > 0
              ? `${plural(ropaCount, 'atividade registrada', 'atividades registradas')}.`
              : 'Registre cada processo que usa dados pessoais.',
          to: `${base}/pilares/ropa`,
          actionLabel: 'Abrir Inventário',
        },
        {
          id: 'cobertura',
          label: 'Todos os setores têm atividades',
          state: sectors.length === 0 ? 'na' : uncoveredSectors.length === 0 ? 'done' : 'pending',
          hint:
            uncoveredSectors.length === 0
              ? 'Cada setor tem ao menos uma atividade.'
              : `Sem atividade: ${uncoveredSectors.map((s) => s.name).join(', ')}.`,
          to: `${base}/pilares/ropa`,
          actionLabel: 'Abrir Inventário',
        },
      ],
    },
    {
      id: 'bases-legais',
      title: 'Bases legais',
      summary: 'Justificar cada uso e definir prazos',
      why: 'Todo uso de dado pessoal precisa de fundamento legal e não pode durar para sempre. Quando o fundamento é o consentimento, a empresa precisa conseguir prová-lo.',
      citations: [
        { regime: 'LGPD', reference: 'Arts. 7º e 11', about: 'hipóteses de tratamento, inclusive de dados sensíveis' },
        { regime: 'LGPD', reference: 'Art. 8º', about: 'consentimento e ônus da prova' },
        { regime: 'LGPD', reference: 'Arts. 15 e 16', about: 'término do tratamento e eliminação' },
        { regime: 'RGPD', reference: 'Arts. 6.º e 9.º', about: 'licitude e categorias especiais de dados' },
        { regime: 'RGPD', reference: 'Art. 7.º', about: 'condições aplicáveis ao consentimento' },
        { regime: 'RGPD', reference: 'Art. 5.º, n.º 1, al. e)', about: 'limitação da conservação' },
      ],
      guide: { label: 'Base Legal', to: `${base}/pilares/base-legal` },
      checks: [
        {
          id: 'base-legal',
          label: 'Base legal definida em cada atividade',
          state: activities.length > 0 ? 'done' : 'pending',
          hint:
            activities.length > 0
              ? `${plural(activities.length, 'atividade', 'atividades')} com hipótese legal.`
              : 'Depende do inventário: cada atividade registrada tem sua hipótese legal.',
          to: `${base}/pilares/ropa`,
          actionLabel: 'Abrir Inventário',
        },
        {
          id: 'retencao',
          label: 'Prazo de guarda em cada atividade',
          state: activities.length > 0 && missingRetention === 0 ? 'done' : 'pending',
          hint:
            activities.length === 0
              ? 'Depende do inventário.'
              : missingRetention === 0
                ? 'Todas as atividades têm prazo de guarda.'
                : `${plural(missingRetention, 'atividade', 'atividades')} sem prazo de guarda.`,
          to: `${base}/pilares/ropa`,
          actionLabel: 'Abrir Inventário',
        },
        {
          id: 'retencao-vencida',
          label: 'Nenhum prazo de guarda vencido',
          state: activities.length === 0 ? 'na' : retentionOverdue === 0 ? 'done' : 'pending',
          hint:
            retentionOverdue === 0
              ? 'Nenhum prazo vencido.'
              : `${plural(retentionOverdue, 'atividade', 'atividades')} com prazo vencido.`,
          to: `${base}/pilares/ropa`,
          actionLabel: 'Abrir Inventário',
        },
        {
          id: 'consentimento',
          label: 'Prova de consentimento coletada',
          state: !summary?.consentActivitiesTotal ? 'na' : consentMissing === 0 ? 'done' : 'pending',
          hint: !summary?.consentActivitiesTotal
            ? 'Nenhuma atividade usa consentimento.'
            : consentMissing === 0
              ? 'Todas as atividades com consentimento têm prova.'
              : `${plural(consentMissing, 'atividade', 'atividades')} sem prova coletada.`,
          to: `${base}/pilares/ropa`,
          actionLabel: 'Abrir Inventário',
        },
      ],
    },
    {
      id: 'documentos',
      title: 'Documentos',
      summary: 'Formalizar o que a empresa faz',
      why: 'O titular tem direito a informações claras, a segurança precisa ser organizada e tratamentos de maior risco pedem avaliação de impacto.',
      citations: [
        { regime: 'LGPD', reference: 'Art. 9º', about: 'acesso facilitado às informações do tratamento' },
        { regime: 'LGPD', reference: 'Arts. 10, § 3º, e 38', about: 'relatório de impacto, quando a ANPD determinar' },
        { regime: 'LGPD', reference: 'Art. 46', about: 'medidas de segurança' },
        { regime: 'RGPD', reference: 'Arts. 13.º e 14.º', about: 'informações a facultar ao titular' },
        { regime: 'RGPD', reference: 'Art. 32.º', about: 'segurança do tratamento' },
        { regime: 'RGPD', reference: 'Art. 35.º', about: 'avaliação de impacto, obrigatória em tratamento de elevado risco' },
      ],
      guide: { label: 'Retenção e Descarte', to: `${base}/pilares/retencao-descarte` },
      checks: [
        {
          id: 'politica',
          label: 'Política de Privacidade publicada',
          state: summary?.privacyPolicyPublished ? 'done' : 'pending',
          hint: summary?.privacyPolicyPublished
            ? 'Disponível no link público.'
            : 'Gere, aprove e publique o documento.',
          to: `${base}/documents?tipo=POLITICA_PRIVACIDADE`,
          actionLabel: 'Abrir Documentos',
        },
        {
          id: 'psi',
          label: 'Política de Segurança da Informação aprovada',
          state: isApproved(documents, 'POLITICA_SEGURANCA_INFORMACAO') ? 'done' : 'pending',
          hint: isApproved(documents, 'POLITICA_SEGURANCA_INFORMACAO')
            ? 'Documento aprovado.'
            : 'Gere e aprove o documento.',
          to: `${base}/documents?tipo=POLITICA_SEGURANCA_INFORMACAO`,
          actionLabel: 'Abrir Documentos',
        },
        {
          id: 'ripd',
          label: 'RIPD/DPIA aprovado',
          state: sensitive.length === 0 ? 'na' : ripdApproved ? 'done' : 'pending',
          hint:
            sensitive.length === 0
              ? 'Nenhuma atividade com dados sensíveis aberta para este relatório.'
              : ripdApproved
                ? 'Relatório aprovado.'
                : `${plural(sensitive.length, 'atividade envolve', 'atividades envolvem')} dados sensíveis. Recomendamos preparar o relatório antes que seja exigido.`,
          to: `${base}/documents?tipo=RIPD_DPIA`,
          actionLabel: 'Abrir Documentos',
        },
      ],
    },
    {
      id: 'fornecedores',
      title: 'Fornecedores',
      summary: 'Controlar quem trata dados por você',
      why: 'Quem trata dados em nome da empresa precisa seguir suas instruções, e enviar dados para outro país exige uma garantia prevista em lei.',
      citations: [
        { regime: 'LGPD', reference: 'Art. 39', about: 'operador segue as instruções do controlador' },
        { regime: 'LGPD', reference: 'Art. 33', about: 'transferência internacional' },
        { regime: 'LGPD', reference: 'Resolução CD/ANPD 19/2024', about: 'regulamento e cláusulas-padrão de transferência' },
        { regime: 'RGPD', reference: 'Art. 28.º', about: 'contrato com o subcontratante' },
        { regime: 'RGPD', reference: 'Arts. 44.º a 49.º', about: 'transferências para países terceiros' },
      ],
      checks: [
        vendors.length > 0
          ? {
              id: 'fornecedores',
              label: 'Fornecedores cadastrados',
              state: 'done',
              hint: `${plural(vendors.length, 'fornecedor cadastrado', 'fornecedores cadastrados')}.`,
              to: `${base}/pilares/fornecedores`,
              actionLabel: 'Abrir Fornecedores',
            }
          : manual(
              'fornecedores',
              'SEM_FORNECEDORES',
              'Fornecedores cadastrados',
              'Não temos fornecedores que tratam dados',
              noVendorsConfirmation
                ? 'A empresa declarou não ter fornecedores que tratam dados.'
                : 'Cadastre nuvem, folha, ferramentas de IA e outros que recebem dados.',
              { to: `${base}/pilares/fornecedores`, actionLabel: 'Abrir Fornecedores' },
            ),
        {
          id: 'dpa',
          label: 'Contrato (DPA) assinado com todos',
          state: vendors.length === 0 ? 'na' : withoutDpa.length === 0 ? 'done' : 'pending',
          hint:
            vendors.length === 0
              ? 'Nenhum fornecedor cadastrado.'
              : withoutDpa.length === 0
                ? 'Todos têm DPA assinado.'
                : `Sem DPA: ${withoutDpa.map((v) => v.name).join(', ')}.`,
          to: `${base}/pilares/fornecedores`,
          actionLabel: 'Abrir Fornecedores',
        },
        {
          id: 'transferencia',
          label: 'Garantia para transferência internacional',
          state: transfers.length === 0 ? 'na' : transfersWithoutSafeguard.length === 0 ? 'done' : 'pending',
          hint:
            transfers.length === 0
              ? 'Nenhum fornecedor envia dados para fora do país.'
              : transfersWithoutSafeguard.length === 0
                ? 'Todas as transferências têm garantia registrada.'
                : `Sem garantia: ${transfersWithoutSafeguard.map((v) => v.name).join(', ')}.`,
          to: `${base}/pilares/fornecedores`,
          actionLabel: 'Abrir Fornecedores',
        },
      ],
    },
    {
      id: 'pessoas',
      title: 'Pessoas',
      summary: 'Preparar a equipe',
      why: 'Quem lida com dados no dia a dia precisa saber o que fazer. Orientar funcionários e contratados faz parte das atribuições do Encarregado.',
      citations: [
        { regime: 'LGPD', reference: 'Art. 41, § 2º, III', about: 'orientar funcionários e contratados' },
        { regime: 'RGPD', reference: 'Art. 39.º, n.º 1, al. b)', about: 'sensibilização e formação do pessoal' },
      ],
      checks: [
        {
          id: 'colaboradores',
          label: 'Colaboradores cadastrados',
          state: employees > 0 ? 'done' : 'pending',
          hint:
            employees > 0
              ? `${plural(employees, 'colaborador ativo', 'colaboradores ativos')}.`
              : 'Cadastre a equipe para registrar os treinamentos.',
          to: `${base}/pilares/treinamento/colaboradores`,
          actionLabel: 'Abrir Colaboradores',
        },
        {
          id: 'treinamento',
          label: 'Equipe treinada',
          state: employees === 0 ? 'na' : untrained === 0 ? 'done' : 'pending',
          hint:
            employees === 0
              ? 'Depende do cadastro de colaboradores.'
              : untrained === 0
                ? 'Todos os colaboradores foram treinados.'
                : `${plural(untrained, 'colaborador', 'colaboradores')} sem treinamento.`,
          to: `${base}/pilares/treinamento`,
          actionLabel: 'Abrir Treinamento',
        },
      ],
    },
    {
      id: 'atendimento',
      title: 'Atendimento',
      summary: 'Responder titulares e incidentes',
      why: 'Titulares podem exercer direitos sobre seus dados, com prazo de resposta. Incidentes de risco relevante precisam ser comunicados à autoridade e, conforme o caso, às pessoas afetadas.',
      citations: [
        { regime: 'LGPD', reference: 'Arts. 18 e 19', about: 'direitos do titular; declaração completa em até 15 dias' },
        { regime: 'LGPD', reference: 'Art. 48', about: 'comunicação de incidente de segurança' },
        { regime: 'LGPD', reference: 'Resolução CD/ANPD 15/2024', about: 'comunicação à ANPD e ao titular em três dias úteis' },
        { regime: 'RGPD', reference: 'Arts. 12.º a 22.º', about: 'direitos do titular; resposta em até um mês, prorrogável' },
        { regime: 'RGPD', reference: 'Art. 33.º', about: 'notificação à autoridade de controlo em 72 horas, sempre que possível' },
        { regime: 'RGPD', reference: 'Art. 34.º', about: 'comunicação ao titular, sem demora injustificada, em caso de elevado risco' },
      ],
      checks: [
        manual(
          'canal',
          'CANAL_TITULAR',
          'Canal do titular divulgado',
          'Confirmar divulgação',
          'O sistema já tem um portal público. Divulgue o link ou o QR code onde o titular consiga encontrar.',
          { to: `${base}/data-subject-requests`, actionLabel: 'Ver link público' },
        ),
        {
          id: 'solicitacoes',
          label: 'Nenhuma solicitação pendente',
          state: summary && summary.dsrPendingCount === 0 ? 'done' : 'pending',
          hint:
            summary && summary.dsrPendingCount === 0
              ? 'Nenhuma solicitação aguardando resposta.'
              : `${plural(summary?.dsrPendingCount ?? 0, 'solicitação aguardando', 'solicitações aguardando')} resposta.`,
          to: `${base}/data-subject-requests`,
          actionLabel: 'Abrir Solicitações',
        },
        manual(
          'plano-incidentes',
          'PLANO_INCIDENTES',
          'Equipe sabe como agir em um incidente',
          'Confirmar procedimento',
          'Defina quem avalia, quem comunica e como registrar um incidente no sistema.',
          { to: `${base}/incidents`, actionLabel: 'Abrir Incidentes' },
        ),
        {
          id: 'prazo-incidentes',
          label: 'Nenhuma comunicação de incidente atrasada',
          state: summary && summary.incidentNotificationOverdueCount === 0 ? 'done' : 'pending',
          hint:
            summary && summary.incidentNotificationOverdueCount === 0
              ? 'Nenhum prazo vencido.'
              : `${plural(summary?.incidentNotificationOverdueCount ?? 0, 'incidente', 'incidentes')} com prazo vencido.`,
          to: `${base}/incidents`,
          actionLabel: 'Abrir Incidentes',
        },
      ],
    },
    {
      id: 'manutencao',
      title: 'Manutenção',
      summary: 'Manter tudo em dia',
      why: 'Adequação não termina: documentos envelhecem, processos mudam e a empresa precisa continuar demonstrando o que faz.',
      citations: [
        { regime: 'LGPD', reference: 'Art. 6º, X', about: 'responsabilização e prestação de contas' },
        { regime: 'LGPD', reference: 'Art. 50', about: 'programa de governança' },
        { regime: 'RGPD', reference: 'Art. 5.º, n.º 2', about: 'responsabilidade demonstrável' },
        { regime: 'RGPD', reference: 'Art. 24.º, n.º 1', about: 'medidas revistas e atualizadas sempre que necessário' },
      ],
      guide: { label: 'Evidências e monitoramento', to: `${base}/pilares/evidencias-monitoramento` },
      checks: [
        {
          id: 'revisoes',
          label: 'Documentos com revisão em dia',
          state: documents.length > 0 && toReview === 0 ? 'done' : 'pending',
          hint:
            documents.length === 0
              ? 'Depende dos documentos.'
              : toReview === 0
                ? 'Nenhum documento pede revisão.'
                : `${plural(toReview, 'documento precisa', 'documentos precisam')} de revisão.`,
          to: `${base}/documents?atencao=1`,
          actionLabel: 'Abrir Documentos',
        },
        {
          id: 'plano-acao',
          label: 'Plano de Ação concluído',
          state: openActions === 0 ? 'done' : 'pending',
          hint:
            openActions === 0
              ? 'Nenhuma tarefa aberta.'
              : `${plural(openActions, 'tarefa aberta', 'tarefas abertas')}.`,
          to: `${base}/action-plan`,
          actionLabel: 'Abrir Plano de Ação',
        },
        manual(
          'revisao-periodica',
          'REVISAO_PERIODICA',
          'Revisão periódica definida',
          'Confirmar rotina',
          'Defina quem revisa este caminho e a trilha de auditoria, e com que frequência.',
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
