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
    label: "Encarregado (DPO)",
    status: s.dpoDesignated ? "ok" : "warning",
    detail: s.dpoDesignated
      ? `${s.dpoName} designado como Encarregado`
      : "Nenhum Encarregado designado, tema de monitoramento recente da ANPD",
  });
  rows.push({
    label: "Inventário / ROPA",
    status: s.ropaActivityCount > 0 ? "ok" : "neutral",
    detail: s.ropaActivityCount > 0
      ? `${s.ropaActivityCount} atividade${s.ropaActivityCount !== 1 ? "s" : ""} de tratamento cadastrada${s.ropaActivityCount !== 1 ? "s" : ""}`
      : "Nenhuma atividade cadastrada ainda",
  });
  if (s.consentActivitiesTotal > 0) {
    rows.push({
      label: "Prova de Consentimento",
      status: s.consentActivitiesMissingProof > 0 ? "warning" : "ok",
      detail: s.consentActivitiesMissingProof > 0
        ? `${s.consentActivitiesMissingProof} de ${s.consentActivitiesTotal} atividade${s.consentActivitiesTotal !== 1 ? "s" : ""} sem prova coletada ainda`
        : `${s.consentActivitiesTotal} atividade${s.consentActivitiesTotal !== 1 ? "s" : ""} com base em Consentimento, todas com prova coletada`,
    });
  }
  rows.push({
    label: "Prazo de Retenção",
    status: s.retentionOverdueCount > 0 ? "warning" : "neutral",
    detail: s.retentionOverdueCount > 0
      ? `${s.retentionOverdueCount} atividade${s.retentionOverdueCount !== 1 ? "s" : ""} com prazo de retenção vencido`
      : "Nenhuma atividade com prazo de retenção vencido cadastrado",
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
  if (s.incidentNotificationOverdueCount > 0) {
    rows.push({
      label: "Prazo de Notificação",
      status: "warning",
      detail: `${s.incidentNotificationOverdueCount} incidente${s.incidentNotificationOverdueCount !== 1 ? "s" : ""} com prazo de notificação à ANPD vencido`,
    });
  }
  rows.push({
    label: "Política de Privacidade",
    status: s.privacyPolicyPublished ? "ok" : "neutral",
    detail: s.privacyPolicyPublished
      ? "Publicada e acessível publicamente"
      : "Ainda não publicada externamente",
  });
  rows.push({
    label: "Solicitações de Titulares",
    status: s.dsrPendingCount > 0 ? "warning" : "ok",
    detail: s.dsrPendingCount > 0
      ? `${s.dsrPendingCount} ${s.dsrPendingCount !== 1 ? "solicitações pendentes" : "solicitação pendente"}`
      : "Nenhuma solicitação pendente",
  });

  return rows;
}

const STATUS_ICON: Record<RowStatus, ReactElement> = {
  ok: <CheckCircle2 className="w-4 h-4 text-[#0A0A0A]" />,
  warning: <AlertTriangle className="w-4 h-4 text-amber-600" />,
  neutral: <Circle className="w-4 h-4 text-[#0A0A0A]/25" />,
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
      <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5 mb-6">
        <p className="text-sm text-[#0A0A0A]/40">Carregando resumo de conformidade...</p>
      </div>
    );
  }

  if (!summary) return null;

  const rows = buildRows(summary);

  return (
    <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5 mb-6">
      <h3 className="text-sm font-medium text-[#0A0A0A]/70 mb-3">Resumo de Conformidade</h3>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-3 text-sm">
            {STATUS_ICON[row.status]}
            <span className="text-[#0A0A0A] font-medium w-52 shrink-0">{row.label}</span>
            <span className="text-[#0A0A0A]/55">{row.detail}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-[#0A0A0A]/35 mt-4 pt-3 border-t border-[#0A0A0A]/8">
        Resumo baseado nos dados cadastrados no sistema, não representa comparação com outras empresas.
      </p>
    </div>
  );
}