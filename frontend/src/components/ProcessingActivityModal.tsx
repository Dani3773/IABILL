import { useState, type FormEvent } from "react";
import { X, ClipboardList } from "lucide-react";
import {
  createProcessingActivity,
  updateProcessingActivity,
} from "../api/processingActivityService";
import { getErrorMessage } from "../api/errorUtils";
import {
  LEGAL_BASIS_LABELS,
  LEGAL_REGIME_LABELS,
  RGPD_LEGAL_BASIS_OPTIONS,
  type LegalBasis,
  type ProcessingActivity,
} from "../types/processingActivity";

interface Props {
  workspaceId: string;
  editing: ProcessingActivity | null;
  onClose: () => void;
  onSaved: (activity: ProcessingActivity) => void;
}

export function ProcessingActivityModal({
  workspaceId,
  editing,
  onClose,
  onSaved,
}: Props) {
  const [processName, setProcessName] = useState(editing?.processName ?? "");
  const [purpose, setPurpose] = useState(editing?.purpose ?? "");
  const [legalBasis, setLegalBasis] = useState<LegalBasis>(
    editing?.legalBasis ?? "CUMPRIMENTO_OBRIGACAO_LEGAL",
  );
  const [dataSubjectCategories, setDataSubjectCategories] = useState(
    editing?.dataSubjectCategories ?? "",
  );
  const [personalDataCategories, setPersonalDataCategories] = useState(
    editing?.personalDataCategories ?? "",
  );
  const [dataSharing, setDataSharing] = useState(editing?.dataSharing ?? "");
  const [securityMeasures, setSecurityMeasures] = useState(
    editing?.securityMeasures ?? "",
  );
  const [retentionPeriod, setRetentionPeriod] = useState(
    editing?.retentionPeriod ?? "",
  );
  const [involvesSensitiveData, setInvolvesSensitiveData] = useState(
    editing?.involvesSensitiveData ?? false,
  );
  const [observations, setObservations] = useState(editing?.observations ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [applicableRegime, setApplicableRegime] = useState<"LGPD" | "RGPD">(
    editing?.applicableRegime ?? "LGPD",
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const payload = {
        workspaceId,
        applicableRegime,
        processName,
        purpose,
        legalBasis,
        dataSubjectCategories,
        personalDataCategories,
        dataSharing: dataSharing || undefined,
        securityMeasures: securityMeasures || undefined,
        retentionPeriod: retentionPeriod || undefined,
        involvesSensitiveData,
        observations: observations || undefined,
      };
      const saved = editing
        ? await updateProcessingActivity(editing.id, payload)
        : await createProcessingActivity(payload);
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(
        getErrorMessage(
          err,
          "Não foi possível salvar a atividade de tratamento.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg bg-[#F5F2EA] text-[#1B2233] text-sm px-3 py-2 border border-[#1B2233]/10 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6] placeholder:text-[#1B2233]/40";
  const labelClass = "block text-xs font-medium text-[#1B2233]/60 mb-1.5";

  return (
    <div className="fixed inset-0 bg-[#1B2233]/40 backdrop-blur-sm flex items-center justify-center px-4 z-50 py-8 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-xl p-6 shadow-2xl border border-[#1B2233]/10 my-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#14B8A6]/10 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-[#14B8A6]" />
            </div>
            <h2 className="text-lg font-serif text-[#1B2233]">
              {editing
                ? "Editar Atividade de Tratamento"
                : "Nova Atividade de Tratamento"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#1B2233]/40 hover:text-[#1B2233] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div>
          <label className={labelClass}>Regime legal aplicável</label>
          <select
            value={applicableRegime}
            onChange={(e) => {
              const regime = e.target.value as "LGPD" | "RGPD";
              setApplicableRegime(regime);
              // Se a hipotese legal atual nao existe no RGPD, reseta para a primeira opcao valida
              if (
                regime === "RGPD" &&
                !RGPD_LEGAL_BASIS_OPTIONS.includes(legalBasis)
              ) {
                setLegalBasis(RGPD_LEGAL_BASIS_OPTIONS[0]);
              }
            }}
            className={inputClass}
          >
            {Object.entries(LEGAL_REGIME_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Nome do processo</label>
            <input
              type="text"
              value={processName}
              onChange={(e) => setProcessName(e.target.value)}
              required
              placeholder="Ex: Folha de Pagamento, Recrutamento e Seleção"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Finalidade</label>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              required
              rows={2}
              placeholder="Para que esse processo trata os dados?"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Hipótese legal (base legal)</label>
            <select
              value={legalBasis}
              onChange={(e) => setLegalBasis(e.target.value as LegalBasis)}
              className={inputClass}
            >
              {Object.entries(LEGAL_BASIS_LABELS)
                .filter(([value]) => applicableRegime === "LGPD" || RGPD_LEGAL_BASIS_OPTIONS.includes(value as LegalBasis))
                .map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Categorias de titulares</label>
              <textarea
                value={dataSubjectCategories}
                onChange={(e) => setDataSubjectCategories(e.target.value)}
                required
                rows={2}
                placeholder="Ex: funcionários, candidatos a vaga"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Dados pessoais tratados</label>
              <textarea
                value={personalDataCategories}
                onChange={(e) => setPersonalDataCategories(e.target.value)}
                required
                rows={2}
                placeholder="Ex: nome, CPF, dados bancários"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>
              Compartilhamento de dados{" "}
              <span className="text-[#1B2233]/40">(opcional)</span>
            </label>
            <textarea
              value={dataSharing}
              onChange={(e) => setDataSharing(e.target.value)}
              rows={2}
              placeholder="Com quem esses dados são compartilhados, se houver"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Medidas de segurança{" "}
              <span className="text-[#1B2233]/40">(opcional)</span>
            </label>
            <textarea
              value={securityMeasures}
              onChange={(e) => setSecurityMeasures(e.target.value)}
              rows={2}
              placeholder="Ex: criptografia, controle de acesso"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 items-start">
            <div>
              <label className={labelClass}>
                Período de armazenamento{" "}
                <span className="text-[#1B2233]/40">(opcional)</span>
              </label>
              <input
                type="text"
                value={retentionPeriod}
                onChange={(e) => setRetentionPeriod(e.target.value)}
                placeholder="Ex: 5 anos após desligamento"
                className={inputClass}
              />
            </div>
            <div className="pt-6">
              <label className="flex items-center gap-2 text-sm text-[#1B2233]/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={involvesSensitiveData}
                  onChange={(e) => setInvolvesSensitiveData(e.target.checked)}
                  className="rounded border-[#1B2233]/20 text-[#14B8A6] focus:ring-[#14B8A6]/30"
                />
                Envolve dado pessoal sensível
              </label>
            </div>
          </div>

          <div>
            <label className={labelClass}>
              Observações <span className="text-[#1B2233]/40">(opcional)</span>
            </label>
            <textarea
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={2}
              className={inputClass}
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-[#14B8A6] hover:bg-[#10a595] disabled:opacity-50 text-[#0A0D16] text-sm font-semibold rounded-lg py-2.5 transition-colors"
            >
              {isLoading
                ? "Salvando..."
                : editing
                  ? "Salvar alterações"
                  : "Adicionar atividade"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#1B2233]/5 hover:bg-[#1B2233]/10 text-[#1B2233] text-sm font-medium rounded-lg py-2.5 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
