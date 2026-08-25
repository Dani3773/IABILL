import { useParams, Link } from "react-router-dom";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export function SancoesPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to={`/workspaces/${workspaceId}/pilares`}
        className="flex items-center gap-1.5 text-[#0d7a6d] hover:text-[#14B8A6] text-sm mb-4 font-medium transition-colors w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Voltar aos Pilares
      </Link>

      <div className="flex items-center gap-2.5 mb-1">
        <AlertTriangle className="w-5 h-5 text-[#14B8A6]" />
        <h1 className="text-xl font-serif text-[#1B2233]">O que Acontece se Não Cumprir</h1>
      </div>
      <p className="text-sm text-[#1B2233]/55 mb-6">
        Art. 52 da LGPD, e o cenário real de fiscalização em 2026.
      </p>

      <div className="space-y-4">
        <div className="bg-white rounded-xl p-5 border border-[#1B2233]/10">
          <h3 className="font-medium text-[#1B2233] mb-2">As sanções previstas em lei</h3>
          <p className="text-sm text-[#1B2233]/65 leading-relaxed">
            Advertência com prazo para adoção de medidas corretivas, multa de até 2% do faturamento da empresa no Brasil,
            limitada a 50 milhões de reais por infração, publicização da infração, bloqueio dos dados pessoais envolvidos, e
            em casos graves, eliminação dos dados pessoais.
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-amber-200 bg-amber-50">
          <h3 className="font-medium text-[#1B2233] mb-2">Não é mais teórico, é fiscalização real</h3>
          <p className="text-sm text-[#1B2233]/70 leading-relaxed">
            Em fevereiro de 2026, a ANPD deixou de ser só uma autoridade orientadora e virou uma agência reguladora plena,
            com mais autonomia e poder de fiscalização. Em junho de 2026, a ANPD concluiu o monitoramento de 56 agentes de
            tratamento, com foco justamente nas obrigações básicas de conformidade, tendo Encarregado designado, registro de
            atividades, e resposta a incidente. A primeira multa da história da ANPD foi aplicada a uma microempresa,
            confirmando que porte pequeno reduz o valor da sanção, mas não afasta a sanção em si.
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#1B2233]/10">
          <h3 className="font-medium text-[#1B2233] mb-2">O risco não é só a multa</h3>
          <p className="text-sm text-[#1B2233]/65 leading-relaxed">
            Além da sanção financeira, uma empresa fora de conformidade fica exposta a dano reputacional, perda de confiança
            de clientes, e risco de responsabilização civil por parte de titulares prejudicados. Manter a documentação
            organizada, e conseguir provar que os processos existem de verdade, é a defesa mais eficaz nesses cenários.
          </p>
        </div>
      </div>
    </div>
  );
}