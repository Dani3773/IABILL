import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Rocket,
  ClipboardCheck,
  ClipboardList,
  Truck,
  GraduationCap,
  Building2,
  FileText,
  ListTodo,
  ShieldAlert,
  Inbox,
  ShieldCheck,
  Users,
  HelpCircle,
} from "lucide-react";

interface Section {
  id: string;
  title: string;
  icon: typeof Rocket;
  body: { heading?: string; text: string }[];
}

const SECTIONS: Section[] = [
  {
    id: "primeiros-passos",
    title: "Primeiros Passos",
    icon: Rocket,
    body: [
      {
        text: "O IABill organiza a adequação da sua empresa à LGPD/RGPD em módulos (chamados de \"Pilares\"), mais um fluxo de geração assistida de documentos por IA. Nenhum conteúdo gerado por IA vira oficial sozinho, sempre passa por revisão humana antes de valer.",
      },
      {
        heading: "O ciclo de um documento",
        text: "Todo documento nasce como Rascunho (DRAFT). Ao usar \"Gerar com IA\", ele vira Gerado (GENERATED). Alguém marca como Revisado (REVIEWED), e só então um Administrador pode Aprovar (APPROVED), o único estado em que o conteúdo é considerado oficial e passa a servir de contexto para outros documentos.",
      },
      {
        heading: "Por onde começar",
        text: "Recomendamos rodar o Diagnóstico Inicial (aba Pilares) primeiro, um questionário rápido que identifica lacunas reais e já cria as primeiras tarefas no Plano de Ação automaticamente.",
      },
    ],
  },
  {
    id: "diagnostico",
    title: "Diagnóstico Inicial",
    icon: ClipboardCheck,
    body: [
      {
        text: "Questionário de 8 perguntas sim/não, cada uma baseada num artigo real da LGPD ou guia da ANPD (DPO, ROPA, PSI, Treinamento, Direitos do Titular, Incidentes, Fornecedores, MFA).",
      },
      {
        heading: "O que acontece com cada resposta",
        text: "Toda resposta \"Não\" gera automaticamente uma tarefa no Plano de Ação, já com título e descrição apontando para o módulo certo do sistema. Se você responder \"Sim\" para tudo, o sistema confirma que nenhuma lacuna foi identificada nas perguntas do diagnóstico.",
      },
    ],
  },
  {
    id: "ropa",
    title: "Inventário / ROPA",
    icon: ClipboardList,
    body: [
      {
        text: "Registro estruturado das atividades de tratamento de dados pessoais da empresa, no formato recomendado pela ANPD, mais completo que um documento de texto livre.",
      },
      {
        heading: "Regime legal e hipótese legal",
        text: "Cada atividade pode ser LGPD ou RGPD. O dropdown de hipótese legal se ajusta automaticamente ao regime escolhido, as 10 opções da LGPD, ou as 6 equivalentes do RGPD.",
      },
      {
        heading: "Dado sensível e RIPD",
        text: "Ao marcar que uma atividade envolve dado pessoal sensível, o sistema sugere automaticamente a criação de um RIPD/DPIA para aquela atividade específica.",
      },
      {
        heading: "Prova de consentimento",
        text: "Quando a hipótese legal é \"Consentimento\", um ícone de escudo aparece no card da atividade, ele abre um QR code e um link público para coletar consentimento formal, com registro de nome, e-mail, IP e data.",
      },
    ],
  },
  {
    id: "documentos",
    title: "Documentos",
    icon: FileText,
    body: [
      {
        text: "A IA só usa como base os documentos já aprovados dentro do mesmo workspace, nunca conhecimento genérico da internet. Se não houver contexto suficiente, o sistema recusa gerar conteúdo em vez de inventar informação sobre sua empresa.",
      },
      {
        heading: "Tipos de documento disponíveis",
        text: "Inventário de Dados, Política de Privacidade, Relatório de Conformidade, RAT, RIPD/DPIA, Política de Segurança da Informação (PSI), e Material de Treinamento.",
      },
      {
        heading: "Publicação externa",
        text: "Uma Política de Privacidade aprovada pode ser publicada externamente, gerando uma URL pública e um QR code para compartilhar com clientes e usuários.",
      },
    ],
  },
  {
    id: "fornecedores",
    title: "Fornecedores",
    icon: Truck,
    body: [
      {
        text: "Registro de fornecedores e operadores que têm acesso a dados pessoais em nome da sua empresa (Art. 39 da LGPD), nuvem, folha de pagamento, ferramentas de IA, etc.",
      },
      {
        text: "Para cada fornecedor, registre o serviço prestado, quais categorias de dado são compartilhadas, e se existe um DPA (contrato de proteção de dados) assinado.",
      },
    ],
  },
  {
    id: "treinamento",
    title: "Treinamento de Colaboradores",
    icon: GraduationCap,
    body: [
      {
        text: "Colaboradores são cadastrados separadamente de Usuários, a maioria da equipe recebe treinamento sobre proteção de dados, mas nunca precisa de acesso ao sistema.",
      },
      {
        heading: "Gerar material com IA",
        text: "O botão \"Gerar Material com IA\" cria automaticamente conteúdo educativo em linguagem acessível, usando os processos reais da sua empresa como base.",
      },
    ],
  },
  {
    id: "setores",
    title: "Setores",
    icon: Building2,
    body: [
      {
        text: "Campo opcional para organizar Colaboradores, Fornecedores e atividades do ROPA por área da empresa (ex: RH, TI, Financeiro). Não é obrigatório, deixe em branco se sua estrutura ainda não estiver definida.",
      },
    ],
  },
  {
    id: "plano-de-acao",
    title: "Plano de Ação",
    icon: ListTodo,
    body: [
      {
        text: "Lista de tarefas de adequação, criadas manualmente ou sugeridas pela IA com base nos documentos já existentes no workspace. Tarefas sugeridas por IA aparecem com um selo \"IA\", mantendo a origem sempre rastreável.",
      },
    ],
  },
  {
    id: "incidentes",
    title: "Incidentes de Segurança",
    icon: ShieldAlert,
    body: [
      {
        text: "Registro de incidentes e vazamentos de dados pessoais (Art. 48 da LGPD), com notificação à ANPD e aos titulares tratadas como duas obrigações separadas, cada uma com seu próprio registro de data.",
      },
      {
        heading: "Prazo de notificação",
        text: "O sistema mostra um aviso de prazo para notificar a ANPD (3 dias úteis a partir da descoberta do incidente, conforme Resolução CD/ANPD nº 15/2024), que fica vermelho quando o prazo já passou.",
      },
    ],
  },
  {
    id: "solicitacoes",
    title: "Solicitações de Titulares",
    icon: Inbox,
    body: [
      {
        text: "Portal público (Art. 18 da LGPD) onde qualquer pessoa pode solicitar acesso, correção, eliminação, portabilidade, anonimização ou revogação de consentimento dos seus dados, sem precisar de conta no sistema.",
      },
      {
        text: "Toda solicitação recebida gera automaticamente uma tarefa vinculada no Plano de Ação da empresa.",
      },
    ],
  },
  {
    id: "seguranca",
    title: "Segurança da Conta",
    icon: ShieldCheck,
    body: [
      {
        heading: "Verificação em duas etapas (MFA)",
        text: "Ative em Perfil → Verificação em 2 Etapas. Escaneie o QR code com um aplicativo autenticador (Google Authenticator, Authy) e confirme com o código de 6 dígitos. O código é gerado inteiramente no seu navegador, o segredo nunca passa por nenhum serviço externo.",
      },
    ],
  },
  {
    id: "papeis",
    title: "Papéis e Permissões",
    icon: Users,
    body: [
      {
        text: "Usuário: acesso de leitura à maioria dos módulos. Administrador: acesso completo, incluindo gestão de usuários e aprovação de documentos. Encarregado (DPO): mesmas permissões de escrita que o Administrador nos módulos de conformidade (Incidentes, ROPA, Fornecedores, Colaboradores, Treinamento).",
      },
      {
        heading: "Conflito de interesse do DPO",
        text: "Ao atribuir o papel de DPO a alguém cujo cargo contenha termos como TI, Marketing, RH ou Financeiro, o sistema exibe um aviso, a ANPD orienta que o Encarregado não deve acumular cargos de chefia responsáveis por decidir como os dados são tratados.",
      },
    ],
  },
];

