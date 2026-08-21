import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import {
  ArrowRight,
  FileText,
  UserCog,
  Shield,
  Radio,
  ScrollText,
  Lock,
  Timer,
} from "lucide-react";

const AUDIT_LOG_LINES = [
  "CREATE · DOCUMENT · workspace:matriz-fpolis",
  "AI_GENERATE · DOCUMENT · gemini-2.5-flash",
  "APPROVE · DOCUMENT · reviewed_by:admin",
  "UPDATE · INCIDENT · anpd_notified",
  "VIEW · DOCUMENT_CHUNK · rag:semantic_search",
  "REJECT · DOCUMENT · reason:incomplete_context",
];

const STEPS = [
  {
    tag: "INGEST",
    title: "Seus documentos viram contexto",
    description:
      "Políticas, inventários e relatórios são processados e transformados em embeddings vetoriais, isolados por workspace.",
  },
  {
    tag: "RETRIEVE",
    title: "Busca semântica, não palavra-chave",
    description:
      "Cada pergunta busca os trechos mais relevantes dos seus próprios documentos via similaridade vetorial.",
  },
  {
    tag: "GENERATE",
    title: "IA responde só com o que existe",
    description:
      "O modelo é instruído a recusar quando o contexto é insuficiente, em vez de inventar informação sobre sua empresa.",
  },
  {
    tag: "APPROVE",
    title: "Nada vira oficial sem revisão humana",
    description:
      "Todo conteúdo gerado nasce como rascunho. Aprovar ou rejeitar é sempre uma decisão sua, registrada na auditoria.",
  },
];

const FEATURES = [
  {
    icon: FileText,
    citation: "§ Art. 6º/9º",
    title: "Geração fundamentada em contexto",
    description:
      "Documentos de conformidade gerados por IA, sempre com base nos dados reais do seu workspace.",
  },
  {
    icon: UserCog,
    citation: "§ Art. 37",
    title: "Papel de Encarregado (DPO)",
    description:
      "Permissão dedicada para quem responde formalmente pela proteção de dados na sua empresa.",
  },
  {
    icon: Shield,
    citation: "§ Art. 38",
    title: "Relatório de Impacto (RIPD/DPIA)",
    description:
      "Estrutura jurídica própria cobrindo os quatro elementos exigidos para tratamentos de alto risco.",
  },
  {
    icon: Radio,
    citation: "§ Art. 48",
    title: "Notificação de incidentes",
    description:
      "Trilha dupla de notificação — ANPD e titulares afetados — cada uma com seu próprio registro de data e hora.",
  },
  {
    icon: ScrollText,
    citation: "§ Responsabilização",
    title: "Auditoria imutável",
    description:
      "Toda ação sobre dados fica registrada, incluindo o que foi gerado por IA e quem aprovou.",
  },
  {
    icon: Lock,
    citation: "§ Isolamento",
    title: "Multi-tenant por design",
    description:
      "Cada empresa acessa exclusivamente seus próprios dados — validado em nível de aplicação e banco.",
  },
];

const METRICS = [
  { value: "1.000", label: "Precision@1 (retrieval)" },
  { value: "1.000", label: "Recall@5 (retrieval)" },
  { value: "1.000", label: "MRR (retrieval)" },
  { value: "100%", label: "Taxa de recusa correta" },
];

const ENGINEERING_NOTES = [
  "Autenticação via cookie httpOnly, sem tokens acessíveis por JavaScript",
  "Controle de acesso por papel em cada operação sensível",
  "Limite de uso de IA por usuário, contra abuso e custo descontrolado",
  "Deploy contínuo com credenciais dinâmicas — sem chaves de acesso permanentes",
  "Testes automatizados em três camadas: unitários, integração e avaliação de IA",
];

// Vazio de proposito - usar nome/logo de empresa cliente aqui exige autorizacao
// comercial explicita, separada da autorizacao academica ja obtida para o TCC.
// Adicionar entradas aqui APENAS apos essa autorizacao especifica existir.
const PARTNERS: string[] = [];

