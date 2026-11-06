import { useParams, Link } from "react-router-dom";
import { ArrowLeft, FileCheck } from "lucide-react";

import { tr } from '../i18n/tr'
interface Hipotese {
  nome: string;
  explicacao: string;
  exemplo: string;
}

const HIPOTESES: Hipotese[] = [
  {
    nome: tr('Consentimento'),
    explicacao: tr('O titular autoriza de forma livre, informada, e inequívoca o tratamento do seu dado para uma finalidade específica.'),
    exemplo: tr('É a hipótese mais exigente de provar, por isso o sistema tem um módulo próprio de coleta formal de consentimento, com registro de nome, e-mail, IP, e data.'),
  },
  {
    nome: tr('Cumprimento de Obrigação Legal'),
    explicacao: tr('O tratamento é necessário para que a empresa cumpra uma exigência prevista em lei.'),
    exemplo: tr('Guardar dado fiscal de nota emitida por um prazo mínimo exigido pela legislação tributária.'),
  },
  {
    nome: tr('Execução de Políticas Públicas'),
    explicacao: tr('Tratamento realizado pela administração pública para execução de políticas previstas em lei.'),
    exemplo: tr('Aplicável principalmente a órgãos públicos, raramente usada por empresa privada comum.'),
  },
  {
    nome: tr('Estudos por Órgão de Pesquisa'),
    explicacao: tr('Tratamento realizado para a realização de estudos, garantida a anonimização sempre que possível.'),
    exemplo: tr('Uma universidade tratando dado de pesquisa acadêmica anonimizado.'),
  },
  {
    nome: tr('Execução de Contrato'),
    explicacao: tr('O tratamento é necessário para cumprir um contrato do qual o titular é parte, ou para diligências pré-contratuais a pedido dele.'),
    exemplo: tr('Tratar o e-mail e a senha de um usuário para ele conseguir usar o serviço que contratou, exatamente como o próprio sistema faz.'),
  },
  {
    nome: tr('Exercício Regular de Direitos'),
    explicacao: tr('Tratamento necessário para exercício de direitos em processo judicial, administrativo, ou arbitral.'),
    exemplo: tr('Guardar prova documental para se defender numa eventual ação judicial futura.'),
  },
  {
    nome: tr('Proteção da Vida'),
    explicacao: tr('Tratamento necessário para proteger a vida ou a incolumidade física do titular ou de terceiro.'),
    exemplo: tr('Compartilhar dado médico de emergência com um hospital, sem tempo hábil para pedir consentimento.'),
  },
  {
    nome: tr('Tutela da Saúde'),
    explicacao: tr('Tratamento realizado por profissionais de saúde ou entidades sanitárias, para tutela da saúde do titular.'),
    exemplo: tr('Um convênio médico tratando dado de exame do próprio paciente.'),
  },
  {
    nome: tr('Legítimo Interesse'),
    explicacao: tr('Tratamento necessário para atender interesses legítimos do controlador, desde que não prevaleçam sobre os direitos fundamentais do titular.'),
    exemplo: tr('É a hipótese que exige mais cuidado e documentação de justificativa, já que depende de um equilíbrio entre o interesse da empresa e o direito do titular.'),
  },
  {
    nome: tr('Proteção do Crédito'),
    explicacao: tr('Tratamento para proteção do crédito, inclusive o disposto na legislação pertinente.'),
    exemplo: tr('Consulta a histórico de crédito por uma instituição financeira antes de aprovar um empréstimo.'),
  },
];

export function BaseLegalPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to={`/workspaces/${workspaceId}/pilares`}
        className="flex items-center gap-1.5 text-[#0A0A0A] hover:text-[#B4201A] text-sm mb-4 font-medium transition-colors w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />{tr('Voltar ao Guia LGPD')}</Link>

      <div className="flex items-center gap-2.5 mb-1">
        <FileCheck className="w-5 h-5 text-[#B4201A]" />
        <h1 className="text-xl text-[#0A0A0A]">{tr('Base Legal (Hipóteses de Tratamento)')}</h1>
      </div>
      <p className="text-sm text-[#0A0A0A]/55 mb-6">{tr('Art. 7º e 11 da LGPD. Toda atividade de tratamento registrada no ROPA precisa se apoiar em pelo menos uma dessas dez hipóteses.')}</p>

      <div className="space-y-4">
        {HIPOTESES.map((h, i) => (
          <div key={h.nome} className="bg-white rounded-xl p-5 border border-[#0A0A0A]/10">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-xs text-[#B4201A]">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="font-medium text-[#0A0A0A]">{h.nome}</h3>
            </div>
            <p className="text-sm text-[#0A0A0A]/70 leading-relaxed mb-2">{h.explicacao}</p>
            <p className="text-xs text-[#0A0A0A]/50 leading-relaxed bg-[#fbfaf6] rounded-lg p-3">
              <span className="font-medium">{tr('Exemplo prático:')}{' '}</span>
              {h.exemplo}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}