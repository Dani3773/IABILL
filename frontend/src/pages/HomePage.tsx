import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Alert } from "../components/Alert";
import { useWorkspaces } from "../contexts/WorkspaceContext";
import { useAuth } from "../contexts/AuthContext";
import { useAdequacyPath } from "../hooks/useAdequacyPath";
import { formatCnpj } from "../utils/format";
import {
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUS_STYLES,
  DOCUMENT_TYPE_SHORT_LABELS,
} from "../utils/documentLabels";
import type { ComplianceSummary } from "../types/complianceSummary";
import type { Document } from "../types/document";
import type { ActionItem } from "../types/actionItem";

type Tone = "danger" | "warning" | "info";

interface AttentionRow {
  tone: Tone;
  title: string;
  detail: string;
  to: string;
}

function plural(count: number, singular: string, pluralForm: string) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function buildAttention(
  base: string,
  summary: ComplianceSummary | null,
  documents: Document[],
  actions: ActionItem[],
  canManageUsers: boolean,
): AttentionRow[] {
  const rows: AttentionRow[] = [];

  if (summary) {
    if (summary.incidentNotificationOverdueCount > 0) {
      rows.push({
        tone: "danger",
        title: `${plural(summary.incidentNotificationOverdueCount, "incidente", "incidentes")} com prazo vencido`,
        detail: "A comunicação à ANPD passou do prazo calculado.",
        to: `${base}/incidents`,
      });
    }
    if (summary.incidentsOpenCount > 0) {
      rows.push({
        tone: "warning",
        title: `${plural(summary.incidentsOpenCount, "incidente aberto", "incidentes abertos")}`,
        detail: "Acompanhe a avaliação e as notificações.",
        to: `${base}/incidents`,
      });
    }
    if (summary.dsrPendingCount > 0) {
      rows.push({
        tone: "warning",
        title: `${plural(summary.dsrPendingCount, "solicitação pendente", "solicitações pendentes")}`,
        detail: "Pedidos de titulares aguardando resposta.",
        to: `${base}/data-subject-requests`,
      });
    }
    if (!summary.dpoDesignated) {
      rows.push({
        tone: "warning",
        title: "Encarregado (DPO) não designado",
        detail: "Item priorizado na fiscalização da ANPD.",
        to: canManageUsers ? "/users" : `${base}/pilares/quem-e-quem`,
      });
    }
    if (summary.retentionOverdueCount > 0) {
      rows.push({
        tone: "warning",
        title: `${plural(summary.retentionOverdueCount, "atividade", "atividades")} com retenção vencida`,
        detail: "Revise o prazo de guarda no inventário.",
        to: `${base}/pilares/ropa`,
      });
    }
    if (summary.consentActivitiesMissingProof > 0) {
      rows.push({
        tone: "warning",
        title: `${plural(summary.consentActivitiesMissingProof, "atividade", "atividades")} sem prova de consentimento`,
        detail: "Colete a prova pelo link público da atividade.",
        to: `${base}/pilares/ropa`,
      });
    }
  }

  const needsReview = documents.filter(
    (d) =>
      d.reviewRecommended || (d.reviewDueAt && new Date(d.reviewDueAt) < new Date()),
  ).length;
  if (needsReview > 0) {
    rows.push({
      tone: "warning",
      title: `${plural(needsReview, "documento precisa", "documentos precisam")} de revisão`,
      detail: "Revisão recomendada ou periódica vencida.",
      to: `${base}/documents?atencao=1`,
    });
  }

  const generated = documents.filter((d) => d.status === "GENERATED").length;
  if (generated > 0) {
    rows.push({
      tone: "info",
      title: `${plural(generated, "documento aguardando", "documentos aguardando")} revisão humana`,
      detail: "Gerados por IA, ainda sem revisão.",
      to: `${base}/documents?status=GENERATED`,
    });
  }

  const reviewed = documents.filter((d) => d.status === "REVIEWED").length;
  if (reviewed > 0) {
    rows.push({
      tone: "info",
      title: `${plural(reviewed, "documento aguardando", "documentos aguardando")} aprovação`,
      detail: "Já revisados, falta a aprovação final.",
      to: `${base}/documents?status=REVIEWED`,
    });
  }

  if (summary) {
    const missingDpa = summary.vendorsTotal - summary.vendorsWithDpaSigned;
    if (missingDpa > 0) {
      rows.push({
        tone: "info",
        title: `${plural(missingDpa, "fornecedor", "fornecedores")} sem DPA assinado`,
        detail: "O contrato confirma como eles tratam os dados.",
        to: `${base}/pilares/fornecedores`,
      });
    }
    const untrained = summary.employeesActiveTotal - summary.employeesTrainedCount;
    if (untrained > 0) {
      rows.push({
        tone: "info",
        title: `${plural(untrained, "colaborador", "colaboradores")} sem treinamento`,
        detail: "Registre a conscientização de cada pessoa.",
        to: `${base}/pilares/treinamento`,
      });
    }
    if (!summary.privacyPolicyPublished) {
      rows.push({
        tone: "info",
        title: "Política de privacidade não publicada",
        detail: "Aprove e publique para gerar o link público.",
        to: `${base}/documents?tipo=POLITICA_PRIVACIDADE`,
      });
    }
  }

  const openActions = actions.filter((a) => a.status !== "DONE").length;
  if (openActions > 0) {
    rows.push({
      tone: "info",
      title: `${plural(openActions, "tarefa aberta", "tarefas abertas")} no plano de ação`,
      detail: "Pendentes ou em andamento.",
      to: `${base}/action-plan`,
    });
  }

  return rows;
}