// Selo circular em SVG puro - o texto segue um caminho circular real (textPath),
// nao e uma imagem. Ancorado no proprio conceito do produto: nada vira "oficial"
// sem um carimbo de aprovacao humana.
function ApprovalSeal() {
  return (
    <svg viewBox="0 0 200 200" className="w-40 h-40 sm:w-48 sm:h-48">
      <defs>
        <path
          id="seal-circle"
          d="M 100,100 m -78,0 a 78,78 0 1,1 156,0 a 78,78 0 1,1 -156,0"
        />
      </defs>
      <circle
        cx="100"
        cy="100"
        r="94"
        fill="none"
        stroke="#B8862B"
        strokeWidth="1.5"
        opacity="0.5"
      />
      <circle
        cx="100"
        cy="100"
        r="78"
        fill="none"
        stroke="#B8862B"
        strokeWidth="2"
      />
      <text fill="#B8862B" fontSize="10.5" letterSpacing="3" fontFamily="ui-monospace, monospace">
        <textPath href="#seal-circle" startOffset="0%">
          CONFORMIDADE · LGPD/RGPD · IABILL ·
        </textPath>
      </text>
      <g transform="translate(100,100)">
        <circle r="46" fill="none" stroke="#B8862B" strokeWidth="1.5" />
        <path
          d="M -18,2 L -6,16 L 20,-14"
          fill="none"
          stroke="#B8862B"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

export function LandingPage() {
  const { isAuthenticated, tenantId } = useAuth();

  if (isAuthenticated) {
    return <Navigate to={tenantId ? "/dashboard" : "/platform"} replace />;
  }

  return (
    <div className="bg-[#0E1220]">
      <style>{`
        @keyframes iabill-log-scroll {
          from { transform: translateY(0); }
          to { transform: translateY(-50%); }
        }
        .iabill-log-track { animation: iabill-log-scroll 16s linear infinite; }
        @keyframes iabill-seal-in {
          from { opacity: 0; transform: scale(0.85) rotate(-18deg); }
          to { opacity: 1; transform: scale(1) rotate(-8deg); }
        }
        .iabill-seal { animation: iabill-seal-in 0.7s cubic-bezier(0.16,1,0.3,1) 0.2s both; }
        @media (prefers-reduced-motion: reduce) {
          .iabill-log-track, .iabill-seal { animation: none; }
        }
        html {
          scroll-behavior: smooth;
        }
      `}</style>

      {/* Nav */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-white/10 bg-[#0E1220]/85 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="IABill" className="h-6 opacity-90" />
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#sobre" className="text-sm text-[#9CA3AF] hover:text-white transition-colors">
              Sobre
            </a>
            <a href="#faq" className="text-sm text-[#9CA3AF] hover:text-white transition-colors">
              FAQ
            </a>
            <a href="#contato" className="text-sm text-[#9CA3AF] hover:text-white transition-colors">
              Contato
            </a>
          </nav>
          <nav className="flex items-center gap-6">
            <Link
              to="/login"
              className="text-sm text-[#9CA3AF] hover:text-white transition-colors"
            >
              Entrar
            </Link>
            <Link
              to="/signup"
              className="text-sm font-medium bg-[#B8862B] hover:bg-[#A9791F] text-[#0E1220] rounded-lg px-4 py-2 transition-colors"
            >
              Cadastrar empresa
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero — ink */}
      <section className="pt-40 pb-24 px-6 border-b border-white/10">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <p className="font-mono text-xs tracking-widest text-[#14B8A6] mb-5 uppercase">
              Sistema de apoio à conformidade · LGPD / RGPD
            </p>
            <h1 className="font-serif text-4xl sm:text-5xl leading-[1.1] text-white mb-6">
              Conformidade com a LGPD, com um carimbo humano em cada etapa.
            </h1>
            <p className="text-[#9CA3AF] text-base leading-relaxed mb-8 max-w-md">
              O IABill organiza, gera e acompanha a adequação da sua empresa à
              LGPD — mas nunca decide sozinho. Todo conteúdo gerado por IA
              nasce como rascunho e só vale com sua aprovação.
            </p>
            <div className="flex items-center gap-4">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 bg-[#B8862B] hover:bg-[#A9791F] text-[#0E1220] text-sm font-semibold rounded-lg px-5 py-3 transition-colors"
              >
                Cadastrar sua empresa <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/login"
                className="text-sm text-[#9CA3AF] hover:text-white transition-colors"
              >
                Já tenho conta
              </Link>
            </div>
          </div>

          {/* Documento mockup + selo de aprovacao sobreposto */}
          <div className="relative flex items-center justify-center py-8">
            <div className="w-full max-w-xs rounded-lg bg-[#EDEAE1] p-5 shadow-2xl -rotate-2">
              <div className="h-2.5 w-2/3 bg-[#1B2233]/80 rounded-full mb-4" />
              <div className="space-y-2 mb-4">
                <div className="h-1.5 w-full bg-[#1B2233]/20 rounded-full" />
                <div className="h-1.5 w-full bg-[#1B2233]/20 rounded-full" />
                <div className="h-1.5 w-4/5 bg-[#1B2233]/20 rounded-full" />
                <div className="h-1.5 w-full bg-[#1B2233]/20 rounded-full" />
                <div className="h-1.5 w-3/5 bg-[#1B2233]/20 rounded-full" />
              </div>
              <span className="inline-block text-[10px] font-mono tracking-wider uppercase bg-[#14B8A6]/15 text-[#0d7a6d] rounded px-2 py-1">
                Aprovado
              </span>
            </div>
            <div className="iabill-seal absolute -right-2 -bottom-4 sm:right-2 sm:bottom-0 drop-shadow-xl">
              <ApprovalSeal />
            </div>
          </div>
        </div>
      </section>

            {/* Sobre — ink */}
      <section id="sobre" className="py-24 px-6 border-b border-white/10">
        <div className="max-w-3xl mx-auto">
          <p className="font-mono text-xs tracking-widest text-[#14B8A6] mb-5 uppercase">
            Sobre
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl text-white mb-6 leading-snug">
            Nascido como pesquisa acadêmica rigorosa, construído para uso real.
          </h2>
          <div className="space-y-4 text-[#9CA3AF] text-base leading-relaxed">
            <p>
              O IABill começou como trabalho de conclusão de curso em Ciência da Computação, na
              UNESC (Universidade do Extremo Sul Catarinense), desenvolvido por Daniel Felisberto
              dos Santos. A pergunta de pesquisa era direta: é possível usar Inteligência
              Artificial para apoiar a adequação de empresas à LGPD e ao RGPD, sem abrir mão de
              rigor, rastreabilidade e supervisão humana?
            </p>
            <p>
              Essa origem acadêmica não é um detalhe de rodapé, é o que molda cada decisão do
              produto. Toda funcionalidade nasce corresponde a um dispositivo legal específico,
              não a uma interpretação genérica de boas práticas. Todo comportamento de IA passa
              por validação formal antes de virar recurso, incluindo testes automatizados que
              medem, com números reais, se o sistema recusa corretamente gerar conteúdo quando não
              tem base para isso.
            </p>
            <p>
              O resultado é um sistema que trata inteligência artificial como ferramenta de apoio,
              nunca como substituto de julgamento humano ou jurídico. Cada documento gerado nasce
              como rascunho. Aprovar é sempre uma decisão de uma pessoa responsável pela sua
              empresa, nunca do sistema sozinho.
            </p>
          </div>
        </div>
      </section>

      {/* Como funciona — paper */}
      <section className="py-24 px-6 bg-[#EDEAE1]">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-serif text-2xl text-[#1B2233] mb-2">
            Como funciona
          </h2>
          <p className="text-[#1B2233]/60 text-sm mb-12 max-w-lg">
            O mesmo pipeline usado em documentos, plano de ação e chat — a
            ordem real de execução, não uma lista arbitrária.
          </p>
          <div className="grid md:grid-cols-4 gap-px bg-[#1B2233]/10 rounded-xl overflow-hidden">
            {STEPS.map((step) => (
              <div key={step.tag} className="bg-[#EDEAE1] p-6">
                <p className="font-mono text-xs text-[#0d7a6d] tracking-widest mb-4">
                  {step.tag}
                </p>
                <h3 className="text-[#1B2233] text-sm font-medium mb-2">
                  {step.title}
                </h3>
                <p className="text-[#1B2233]/60 text-xs leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features com citacao legal — ink */}
      <section className="py-24 px-6 border-b border-white/10">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-serif text-2xl text-white mb-2">
            Construído sobre a lei, não ao lado dela
          </h2>
          <p className="text-[#9CA3AF] text-sm mb-12 max-w-lg">
            Cada módulo abaixo corresponde a uma obrigação real da LGPD — não
            é um recurso genérico com um selo de conformidade colado depois.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-xl border border-white/10 bg-white/3 p-6 hover:border-white/20 transition-colors"
              >
                <div className="flex items-center justify-between mb-4">
                  <feature.icon className="w-5 h-5 text-[#14B8A6]" />
                  <span className="font-mono text-[11px] text-[#B8862B]">
                    {feature.citation}
                  </span>
                </div>
                <h3 className="text-white text-sm font-medium mb-2">
                  {feature.title}
                </h3>
                <p className="text-[#9CA3AF] text-xs leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Metricas reais — paper */}
      <section className="py-24 px-6 bg-[#EDEAE1]">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-serif text-2xl text-[#1B2233] mb-2">
            Testado, não apenas prometido
          </h2>
          <p className="text-[#1B2233]/60 text-sm mb-12 max-w-lg">
            Resultados de um golden dataset de avaliação, executado contra o
            pipeline real de busca semântica — não uma estimativa.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {METRICS.map((metric) => (
              <div key={metric.label}>
                <p className="font-mono text-3xl text-[#1B2233] mb-1">
                  {metric.value}
                </p>
                <p className="text-[#1B2233]/60 text-xs">{metric.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Engenharia + log de auditoria — ink */}
      <section className="py-24 px-6 border-b border-white/10">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-start">
          <div>
            <h2 className="font-serif text-2xl text-white mb-2">
              Feito para produção, não para demo
            </h2>
            <p className="text-[#9CA3AF] text-sm max-w-md mb-8">
              O IABill roda em infraestrutura própria, com deploy contínuo e
              práticas de segurança que não dependem de ninguém lembrar de
              fazer manualmente.
            </p>
            <ul className="space-y-4">
              {ENGINEERING_NOTES.map((note) => (
                <li key={note} className="flex items-start gap-3">
                  <Timer className="w-4 h-4 text-[#14B8A6] mt-0.5 shrink-0" />
                  <span className="text-[#9CA3AF] text-sm">{note}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/3 overflow-hidden h-64">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/10">
              <ScrollText className="w-3.5 h-3.5 text-[#14B8A6]" />
              <span className="font-mono text-[11px] text-[#9CA3AF] uppercase tracking-wide">
                Trilha de auditoria · tempo real
              </span>
            </div>
            <div className="relative h-[calc(100%-2.75rem)] overflow-hidden mask-[linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]">
              <div className="iabill-log-track">
                {[...AUDIT_LOG_LINES, ...AUDIT_LOG_LINES].map((line, i) => (
                  <div
                    key={i}
                    className="font-mono text-[11px] text-[#9CA3AF] px-4 py-2 border-b border-white/5"
                  >
                    <span className="text-[#14B8A6]">›</span> {line}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

            {/* FAQ — paper */}
      <section id="faq" className="py-24 px-6 bg-[#EDEAE1]">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-2xl text-[#1B2233] mb-2">Perguntas frequentes</h2>
          <p className="text-[#1B2233]/60 text-sm mb-12">
            O que empresas normalmente perguntam antes de começar.
          </p>
          <div className="space-y-8">
            <div>
              <h3 className="text-[#1B2233] font-medium mb-2">Meus dados ficam seguros?</h3>
              <p className="text-[#1B2233]/60 text-sm leading-relaxed">
                Sim. O acesso é protegido por autenticação em cookie inacessível a scripts do
                navegador, controle de acesso por papel, criptografia em repouso no banco de
                dados, e cada empresa cliente tem seus dados isolados dos demais clientes, tanto
                em nível de aplicação quanto de banco de dados.
              </p>
            </div>
            <div>
              <h3 className="text-[#1B2233] font-medium mb-2">
                O IABill substitui um advogado ou Encarregado de Dados (DPO)?
              </h3>
              <p className="text-[#1B2233]/60 text-sm leading-relaxed">
                Não. O IABill é uma ferramenta de apoio, ela organiza, estrutura e acelera o
                processo de adequação, mas a decisão final e a responsabilidade jurídica continuam
                sendo de pessoas, nunca do sistema. Recomendamos que documentos gerados sejam
                revisados por quem responde formalmente pela conformidade da sua empresa.
              </p>
            </div>
            <div>
              <h3 className="text-[#1B2233] font-medium mb-2">Funciona para empresa pequena?</h3>
              <p className="text-[#1B2233]/60 text-sm leading-relaxed">
                Sim, o IABill foi desenhado justamente pensando em empresas de pequeno e médio
                porte, que costumam ter menos recursos técnicos e financeiros disponíveis para
                consultoria especializada tradicional.
              </p>
            </div>
            <div>
              <h3 className="text-[#1B2233] font-medium mb-2">Quanto custa?</h3>
              <p className="text-[#1B2233]/60 text-sm leading-relaxed">
                Nosso modelo de precificação ainda está em definição. Entre em contato pela seção
                abaixo para conversar sobre o cenário da sua empresa.
              </p>
            </div>
            <div>
              <h3 className="text-[#1B2233] font-medium mb-2">
                Preciso entender de LGPD ou de tecnologia para usar?
              </h3>
              <p className="text-[#1B2233]/60 text-sm leading-relaxed">
                Não. A plataforma foi construída para guiar o processo passo a passo, com
                explicações e sugestões baseadas nos artigos reais da lei, não em jargão técnico
                ou jurídico.
              </p>
            </div>
            <div>
              <h3 className="text-[#1B2233] font-medium mb-2">
                O conteúdo gerado por IA pode ser usado direto, sem revisão?
              </h3>
              <p className="text-[#1B2233]/60 text-sm leading-relaxed">
                Não recomendamos. Todo conteúdo gerado nasce como rascunho, exatamente para
                garantir que uma pessoa responsável revise e aprove antes de qualquer documento
                virar oficial.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Parceiros — ink, so renderiza quando houver entradas reais autorizadas */}
      {PARTNERS.length > 0 && (
        <section className="py-24 px-6 border-b border-white/10">
          <div className="max-w-6xl mx-auto">
            <h2 className="font-serif text-2xl text-white mb-8 text-center">
              Empresas que confiam no IABill
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-12">
              {PARTNERS.map((partner) => (
                <span key={partner} className="text-[#9CA3AF] text-sm font-mono">
                  {partner}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contato — ink */}
      <section id="contato" className="py-24 px-6 border-b border-white/10">
        <div className="max-w-2xl mx-auto text-center">
          <p className="font-mono text-xs tracking-widest text-[#14B8A6] mb-5 uppercase">
            Contato
          </p>
          <h2 className="font-serif text-2xl sm:text-3xl text-white mb-4 leading-snug">
            Vamos conversar sobre a conformidade da sua empresa
          </h2>
          <p className="text-[#9CA3AF] text-sm mb-8">
            Tire dúvidas, peça uma demonstração, ou entenda como o IABill se encaixa no seu
            cenário.
          </p>
          <button
            type="button"
            onClick={() => { window.location.href = "mailto:danielfelisberto3@gmail.com"; }}
            className="inline-flex items-center gap-2 bg-[#B8862B] hover:bg-[#A9791F] text-[#0E1220] text-sm font-semibold rounded-lg px-6 py-3 transition-colors"
          >
            danielfelisberto3@gmail.com
          </button>
        </div>
      </section>

      {/* CTA final — paper */}
      <section className="py-24 px-6 bg-[#EDEAE1]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-serif text-3xl text-[#1B2233] mb-4">
            Comece a organizar a conformidade da sua empresa
          </h2>
          <p className="text-[#1B2233]/60 text-sm mb-8">
            Cadastro leva menos de dois minutos. Sem cartão de crédito.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-2 bg-[#1B2233] hover:bg-[#28324a] text-white text-sm font-medium rounded-lg px-6 py-3 transition-colors"
          >
            Cadastrar sua empresa <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer — ink */}
      <footer className="py-10 px-6 border-t border-white/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-6">
            <img src="/logo.png" alt="IABill" className="h-5 opacity-60" />
            <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
              <a href="#sobre" className="text-[#6B7280] hover:text-[#9CA3AF] transition-colors">
                Sobre
              </a>
              <a href="#faq" className="text-[#6B7280] hover:text-[#9CA3AF] transition-colors">
                FAQ
              </a>
              <a href="#contato" className="text-[#6B7280] hover:text-[#9CA3AF] transition-colors">
                Contato
              </a>
              <button
                type="button"
                onClick={() => window.open("https://iabill.com/politica-privacidade/11.222.333/0001-44", "_blank", "noopener,noreferrer")}
                className="text-[#6B7280] hover:text-[#9CA3AF] transition-colors"
              >
                Política de Privacidade
              </button>
              <button
                type="button"
                onClick={() => { window.location.href = "mailto:danielfelisberto3@gmail.com"; }}
                className="text-[#6B7280] hover:text-[#9CA3AF] transition-colors"
              >
                danielfelisberto3@gmail.com
              </button>
            </nav>
          </div>
          <p className="text-[#6B7280] text-xs text-center sm:text-left">
            © 2026 IABill · Trabalho de Conclusão de Curso — Ciência da Computação, UNESC
          </p>
        </div>
      </footer>
    </div>
  );
}