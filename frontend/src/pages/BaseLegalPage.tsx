import { useParams, Link } from "react-router-dom";
import { ArrowLeft, FileCheck } from "lucide-react";

interface Hipotese {
  nome: string;
  explicacao: string;
  exemplo: string;
}

const HIPOTESES: Hipotese[] = [
  {
    nome: "Consentimento",
    explicacao: "O titular autoriza de forma livre, informada, e inequívoca o tratamento do seu dado para uma finalidade específica.",
    exemplo: "É a hipótese mais exigente de provar, por isso o sistema tem um módulo próprio de coleta formal de consentimento, com registro de nome, e-mail, IP, e data.",
  },
  {
    nome: "Cumprimento de Obrigação Legal",
    explicacao: "O tratamento é necessário para que a empresa cumpra uma exigência prevista em lei.",
    exemplo: "Guardar dado fiscal de nota emitida por um prazo mínimo exigido pela legislação tributária.",
  },
  {
    nome: "Execução de Políticas Públicas",
    explicacao: "Tratamento realizado pela administração pública para execução de políticas previstas em lei.",
    exemplo: "Aplicável principalmente a órgãos públicos, raramente usada por empresa privada comum.",
  },
  {
    nome: "Estudos por Órgão de Pesquisa",
    explicacao: "Tratamento realizado para a realização de estudos, garantida a anonimização sempre que possível.",
    exemplo: "Uma universidade tratando dado de pesquisa acadêmica anonimizado.",
  },
  {
    nome: "Execução de Contrato",
    explicacao: "O tratamento é necessário para cumprir um contrato do qual o titular é parte, ou para diligências pré-contratuais a pedido dele.",
    exemplo: "Tratar o e-mail e a senha de um usuário para ele conseguir usar o serviço que contratou, exatamente como o próprio sistema faz.",
  },
  {
    nome: "Exercício Regular de Direitos",
    explicacao: "Tratamento necessário para exercício de direitos em processo judicial, administrativo, ou arbitral.",
    exemplo: "Guardar prova documental para se defender numa eventual ação judicial futura.",
  },
  {
    nome: "Proteção da Vida",
    explicacao: "Tratamento necessário para proteger a vida ou a incolumidade física do titular ou de terceiro.",
    exemplo: "Compartilhar dado médico de emergência com um hospital, sem tempo hábil para pedir consentimento.",
  },
  {
    nome: "Tutela da Saúde",
    explicacao: "Tratamento realizado por profissionais de saúde ou entidades sanitárias, para tutela da saúde do titular.",
    exemplo: "Um convênio médico tratando dado de exame do próprio paciente.",
  },
  {
    nome: "Legítimo Interesse",
    explicacao: "Tratamento necessário para atender interesses legítimos do controlador, desde que não prevaleçam sobre os direitos fundamentais do titular.",
    exemplo: "É a hipótese que exige mais cuidado e documentação de justificativa, já que depende de um equilíbrio entre o interesse da empresa e o direito do titular.",
  },
  {
    nome: "Proteção do Crédito",
    explicacao: "Tratamento para proteção do crédito, inclusive o disposto na legislação pertinente.",
    exemplo: "Consulta a histórico de crédito por uma instituição financeira antes de aprovar um empréstimo.",
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
        <ArrowLeft className="w-3.5 h-3.5" />
        Voltar ao Guia LGPD
      </Link>

      <div className="flex items-center gap-2.5 mb-1">
        <FileCheck className="w-5 h-5 text-[#B4201A]" />
        <h1 className="text-xl text-[#0A0A0A]">Base Legal (Hipóteses de Tratamento)</h1>
      </div>
      <p className="text-sm text-[#0A0A0A]/55 mb-6">
        Art. 7º e 11 da LGPD. Toda atividade de tratamento registrada no ROPA precisa se apoiar em pelo menos uma dessas dez hipóteses.
      </p>

      <div className="space-y-4">
        {HIPOTESES.map((h, i) => (
          <div key={h.nome} className="bg-white rounded-xl p-5 border border-[#0A0A0A]/10">
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-xs text-[#B4201A]">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="font-medium text-[#0A0A0A]">{h.nome}</h3>
            </div>
            <p className="text-sm text-[#0A0A0A]/70 leading-relaxed mb-2">{h.explicacao}</p>
            <p className="text-xs text-[#0A0A0A]/50 leading-relaxed bg-[#fbfaf6] rounded-lg p-3">
              <span className="font-medium">Exemplo prático: </span>
              {h.exemplo}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}