const TONE_ICON: Record<Tone, string> = {
  danger: "text-[#B4201A] bg-[#D92B21]/10",
  warning: "text-amber-700 bg-amber-100",
  info: "text-[#0A0A0A]/60 bg-[#0A0A0A]/6",
};

function Stat({ label, value, to }: { label: string; value: string; to: string }) {
  return (
    <Link
      to={to}
      className="flex items-baseline justify-between gap-3 py-2.5 border-b border-[#0A0A0A]/8 last:border-0 hover:text-[#B4201A] transition-colors"
    >
      <span className="text-sm text-[#0A0A0A]/70">{label}</span>
      <span className="text-sm font-semibold text-[#0A0A0A] text-right">{value}</span>
    </Link>
  );
}

export function HomePage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { currentWorkspace, openAssistant } = useWorkspaces();
  const { role } = useAuth();
  const [question, setQuestion] = useState("");
  const { summary, documents, actions, path, isLoading, failed } = useAdequacyPath(workspaceId);

  function handleAsk(e: FormEvent) {
    e.preventDefault();
    const text = question.trim();
    if (!text) return;
    openAssistant("chat", text);
    setQuestion("");
  }

  if (isLoading) return <LoadingSpinner label="Carregando a unidade..." />;

  const base = `/workspaces/${workspaceId}`;
  const canManageUsers = role === "ADMIN" || role === "SUPER_ADMIN";
  const attention = buildAttention(base, summary, documents, actions, canManageUsers);
  const approved = documents.filter((d) => d.status === "APPROVED").length;
  const recent = [...documents]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 5);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl text-[#0A0A0A]">{currentWorkspace?.name ?? "Início"}</h1>
        {currentWorkspace && (
          <p className="text-sm text-[#0A0A0A]/55 mt-0.5">
            {currentWorkspace.type === "MATRIZ" ? "Matriz" : "Filial"} · CNPJ{" "}
            {formatCnpj(currentWorkspace.documentId)}
          </p>
        )}
      </div>

      <form
        onSubmit={handleAsk}
        className="flex items-center gap-2 bg-white rounded-xl border border-[#0A0A0A]/15 focus-within:border-[#D92B21] pl-4 pr-2 py-2 mb-6 transition-colors"
      >
        <Sparkles className="w-4 h-4 text-[#B4201A] shrink-0" />
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          aria-label="Pergunte ao assistente"
          placeholder="Pergunte sobre os documentos desta unidade..."
          className="flex-1 min-w-0 bg-transparent text-[15px] text-[#0A0A0A] py-1.5 focus:outline-none placeholder:text-[#0A0A0A]/50"
        />
        <button
          type="submit"
          disabled={!question.trim()}
          className="bg-[#D92B21] hover:bg-[#B4201A] disabled:opacity-50 text-white text-sm font-semibold rounded-lg px-4 py-2 transition-colors shrink-0"
        >
          Perguntar
        </button>
      </form>

      <Link
        to={`${base}/caminho`}
        className="block bg-white rounded-xl border border-[#0A0A0A]/10 hover:border-[#D92B21]/50 px-5 py-4 mb-6 transition-colors"
      >
        <span className="flex items-center justify-between gap-3">
          <span className="min-w-0">
            <span className="block text-[13px] text-[#0A0A0A]/60">Caminho de Adequação</span>
            <span className="block text-base text-[#0A0A0A]">
              {path.nextStage
                ? `Etapa ${path.nextStage.number} de ${path.stages.length}: ${path.nextStage.title}`
                : "Todas as etapas concluídas"}
            </span>
          </span>
          <span className="flex items-center gap-1.5 text-sm font-semibold text-[#B4201A] shrink-0">
            {path.nextStage ? "Continuar" : "Revisar"} <ArrowRight className="w-4 h-4" />
          </span>
        </span>
        <span className="block h-1.5 rounded-full bg-[#0A0A0A]/8 overflow-hidden mt-3">
          <span className="block h-full bg-[#D92B21] rounded-full" style={{ width: `${path.percent}%` }} />
        </span>
        <span className="block text-[13px] text-[#0A0A0A]/60 mt-1.5">
          {path.doneCount} de {path.totalCount} itens concluídos
        </span>
      </Link>

      {failed && (
        <div className="mb-4">
          <Alert type="error" message="Parte das informações não pôde ser carregada. Atualize a página." />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start">
        <section className="bg-white rounded-xl border border-[#0A0A0A]/10">
          <h2 className="text-base text-[#0A0A0A] px-5 py-4 border-b border-[#0A0A0A]/8">
            Precisa de atenção
            {attention.length > 0 && (
              <span className="ml-2 text-sm text-[#0A0A0A]/50">{attention.length}</span>
            )}
          </h2>
          {attention.length === 0 ? (
            <div className="flex items-center gap-3 px-5 py-8">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
              <p className="text-sm text-[#0A0A0A]/70">Nada pendente nesta unidade.</p>
            </div>
          ) : (
            <ul>
              {attention.map((row) => (
                <li key={row.title} className="border-b border-[#0A0A0A]/8 last:border-0">
                  <Link
                    to={row.to}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-[#0A0A0A]/3 transition-colors"
                  >
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${TONE_ICON[row.tone]}`}
                    >
                      {row.tone === "danger" ? (
                        <ShieldAlert className="w-4 h-4" />
                      ) : row.tone === "warning" ? (
                        <AlertTriangle className="w-4 h-4" />
                      ) : (
                        <ClipboardCheck className="w-4 h-4" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-[#0A0A0A]">{row.title}</span>
                      <span className="block text-[13px] text-[#0A0A0A]/60">{row.detail}</span>
                    </span>
                    <ArrowRight className="w-4 h-4 text-[#0A0A0A]/30 shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-6">
          <section className="bg-white rounded-xl border border-[#0A0A0A]/10 px-5 py-4">
            <h2 className="text-base text-[#0A0A0A] mb-1">Panorama</h2>
            <Stat
              label="Documentos aprovados"
              value={`${approved} de ${documents.length}`}
              to={`${base}/documents`}
            />
            {summary && (
              <>
                <Stat
                  label="Atividades no inventário"
                  value={String(summary.ropaActivityCount)}
                  to={`${base}/pilares/ropa`}
                />
                <Stat
                  label="Fornecedores com DPA"
                  value={`${summary.vendorsWithDpaSigned} de ${summary.vendorsTotal}`}
                  to={`${base}/pilares/fornecedores`}
                />
                <Stat
                  label="Colaboradores treinados"
                  value={`${summary.employeesTrainedCount} de ${summary.employeesActiveTotal}`}
                  to={`${base}/pilares/treinamento`}
                />
                <Stat
                  label="Encarregado (DPO)"
                  value={summary.dpoName ?? "Não designado"}
                  to={canManageUsers ? "/users" : `${base}/pilares/quem-e-quem`}
                />
              </>
            )}
          </section>

          <section className="bg-white rounded-xl border border-[#0A0A0A]/10 px-5 py-4">
            <div className="flex items-baseline justify-between mb-1">
              <h2 className="text-base text-[#0A0A0A]">Documentos recentes</h2>
              <Link to={`${base}/documents`} className="text-[13px] text-[#B4201A] hover:underline">
                Ver todos
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="text-sm text-[#0A0A0A]/60 py-2">Nenhum documento ainda.</p>
            ) : (
              recent.map((doc) => (
                <Link
                  key={doc.id}
                  to={`/documents/${doc.id}`}
                  className="flex items-center gap-2.5 py-2.5 border-b border-[#0A0A0A]/8 last:border-0 group"
                >
                  <FileText className="w-4 h-4 text-[#0A0A0A]/40 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm text-[#0A0A0A] truncate group-hover:text-[#B4201A]">
                      {doc.title}
                    </span>
                    <span className="block text-xs text-[#0A0A0A]/55">
                      {DOCUMENT_TYPE_SHORT_LABELS[doc.type]}
                    </span>
                  </span>
                  <span
                    className={`text-[11px] px-1.5 py-0.5 rounded shrink-0 ${DOCUMENT_STATUS_STYLES[doc.status]}`}
                  >
                    {DOCUMENT_STATUS_LABELS[doc.status]}
                  </span>
                </Link>
              ))
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
