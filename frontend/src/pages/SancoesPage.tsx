import { useParams, Link } from "react-router-dom";
import { useLegalRegime } from '../hooks/useLegalRegime'
import { ArrowLeft, AlertTriangle } from "lucide-react";

import { tr } from '../i18n/tr'
import { RegimeText } from '../components/RegimeContent'
export function SancoesPage() {
  const { lawName } = useLegalRegime()
  const { workspaceId } = useParams<{ workspaceId: string }>();

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to={`/workspaces/${workspaceId}/pilares`}
        className="flex items-center gap-1.5 text-[#0A0A0A] hover:text-[#B4201A] text-sm mb-4 font-medium transition-colors w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />{tr('Voltar ao Guia {{lei}}', { lei: lawName })}</Link>

      <div className="flex items-center gap-2.5 mb-1">
        <AlertTriangle className="w-5 h-5 text-[#B4201A]" />
        <h1 className="text-xl text-[#0A0A0A]">{tr('O que Acontece se Não Cumprir')}</h1>
      </div>
      <p className="text-sm text-[#0A0A0A]/55 mb-6"><RegimeText lgpd={tr('Art. 52 da LGPD, e o cenário real de fiscalização em 2026.')} rgpd={tr('Arts. 58 e 83 do RGPD, e o cenário real de fiscalização.')} /></p>

      <div className="space-y-4">
        <div className="bg-white rounded-xl p-5 border border-[#0A0A0A]/10">
          <h3 className="font-medium text-[#0A0A0A] mb-2">{tr('As sanções previstas em lei')}</h3>
          <p className="text-sm text-[#0A0A0A]/65 leading-relaxed"><RegimeText lgpd={tr('Entre as sanções previstas estão a advertência com prazo para adoção de medidas corretivas, a multa simples de até 2% do faturamento da empresa no Brasil em seu último exercício, limitada a 50 milhões de reais por infração, a multa diária, a publicização da infração, o bloqueio e a eliminação dos dados pessoais envolvidos, e a suspensão parcial do funcionamento do banco de dados ou do exercício da atividade de tratamento.')} rgpd={tr('Pelo Art. 58, a autoridade de controlo pode fazer advertências e repreensões, ordenar que o tratamento seja corrigido, limitar ou proibir o tratamento, e ordenar o apagamento dos dados. Pelo Art. 83, as multas chegam a 10 milhões de euros ou 2% do volume de negócios anual mundial, o que for maior, nas infrações a obrigações como segurança e registro, e a 20 milhões de euros ou 4%, nas infrações aos princípios, às bases legais e aos direitos dos titulares.')} /></p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-amber-200">
          <h3 className="font-medium text-[#0A0A0A] mb-2">{tr('Não é mais teórico, é fiscalização real')}</h3>
          <p className="text-sm text-[#0A0A0A]/70 leading-relaxed"><RegimeText lgpd={tr('Em fevereiro de 2026, a Lei 15.352 transformou a ANPD na Agência Nacional de Proteção de Dados, com autonomia funcional, técnica, decisória, administrativa e financeira. Em 2026, a ANPD concluiu o monitoramento de 56 agentes de tratamento (39 órgãos públicos e 17 empresas privadas) sobre duas obrigações básicas, a indicação formal de um Encarregado e a disponibilização de um canal de comunicação com os titulares, e 21 deles, que não responderam aos ofícios, foram encaminhados à área de sanções, que pode abrir processos sancionadores. A primeira sanção com multa da ANPD, em 2023, atingiu uma microempresa (R$ 14.400,00 no total), o que mostra que o porte pequeno não afasta a sanção.')} rgpd={tr('O RGPD vale desde 25 de maio de 2018 e é aplicado por uma autoridade de controlo em cada país da União Europeia; em Portugal, a CNPD, com a Lei 58/2019 executando o regulamento. As multas não atingem só grandes empresas: a primeira multa da CNPD, em 2018, foi de 400 mil euros a um hospital público, por falhas no controle de acesso aos processos clínicos, e em 2022 o Instituto Nacional de Estatística foi multado em 4,3 milhões de euros pelo tratamento de dados dos Censos. Na União Europeia, a maior multa até hoje, 1,2 bilhão de euros à Meta em 2023, foi por transferência internacional de dados.')} /></p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-[#0A0A0A]/10">
          <h3 className="font-medium text-[#0A0A0A] mb-2">{tr('O risco não é só a multa')}</h3>
          <p className="text-sm text-[#0A0A0A]/65 leading-relaxed">{tr('Além da sanção financeira, uma empresa fora de conformidade fica exposta a dano reputacional, perda de confiança de clientes, e risco de responsabilização civil por parte de titulares prejudicados. Manter a documentação organizada, e conseguir provar que os processos existem de verdade, é a defesa mais eficaz nesses cenários.')}</p>
        </div>
      </div>
    </div>
  );
}