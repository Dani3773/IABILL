import { useParams, Link } from "react-router-dom";
import {
  ClipboardList,
  Truck,
  GraduationCap,
  Building2,
  ClipboardCheck,
  ArrowRight,
  Scale,
  FileCheck,
  Inbox,
  ShieldCheck,
  ShieldAlert,
  UserCog,
  Shield,
  Globe,
  BookOpen,
  Users2,
  AlertTriangle,
} from "lucide-react";
import { ComplianceChecklist } from "../components/ComplianceChecklist";

interface StageCard {
  to: string;
  icon: typeof Scale;
  title: string;
  legalBasis: string;
  description: string;
  note?: string;
  comingSoon?: boolean;
}

interface Stage {
  id: string;
  title: string;
  subtitle: string;
  accent: string;
  bg: string;
  cards: StageCard[];
}

export function PilaresPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  const stages: Stage[] = [
    {
      id: "fundamentos",
      title: "1. Fundamentos Legais",
      subtitle: "O que sua empresa precisa saber antes de qualquer coisa",
      accent: "text-[#0d7a6d]",
      bg: "bg-[#14B8A6]/10",
      cards: [
        {
          to: `/workspaces/${workspaceId}/pilares/glossario`,
          icon: BookOpen,
          title: "Glossário de Termos",
          legalBasis: "Art. 5º",
          description:
            "Dado pessoal, dado sensível, titular, anonimização, e outros termos que aparecem em várias telas do sistema, explicados em linguagem simples.",
        },
        {
          to: `/workspaces/${workspaceId}/pilares/quem-e-quem`,
          icon: Users2,
          title: "Quem é Quem",
          legalBasis: "Art. 5º",
          description:
            "Controlador, Operador, Encarregado, Titular, ANPD, os papéis que a lei define, e como cada um aparece dentro do próprio sistema.",
        },
        {
          to: `/workspaces/${workspaceId}/pilares/principios`,
          icon: Scale,
          title: "Princípios da LGPD",
          legalBasis: "Art. 6º",
          description:
            "As dez regras que orientam qualquer tratamento de dado pessoal, finalidade, adequação, necessidade, e outras. Toda decisão da empresa sobre dados deveria conseguir se justificar por algum desses princípios.",
        },
        {
          to: `/workspaces/${workspaceId}/pilares/base-legal`,
          icon: FileCheck,
          title: "Base Legal (Hipóteses)",
          legalBasis: "Art. 7º/11",
          description:
            "Toda atividade de tratamento precisa se apoiar numa das hipóteses legais previstas em lei, consentimento, execução de contrato, cumprimento de obrigação legal, entre outras. É o primeiro dado que o ROPA pede de cada atividade.",
        },
        {
          to: `/workspaces/${workspaceId}/pilares/sancoes`,
          icon: AlertTriangle,
          title: "O que Acontece se Não Cumprir",
          legalBasis: "Art. 52",
          description:
            "Sanções previstas em lei, e o cenário real de fiscalização da ANPD em 2026, que já se tornou muito mais ativo do que era antes.",
        },
      ],
    },
    {
      id: "operacao",
      title: "2. Operação do Dia a Dia",
      subtitle: "O trabalho contínuo de manter a adequação",
      accent: "text-[#1B2233]/80",
      bg: "bg-[#1B2233]/6",
      cards: [
        {
          to: `/workspaces/${workspaceId}/pilares/ropa`,
          icon: ClipboardList,
          title: "Inventário / ROPA",
          legalBasis: "Art. 37",
          description:
            "Registro estruturado de todas as atividades de tratamento de dados da empresa, quem trata o quê, com qual finalidade, e com base em qual hipótese legal. É o documento mais consultado pela ANPD em fiscalização.",
        },
                {
          to: `/workspaces/${workspaceId}/pilares/ropa`,
          icon: ClipboardList,
          title: "Inventário / ROPA",
          legalBasis: "Art. 37",
          description:
            "Registro estruturado de todas as atividades de tratamento de dados da empresa, quem trata o quê, com qual finalidade, e com base em qual hipótese legal. É o documento mais consultado pela ANPD em fiscalização.",
        },
        {
          to: `/workspaces/${workspaceId}/data-subject-requests`,
          icon: Inbox,
          title: "Direitos do Titular",
          legalBasis: "Art. 18",
          description:
            "Qualquer pessoa cujo dado a empresa trata tem direito de pedir acesso, correção, ou eliminação desses dados. O sistema já mantém um portal público pronto para receber essas solicitações.",
        },
        {
          to: `/workspaces/${workspaceId}/documents`,
          icon: ShieldCheck,
          title: "Segurança da Informação",
          legalBasis: "Art. 46/49",
          description:
            "Medidas técnicas e administrativas para proteger os dados, controle de acesso, criptografia, backup. No sistema, vira um documento do tipo Política de Segurança da Informação (PSI), gerado com IA a partir do que já existe cadastrado.",
        },
        {
          to: `/workspaces/${workspaceId}/documents`,
          icon: ShieldCheck,
          title: "Segurança da Informação",
          legalBasis: "Art. 46/49",
          description:
            "Medidas técnicas e administrativas para proteger os dados, controle de acesso, criptografia, backup. No sistema, vira um documento do tipo Política de Segurança da Informação (PSI), gerado com IA a partir do que já existe cadastrado.",
        },
        {
          to: `/workspaces/${workspaceId}/incidents`,
          icon: ShieldAlert,
          title: "Incidentes",
          legalBasis: "Art. 48",
          description:
            "Vazamento ou incidente de segurança precisa ser registrado, e em casos de risco relevante, notificado à ANPD em até 3 dias úteis. O sistema já calcula esse prazo automaticamente para cada incidente aberto.",
        },
        {
          to: `/workspaces/${workspaceId}/pilares/fornecedores`,
          icon: Truck,
          title: "Fornecedores / Terceiros",
          legalBasis: "Art. 39",
          description:
            "Toda empresa que processa dado em nome da sua, nuvem, folha de pagamento, ferramentas de IA, é um operador, e precisa de um contrato formal (DPA) confirmando como ela trata esses dados.",
        },
        {
          to: `/workspaces/${workspaceId}/pilares/treinamento`,
          icon: GraduationCap,
          title: "Treinamento de Colaboradores",
          legalBasis: "Boa prática ANPD",
          description:
            "Conscientização sobre proteção de dados não é opcional na prática, é o que evita o erro humano, que continua sendo a causa mais comum de incidente de segurança.",
        },
      ],
    },
    {
      id: "governanca",
      title: "3. Governança Avançada",
      subtitle: "O que sustenta a adequação no longo prazo",
      accent: "text-[#B8862B]",
      bg: "bg-[#B8862B]/10",
      cards: [
        {
          to: `/workspaces/${workspaceId}/users`,
          icon: UserCog,
          title: "Encarregado (DPO)",
          legalBasis: "Art. 37",
          description:
            "A pessoa responsável formalmente pela proteção de dados na empresa, ponto de contato entre a empresa, os titulares, e a ANPD.",
          note: "Mesmo estando na fase avançada, vale designar cedo. Empresas de médio e grande porte são obrigadas a ter DPO. Empresas genuinamente pequenas têm dispensa dessa obrigação específica, desde que mantenham um canal de comunicação com o titular, mas a fiscalização real de 2026 tem mirado justamente empresas sem DPO visível, então declarar cedo reduz risco na prática, mesmo quando não é estritamente obrigatório.",
        },
        {
          to: `/workspaces/${workspaceId}/documents`,
          icon: Shield,
          title: "RIPD / DPIA",
          legalBasis: "Art. 38",
          description:
            "Relatório de Impacto à Proteção de Dados, exigido quando uma atividade envolve dado sensível ou alto risco. O sistema já sugere automaticamente a criação desse relatório quando uma atividade do ROPA é marcada como sensível.",
        },
        {
          to: `/workspaces/${workspaceId}/pilares/transferencia-internacional`,
          icon: Globe,
          title: "Transferência Internacional",
          legalBasis: "Art. 33",
          description:
            "Envio de dados pessoais para fora do Brasil, inclusive para provedores de nuvem ou IA sediados em outro país, precisa seguir regras específicas de garantia de proteção equivalente.",
          comingSoon: true,
        },
      ],
    },
  ];

  return (
    <div>
      <h1 className="text-xl font-serif text-[#1B2233] mb-1">Pilares de Conformidade</h1>
      <p className="text-sm text-[#1B2233]/55 mb-6">
        O caminho que sua empresa deve seguir para se manter adequada à LGPD/RGPD, organizado em três estágios.
      </p>

      {workspaceId && <ComplianceChecklist workspaceId={workspaceId} />}

      <div className="flex gap-3 mb-8">
        <Link
          to={`/workspaces/${workspaceId}/pilares/diagnostico`}
          className="flex items-center gap-2 bg-white rounded-lg px-4 py-2.5 border border-[#1B2233]/10 hover:border-[#14B8A6]/50 transition-colors text-sm font-medium text-[#1B2233]"
        >
          <ClipboardCheck className="w-4 h-4 text-[#14B8A6]" />
          Diagnóstico Inicial
        </Link>
        <Link
          to={`/workspaces/${workspaceId}/pilares/setores`}
          className="flex items-center gap-2 bg-white rounded-lg px-4 py-2.5 border border-[#1B2233]/10 hover:border-[#14B8A6]/50 transition-colors text-sm font-medium text-[#1B2233]"
        >
          <Building2 className="w-4 h-4 text-[#14B8A6]" />
          Setores
        </Link>
      </div>

      <div className="space-y-10">
        {stages.map((stage) => (
          <div key={stage.id}>
            <div className={`rounded-xl ${stage.bg} px-5 py-4 mb-4`}>
              <h2 className={`font-serif text-lg ${stage.accent}`}>{stage.title}</h2>
              <p className="text-xs text-[#1B2233]/50 mt-0.5">{stage.subtitle}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stage.cards.map((card) => {
                const Icon = card.icon;
                return (
                  <Link
                    key={card.title}
                    to={card.comingSoon ? "#" : card.to}
                    onClick={(e) => card.comingSoon && e.preventDefault()}
                    className={`bg-white rounded-xl p-5 border border-[#1B2233]/10 transition-all ${
                      card.comingSoon
                        ? "opacity-60 cursor-default"
                        : "hover:border-[#14B8A6]/50 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-9 h-9 rounded-lg bg-[#14B8A6]/10 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-[#14B8A6]" />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-wide text-[#B8862B]">
                          {card.legalBasis}
                        </span>
                        {!card.comingSoon && <ArrowRight className="w-4 h-4 text-[#1B2233]/25" />}
                      </div>
                    </div>
                    <h3 className="font-medium text-[#1B2233] mb-1">
                      {card.title}
                      {card.comingSoon && (
                        <span className="ml-2 text-[10px] font-mono uppercase tracking-wide text-[#1B2233]/40">
                          Em breve
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-[#1B2233]/55 leading-relaxed">{card.description}</p>
                    {card.note && (
                      <p className="text-xs text-[#B8862B] leading-relaxed mt-2 pt-2 border-t border-[#B8862B]/15">
                        {card.note}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}