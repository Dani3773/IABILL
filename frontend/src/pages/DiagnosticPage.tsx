import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ClipboardCheck, CheckCircle2 } from "lucide-react";
import { createActionItem } from "../api/actionItemService";

interface Question {
  id: string;
  text: string;
  legalBasis: string;
  actionTitle: string;
  actionDescription: string;
}

const QUESTIONS: Question[] = [
  {
    id: "dpo",
    text: "Sua empresa tem um Encarregado de Dados (DPO) formalmente designado?",
    legalBasis: "Art. 37 da LGPD",
    actionTitle: "Designar um Encarregado de Dados (DPO)",
    actionDescription: "Atribua o papel de DPO a um colaborador sem conflito de interesse (evite acumular com cargos de TI, Marketing, RH ou Financeiro, conforme orientação da ANPD). Acesse a aba Usuários para atribuir o papel.",
  },
  {
    id: "ropa",
    text: "As atividades de tratamento de dados pessoais já estão registradas (inventário/ROPA)?",
    legalBasis: "Art. 37 da LGPD, Guia ANPD",
    actionTitle: "Preencher o Registro de Operações de Tratamento (ROPA)",
    actionDescription: "Cadastre as atividades de tratamento de dados da empresa na aba Pilares > Inventário/ROPA.",
  },
  {
    id: "psi",
    text: "Existe uma Política de Segurança da Informação (PSI) documentada?",
    legalBasis: "Guia de Segurança da Informação da ANPD",
    actionTitle: "Gerar a Política de Segurança da Informação (PSI)",
    actionDescription: "Crie um documento do tipo PSI na aba Documentos, cobrindo senhas, backup, controle de acesso e demais tópicos recomendados pela ANPD.",
  },
  {
    id: "training",
    text: "Os colaboradores já passaram por treinamento/conscientização sobre proteção de dados?",
    legalBasis: "Guia de Segurança da Informação da ANPD",
    actionTitle: "Registrar o primeiro treinamento de colaboradores",
    actionDescription: "Cadastre os colaboradores e registre um treinamento na aba Pilares > Treinamento.",
  },
  {
    id: "dsr",
    text: "O processo de atendimento a solicitações de titulares de dados está sendo usado/divulgado?",
    legalBasis: "Art. 18 da LGPD",
    actionTitle: "Divulgar o Portal de Solicitação do Titular",
    actionDescription: "Compartilhe o link público do Portal de Solicitação do Titular com clientes/funcionários (disponível na aba Solicitações).",
  },
  {
    id: "incident",
    text: "A equipe está familiarizada com o processo de resposta a incidentes de segurança?",
    legalBasis: "Art. 48 da LGPD",
    actionTitle: "Revisar o processo de resposta a incidentes",
    actionDescription: "Familiarize a equipe com o módulo de Incidentes e os passos de notificação à ANPD e aos titulares.",
  },
  {
    id: "vendor",
    text: "Os fornecedores com acesso a dados pessoais têm contrato de proteção de dados (DPA) assinado?",
    legalBasis: "Art. 39 da LGPD",
    actionTitle: "Confirmar DPAs assinados com fornecedores",
    actionDescription: "Cadastre os fornecedores na aba Pilares > Fornecedores e confirme se há DPA assinado com cada um.",
  },
  {
    id: "mfa",
    text: "A verificação em duas etapas (MFA) está ativada nas contas de acesso ao sistema?",
    legalBasis: "Guia de Segurança da Informação da ANPD",
    actionTitle: "Ativar a verificação em duas etapas (MFA)",
    actionDescription: "Ative o MFA no menu de perfil, na sidebar, para reforçar a segurança de acesso.",
  },
];

export function DiagnosticPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [finished, setFinished] = useState(false);
  const [createdCount, setCreatedCount] = useState(0);

  const question = QUESTIONS[step];
  const isLastStep = step === QUESTIONS.length - 1;

  function answer(value: boolean) {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
    if (isLastStep) {
      handleFinish({ ...answers, [question.id]: value });
    } else {
      setStep((s) => s + 1);
    }
  }

  async function handleFinish(finalAnswers: Record<string, boolean>) {
    if (!workspaceId) return;
    setIsSubmitting(true);
    let count = 0;
    for (const q of QUESTIONS) {
      if (finalAnswers[q.id] === false) {
        try {
          await createActionItem({
            workspaceId,
            title: q.actionTitle,
            description: q.actionDescription,
            source: "AI_SUGGESTED",
          });
          count++;
        } catch {
          // Falha silenciosa numa tarefa individual nao deveria travar o
          // restante do diagnostico - o usuario ainda ve o resumo no final.
        }
      }
    }
    setCreatedCount(count);
    setIsSubmitting(false);
    setFinished(true);
  }

  if (finished) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="w-14 h-14 rounded-full bg-[#14B8A6]/15 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7 text-[#0d7a6d]" />
        </div>
        <h1 className="text-xl font-serif text-[#1B2233] mb-2">Diagnóstico concluído</h1>
        <p className="text-sm text-[#1B2233]/55 mb-6">
          {createdCount > 0
            ? `${createdCount} tarefa${createdCount !== 1 ? "s foram" : " foi"} adicionada${createdCount !== 1 ? "s" : ""} ao Plano de Ação, com base nas respostas.`
            : "Ótimo — nenhuma lacuna identificada nas perguntas deste diagnóstico."}
        </p>
        <button
          onClick={() => navigate(`/workspaces/${workspaceId}/action-plan`)}
          className="bg-[#14B8A6] hover:bg-[#10a595] text-[#0A0D16] text-sm font-semibold rounded-lg px-5 py-2.5 transition-colors"
        >
          Ver Plano de Ação
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto">
      <Link
        to={`/workspaces/${workspaceId}/pilares`}
        className="flex items-center gap-1.5 text-[#0d7a6d] hover:text-[#14B8A6] text-sm mb-4 font-medium transition-colors w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Voltar aos Pilares
      </Link>

      <div className="flex items-center gap-2.5 mb-1">
        <ClipboardCheck className="w-5 h-5 text-[#14B8A6]" />
        <h1 className="text-xl font-serif text-[#1B2233]">Diagnóstico Inicial</h1>
      </div>
      <p className="text-sm text-[#1B2233]/55 mb-6">
        Pergunta {step + 1} de {QUESTIONS.length}
      </p>

      <div className="bg-white rounded-xl p-6 border border-[#1B2233]/10">
        <p className="text-[10px] font-mono uppercase tracking-wide text-[#B8862B] mb-2">
          {question.legalBasis}
        </p>
        <p className="text-[#1B2233] mb-6">{question.text}</p>

        <div className="flex gap-3">
          <button
            onClick={() => answer(true)}
            disabled={isSubmitting}
            className="flex-1 bg-[#14B8A6]/10 hover:bg-[#14B8A6]/20 disabled:opacity-50 text-[#0d7a6d] text-sm font-semibold rounded-lg py-2.5 transition-colors"
          >
            Sim
          </button>
          <button
            onClick={() => answer(false)}
            disabled={isSubmitting}
            className="flex-1 bg-[#1B2233]/5 hover:bg-[#1B2233]/10 disabled:opacity-50 text-[#1B2233] text-sm font-semibold rounded-lg py-2.5 transition-colors"
          >
            Não
          </button>
        </div>
      </div>

      <div className="flex gap-1 mt-4">
        {QUESTIONS.map((q, i) => (
          <div
            key={q.id}
            className={`h-1 flex-1 rounded-full ${i <= step ? "bg-[#14B8A6]" : "bg-[#1B2233]/10"}`}
          />
        ))}
      </div>
    </div>
  );
}