import { useParams, Link } from "react-router-dom";
import { ArrowLeft, AlertTriangle } from "lucide-react";

export function SancoesPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to={`/workspaces/${workspaceId}/pilares`}
        className="flex items-center gap-1.5 text-[#0A0A0A] hover:text-[#B4201A] text-sm mb-4 font-medium transition-colors w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Voltar aos Pilares
      </Link>

      <div className="flex items-center gap-2.5 mb-1">
        <AlertTriangle className="w-5 h-5 text-[#B4201A]" />
        <h1 className="text-xl text-[#0A0A0A]">O que Acontece se Não Cumprir</h1>
      </div>
      <p className="text-sm text-[#0A0A0A]/55 mb-6">
        Art. 52 da LGPD, e o cenário real de fiscalização em 2026.
      </p>

      <div className="space-y-4">
        <div className="bg-white rounded-xl p-5 border border-[#0A0A0A]/10">
          <h3 className="font-medium text-[#0A0A0A] mb-2">As sanções previstas em lei</h3>
          <p className="text-sm text-[#0A0A0A]/65 leading-relaxed">
            Entre as sanções previstas estão a advertência com prazo para adoção de medidas corretivas, a multa simples de até
            2% do faturamento da empresa no Brasil em seu último exercício, limitada a 50 milhões de reais por infração, a multa
            diária, a publicização da infração, o bloqueio e a eliminação dos dados pessoais envolvidos, e a suspensão parcial
            do funcionamento do banco de dados ou do exercício da atividade de tratamento.
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-amber-200">
          <h3 className="font-medium text-[#0A0A0A] mb-2">Não é mais teórico, é fiscalização real</h3>
          <p className="text-sm text-[#0A0A0A]/70 leading-relaxed">
            Em fevereiro de 2026, a Lei 15.352 transformou a ANPD na Agência Nacional de Proteção de Dados, com autonomia
            funcional, técnica, decisória, administrativa e financeira. Em 2026, a ANPD concluiu o monitoramento de 56 agentes
            de tratamento (39 órgãos públicos e 17 empresas privadas) sobre duas obrigações básicas, a indicação formal de um
            Encarregado e a disponibilização de um canal de comunicação com os titulares, e 21 deles, que não responderam
            aos ofícios, foram encaminhados à área de sanções, que pode abrir processos sancionadores. A primeira sanção com
            multa da ANPD, em 2023, atingiu uma microempresa (R$ 14.400,00 no total), o que mostra que o porte pequeno não
            afasta a sanção.
          </p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#0A0A0A]/10">
          <h3 className="font-medium text-[#0A0A0A] mb-2">O risco não é só a multa</h3>
          <p className="text-sm text-[#0A0A0A]/65 leading-relaxed">
            Além da sanção financeira, uma empresa fora de conformidade fica exposta a dano reputacional, perda de confiança
            de clientes, e risco de responsabilização civil por parte de titulares prejudicados. Manter a documentação
            organizada, e conseguir provar que os processos existem de verdade, é a defesa mais eficaz nesses cenários.
          </p>
        </div>
      </div>
    </div>
  );
}