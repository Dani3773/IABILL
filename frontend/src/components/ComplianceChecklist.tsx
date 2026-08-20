import { useEffect, useState, type ReactElement } from "react";
import { CheckCircle2, AlertTriangle, Circle } from "lucide-react";
import { fetchComplianceSummary } from "../api/complianceSummaryService";
import type { ComplianceSummary } from "../types/complianceSummary";

interface Props {
  workspaceId: string;
}

type RowStatus = "ok" | "warning" | "neutral";

interface Row {
  label: string;
  status: RowStatus;
  detail: string;
}

function buildRows(s: ComplianceSummary): Row[] {
  const rows: Row[] = [];

  rows.push({
    label: "Inventário / ROPA",
    status: s.ropaActivityCount > 0 ? "ok" : "neutral",
    detail: s.ropaActivityCount > 0
      ? `${s.ropaActivityCount} atividade${s.ropaActivityCount !== 1 ? "s" : ""} de tratamento cadastrada${s.ropaActivityCount !== 1 ? "s" : ""}`
      : "Nenhuma atividade cadastrada ainda",
  });

  const vendorsMissingDpa = s.vendorsTotal - s.vendorsWithDpaSigned;
  rows.push({
    label: "Fornecedores / DPA",
    status: s.vendorsTotal === 0 ? "neutral" : vendorsMissingDpa > 0 ? "warning" : "ok",
    detail: s.vendorsTotal === 0
      ? "Nenhum fornecedor cadastrado"
      : vendorsMissingDpa > 0
        ? `${vendorsMissingDpa} de ${s.vendorsTotal} sem DPA assinado`
        : `${s.vendorsTotal} fornecedor${s.vendorsTotal !== 1 ? "es" : ""}, todos com DPA assinado`,
  });

  const untrainedCount = s.employeesActiveTotal - s.employeesTrainedCount;
  rows.push({
    label: "Treinamento de Colaboradores",
    status: s.employeesActiveTotal === 0 ? "neutral" : untrainedCount > 0 ? "warning" : "ok",
    detail: s.employeesActiveTotal === 0
      ? "Nenhum colaborador cadastrado"
      : untrainedCount > 0
        ? `${untrainedCount} de ${s.employeesActiveTotal} colaboradores ainda não treinados`
        : `Todos os ${s.employeesActiveTotal} colaboradores ativos já treinados`,
  });

  rows.push({
    label: "Documentos",
    status: s.documentsOverdueCount > 0 ? "warning" : "ok",
    detail: s.documentsOverdueCount > 0
      ? `${s.documentsOverdueCount} documento${s.documentsOverdueCount !== 1 ? "s" : ""} com revisão vencida`
      : "Nenhum documento com revisão vencida",
  });

  rows.push({
    label: "Incidentes",
    status: s.incidentsOpenCount > 0 ? "warning" : "ok",
    detail: s.incidentsOpenCount > 0
      ? `${s.incidentsOpenCount} incidente${s.incidentsOpenCount !== 1 ? "s" : ""} em aberto`
      : "Nenhum incidente em aberto",
  });

  rows.push({
    label: "Solicitações de Titulares",
    status: s.dsrPendingCount > 0 ? "warning" : "ok",
    detail: s.dsrPendingCount > 0
      ? `${s.dsrPendingCount} solicitação${s.dsrPendingCount !== 1 ? "ões" : ""} pendente${s.dsrPendingCount !== 1 ? "s" : ""}`
      : "Nenhuma solicitação pendente",
  });

  return rows;
}

const STATUS_ICON: Record<RowStatus, ReactElement> = {
  ok: <CheckCircle2 className="w-4 h-4 text-[#0d7a6d]" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-600" />,
  neutral: <Circle className="w-4 h-4 text-[#1B2233]/25" />,
};

export function ComplianceChecklist({ workspaceId }: Props) {
  const [summary, setSummary] = useState<ComplianceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchComplianceSummary(workspaceId)
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setIsLoading(false));
  }, [workspaceId]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-[#1B2233]/10 p-5 mb-6">
        <p className="text-sm text-[#1B2233]/40">Carregando resumo de conformidade...</p>
      </div>
    );
  }

  if (!summary) return null;

  const rows = buildRows(summary);

  return (
    <div className="bg-white rounded-xl border border-[#1B2233]/10 p-5 mb-6">
      <h3 className="text-sm font-medium text-[#1B2233]/70 mb-3">Resumo de Conformidade</h3>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-3 text-sm">
            {STATUS_ICON[row.status]}
            <span className="text-[#1B2233] font-medium w-52 shrink-0">{row.label}</span>
            <span className="text-[#1B2233]/55">{row.detail}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-[#1B2233]/35 mt-4 pt-3 border-t border-[#1B2233]/8">
        Resumo baseado nos dados cadastrados no sistema — não representa comparação com outras empresas.
      </p>
    </div>
  );
}