export function HelpPage() {
  const [activeId, setActiveId] = useState(SECTIONS[0].id);
  const active = SECTIONS.find((s) => s.id === activeId)!;

  return (
    <div>
      <Link
        to="/dashboard"
        className="flex items-center gap-1.5 text-[#0d7a6d] hover:text-[#14B8A6] text-sm mb-4 font-medium transition-colors w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Voltar aos Workspaces
      </Link>

      <div className="flex items-center gap-2.5 mb-1">
        <HelpCircle className="w-5 h-5 text-[#14B8A6]" />
        <h1 className="text-xl font-serif text-[#1B2233]">Central de Ajuda</h1>
      </div>
      <p className="text-sm text-[#1B2233]/55 mb-6">
        Guia rápido sobre cada módulo do IABill.
      </p>

      <div className="grid md:grid-cols-[220px_1fr] gap-6">
        <nav className="space-y-1">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            const isActive = section.id === activeId;
            return (
              <button
                key={section.id}
                onClick={() => setActiveId(section.id)}
                className={`flex items-center gap-2 w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#14B8A6]/10 text-[#0d7a6d]"
                    : "text-[#1B2233]/60 hover:bg-[#1B2233]/5"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {section.title}
              </button>
            );
          })}
        </nav>

        <div className="bg-white rounded-xl border border-[#1B2233]/10 p-6">
          <h2 className="text-lg font-serif text-[#1B2233] mb-4">{active.title}</h2>
          <div className="space-y-4">
            {active.body.map((block, i) => (
              <div key={i}>
                {block.heading && (
                  <h3 className="text-sm font-semibold text-[#1B2233] mb-1">{block.heading}</h3>
                )}
                <p className="text-sm text-[#1B2233]/70 leading-relaxed">{block.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}