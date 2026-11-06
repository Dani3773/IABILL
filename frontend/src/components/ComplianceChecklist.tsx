import { useEffect, useState, type ReactElement } from "react";
import { CheckCircle2, AlertTriangle, Circle } from "lucide-react";
import { fetchComplianceSummary } from "../api/complianceSummaryService";
import type { ComplianceSummary } from "../types/complianceSummary";

import { tr, trn } from '../i18n/tr'
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
    label: tr('Encarregado (DPO)'),
    status: s.dpoDesignated ? "ok" : "warning",
    detail: s.dpoDesignated
      ? tr('{{a}} designado como Encarregado', { a: s.dpoName })
      : tr('Nenhum Encarregado designado, tema de monitoramento recente da ANPD'),
  });
  rows.push({
    label: tr('Inventário / ROPA'),
    status: s.ropaActivityCount > 0 ? "ok" : "neutral",
    detail: s.ropaActivityCount > 0
      ? trn(s.ropaActivityCount, '{{n}} atividade de tratamento cadastrada', '{{n}} atividades de tratamento cadastradas')
      : tr('Nenhuma atividade cadastrada ainda'),
  });
  if (s.consentActivitiesTotal > 0) {
    rows.push({
      label: tr('Prova de Consentimento'),
      status: s.consentActivitiesMissingProof > 0 ? "warning" : "ok",
      detail: s.consentActivitiesMissingProof > 0
        ? tr('{{a}} de {{b}} com base em Consentimento sem prova coletada ainda', { a: s.consentActivitiesMissingProof, b: s.consentActivitiesTotal })
        : trn(s.consentActivitiesTotal, '{{n}} atividade com base em Consentimento, com prova coletada', '{{n}} atividades com base em Consentimento, todas com prova coletada'),
    });
  }
  rows.push({
    label: tr('Prazo de Retenção'),
    status: s.retentionOverdueCount > 0 ? "warning" : "neutral",
    detail: s.retentionOverdueCount > 0
      ? trn(s.retentionOverdueCount, '{{n}} atividade com prazo de retenção vencido', '{{n}} atividades com prazo de retenção vencido')
      : tr('Nenhuma atividade com prazo de retenção vencido cadastrado'),
  });
  const vendorsMissingDpa = s.vendorsTotal - s.vendorsWithDpaSigned;
  rows.push({
    label: tr('Fornecedores / DPA'),
    status: s.vendorsTotal === 0 ? "neutral" : vendorsMissingDpa > 0 ? "warning" : "ok",
    detail: s.vendorsTotal === 0
      ? tr('Nenhum fornecedor cadastrado')
      : vendorsMissingDpa > 0
        ? tr('{{a}} de {{b}} sem DPA assinado', { a: vendorsMissingDpa, b: s.vendorsTotal })
        : trn(s.vendorsTotal, '{{n}} fornecedor, com DPA assinado', '{{n}} fornecedores, todos com DPA assinado'),
  });

  const untrainedCount = s.employeesActiveTotal - s.employeesTrainedCount;
  rows.push({
    label: tr('Treinamento de Colaboradores'),
    status: s.employeesActiveTotal === 0 ? "neutral" : untrainedCount > 0 ? "warning" : "ok",
    detail: s.employeesActiveTotal === 0
      ? tr('Nenhum colaborador cadastrado')
      : untrainedCount > 0
        ? tr('{{a}} de {{b}} colaboradores ainda não treinados', { a: untrainedCount, b: s.employeesActiveTotal })
        : tr('Todos os {{a}} colaboradores ativos já treinados', { a: s.employeesActiveTotal }),
  });

  rows.push({
    label: tr('Documentos'),
    status: s.documentsOverdueCount > 0 ? "warning" : "ok",
    detail: s.documentsOverdueCount > 0
      ? trn(s.documentsOverdueCount, '{{n}} documento com revisão vencida', '{{n}} documentos com revisão vencida')
      : tr('Nenhum documento com revisão vencida'),
  });

  rows.push({
    label: tr('Incidentes'),
    status: s.incidentsOpenCount > 0 ? "warning" : "ok",
    detail: s.incidentsOpenCount > 0
      ? trn(s.incidentsOpenCount, '{{n}} incidente em aberto', '{{n}} incidentes em aberto')
      : tr('Nenhum incidente em aberto'),
  });
  if (s.incidentNotificationOverdueCount > 0) {
    rows.push({
      label: tr('Prazo de Notificação'),
      status: "warning",
      detail: trn(s.incidentNotificationOverdueCount, '{{n}} incidente com prazo de notificação à autoridade vencido', '{{n}} incidentes com prazo de notificação à autoridade vencido'),
    });
  }
  rows.push({
    label: tr('Política de Privacidade'),
    status: s.privacyPolicyPublished ? "ok" : "neutral",
    detail: s.privacyPolicyPublished
      ? tr('Publicada e acessível publicamente')
      : tr('Ainda não publicada externamente'),
  });
  rows.push({
    label: tr('Solicitações de Titulares'),
    status: s.dsrPendingCount > 0 ? "warning" : "ok",
    detail: s.dsrPendingCount > 0
      ? `${s.dsrPendingCount} ${s.dsrPendingCount !== 1 ? tr('solicitações pendentes') : tr('solicitação pendente')}`
      : tr('Nenhuma solicitação pendente'),
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
        <p className="text-sm text-[#0A0A0A]/40">{tr('Carregando resumo de conformidade...')}</p>
      </div>
    );
  }

  if (!summary) return null;

  const rows = buildRows(summary);

  return (
    <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-5 mb-6">
      <h3 className="text-sm font-medium text-[#0A0A0A]/70 mb-3">{tr('Resumo de Conformidade')}</h3>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-3 text-sm">
            {STATUS_ICON[row.status]}
            <span className="text-[#0A0A0A] font-medium w-52 shrink-0">{row.label}</span>
            <span className="text-[#0A0A0A]/55">{row.detail}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-[#0A0A0A]/35 mt-4 pt-3 border-t border-[#0A0A0A]/8">{tr('Resumo baseado nos dados cadastrados no sistema, não representa comparação com outras empresas.')}</p>
    </div>
  );
}