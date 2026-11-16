import { useEffect, useState, type FormEvent } from "react";
import { useLegalRegime } from '../hooks/useLegalRegime'
import { fetchSectors } from "../api/sectorService";
import type { Sector } from "../types/sector";
import { X, ClipboardList } from "lucide-react";
import {
  createProcessingActivity,
  updateProcessingActivity,
} from "../api/processingActivityService";
import { getErrorMessage } from "../api/errorUtils";
import {
  LEGAL_BASIS_LABELS,
  SPECIAL_CATEGORY_EXCEPTION_LABELS,
  type SpecialCategoryException,
  legalBasisLabel,
  legalRegimeLabel,
  LEGAL_REGIME_LABELS,
  RGPD_LEGAL_BASIS_OPTIONS,
  type LegalBasis,
  type ProcessingActivity,
} from "../types/processingActivity";

import { tr } from '../i18n/tr'
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
  const { isRgpd: unitIsRgpd } = useLegalRegime()
  const [processName, setProcessName] = useState(editing?.processName ?? "");
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [sectorId, setSectorId] = useState(editing?.sectorId ?? "");

  useEffect(() => {
    fetchSectors(workspaceId)
      .then(setSectors)
      .catch(() => setSectors([]));
  }, [workspaceId]);
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
  const [jointControllers, setJointControllers] = useState(editing?.jointControllers ?? "");
  const [involvesAutomatedDecisions, setInvolvesAutomatedDecisions] = useState(editing?.involvesAutomatedDecisions ?? false);
  const [automatedDecisionSafeguards, setAutomatedDecisionSafeguards] = useState(editing?.automatedDecisionSafeguards ?? "");
  const [involvesChildrenData, setInvolvesChildrenData] = useState(editing?.involvesChildrenData ?? false);
  const [involvesInternationalTransfer, setInvolvesInternationalTransfer] = useState(editing?.involvesInternationalTransfer ?? false);
  const [internationalTransferDetails, setInternationalTransferDetails] = useState(editing?.internationalTransferDetails ?? "");
  const [specialCategoryException, setSpecialCategoryException] = useState<SpecialCategoryException | "">(editing?.specialCategoryException ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [applicableRegime, setApplicableRegime] = useState<"LGPD" | "RGPD">(
    editing?.applicableRegime ?? (unitIsRgpd ? "RGPD" : "LGPD"),
  );
    const [retentionExpiresAt, setRetentionExpiresAt] = useState(
    editing?.retentionExpiresAt?.slice(0, 10) ?? "",
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const payload = {
        workspaceId,
        sectorId: sectorId || undefined,
        applicableRegime,
        processName,
        purpose,
        legalBasis,
        dataSubjectCategories,
        personalDataCategories,
        dataSharing: dataSharing || undefined,
        securityMeasures: securityMeasures || undefined,
        retentionPeriod: retentionPeriod || undefined,
        retentionExpiresAt: retentionExpiresAt || undefined,
        involvesSensitiveData,
        observations: observations || undefined,
        jointControllers: jointControllers || undefined,
        involvesAutomatedDecisions,
        automatedDecisionSafeguards: involvesAutomatedDecisions ? automatedDecisionSafeguards || undefined : undefined,
        involvesChildrenData,
        involvesInternationalTransfer,
        internationalTransferDetails: involvesInternationalTransfer ? internationalTransferDetails || undefined : undefined,
        specialCategoryException: involvesSensitiveData && applicableRegime === "RGPD" && specialCategoryException ? specialCategoryException : undefined,
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
          tr('Não foi possível salvar a atividade de tratamento.'),
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg bg-[#fbfaf6] text-[#0A0A0A] text-sm px-3 py-2 border border-[#0A0A0A]/10 focus:outline-none focus:ring-2 focus:ring-[#D92B21]/30 focus:border-[#0A0A0A] placeholder:text-[#0A0A0A]/40";
  const labelClass = "block text-xs font-medium text-[#0A0A0A]/60 mb-1.5";

  return (
    <div className="fixed inset-0 bg-[#0A0A0A]/40 flex items-center justify-center px-4 z-50 py-8 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-xl p-6 shadow-2xl border border-[#0A0A0A]/10 my-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D92B21]/10 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-[#B4201A]" />
            </div>
            <h2 className="text-lg text-[#0A0A0A]">
              {editing
                ? tr('Editar Atividade de Tratamento')
                : tr('Nova Atividade de Tratamento')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#0A0A0A]/40 hover:text-[#0A0A0A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>{tr('Regime legal aplicável')}</label>
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
              {(Object.keys(LEGAL_REGIME_LABELS) as ("LGPD" | "RGPD")[]).map((value) => (
                <option key={value} value={value}>
                  {legalRegimeLabel(value)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>{tr('Setor')}{' '}<span className="text-[#0A0A0A]/40">{tr('(opcional)')}</span>
            </label>
            <select
              value={sectorId}
              onChange={(e) => setSectorId(e.target.value)}
              className={inputClass}
            >
              <option value="">{tr('Sem setor definido')}</option>
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>{tr('Nome do processo')}</label>
            <input
              type="text"
              value={processName}
              onChange={(e) => setProcessName(e.target.value)}
              required
              placeholder={tr('Ex: Folha de Pagamento, Recrutamento e Seleção')}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>{tr('Finalidade')}</label>
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              required
              rows={2}
              placeholder={tr('Para que esse processo trata os dados?')}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>{tr('Hipótese legal (base legal)')}</label>
            <select
              value={legalBasis}
              onChange={(e) => setLegalBasis(e.target.value as LegalBasis)}
              className={inputClass}
            >
              {(Object.keys(LEGAL_BASIS_LABELS) as LegalBasis[])
                .filter(
                  (value) =>
                    applicableRegime === "LGPD" ||
                    RGPD_LEGAL_BASIS_OPTIONS.includes(value),
                )
                .map((value) => (
                  <option key={value} value={value}>
                    {legalBasisLabel(value, applicableRegime)}
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{tr('Categorias de titulares')}</label>
              <textarea
                value={dataSubjectCategories}
                onChange={(e) => setDataSubjectCategories(e.target.value)}
                required
                rows={2}
                placeholder={tr('Ex: funcionários, candidatos a vaga')}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{tr('Dados pessoais tratados')}</label>
              <textarea
                value={personalDataCategories}
                onChange={(e) => setPersonalDataCategories(e.target.value)}
                required
                rows={2}
                placeholder={tr('Ex: nome, CPF, dados bancários')}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>{tr('Compartilhamento de dados')}{" "}
              <span className="text-[#0A0A0A]/40">{tr('(opcional)')}</span>
            </label>
            <textarea
              value={dataSharing}
              onChange={(e) => setDataSharing(e.target.value)}
              rows={2}
              placeholder={tr('Com quem esses dados são compartilhados, se houver')}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>{tr('Medidas de segurança')}{" "}
              <span className="text-[#0A0A0A]/40">{tr('(opcional)')}</span>
            </label>
            <textarea
              value={securityMeasures}
              onChange={(e) => setSecurityMeasures(e.target.value)}
              rows={2}
              placeholder={tr('Ex: criptografia, controle de acesso')}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>{tr('Período de armazenamento')}{" "}
                <span className="text-[#0A0A0A]/40">{tr('(opcional)')}</span>
              </label>
              <input
                type="text"
                value={retentionPeriod}
                onChange={(e) => setRetentionPeriod(e.target.value)}
                placeholder={tr('Ex: 5 anos após desligamento')}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{tr('Data limite de retenção')}{" "}
                <span className="text-[#0A0A0A]/40">{tr('(opcional)')}</span>
              </label>
              <input
                type="date"
                value={retentionExpiresAt}
                onChange={(e) => setRetentionExpiresAt(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-[#0A0A0A]/70 cursor-pointer">
            <input
              type="checkbox"
              checked={involvesSensitiveData}
              onChange={(e) => setInvolvesSensitiveData(e.target.checked)}
              className="rounded border-[#0A0A0A]/20 text-[#B4201A] focus:ring-[#D92B21]/30"
            />{tr('Envolve dado pessoal sensível')}</label>
          {involvesSensitiveData && applicableRegime === "RGPD" && (
            <div className="-mt-1">
              <label className={labelClass}>{tr('Exceção do Art. 9, n.º 2 do RGPD')}</label>
              <select
                value={specialCategoryException}
                onChange={(e) => setSpecialCategoryException(e.target.value as SpecialCategoryException | "")}
                className={inputClass}
              >
                <option value="">{tr('Selecione a exceção usada')}</option>
                {(Object.keys(SPECIAL_CATEGORY_EXCEPTION_LABELS) as SpecialCategoryException[]).map((value) => (
                  <option key={value} value={value}>{tr(SPECIAL_CATEGORY_EXCEPTION_LABELS[value])}</option>
                ))}
              </select>
              <p className="text-xs text-amber-700/90 leading-relaxed mt-1">{tr('No RGPD, categorias especiais de dados exigem, além da base do Art. 6, uma destas exceções.')}</p>
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-[#0A0A0A]/70 cursor-pointer">
            <input
              type="checkbox"
              checked={involvesChildrenData}
              onChange={(e) => setInvolvesChildrenData(e.target.checked)}
              className="rounded border-[#0A0A0A]/20 text-[#B4201A] focus:ring-[#D92B21]/30"
            />{tr('Envolve dados de crianças ou adolescentes')}</label>
          {involvesChildrenData && (
            <p className="text-xs text-amber-700/90 leading-relaxed -mt-2">{applicableRegime === "RGPD"
              ? tr('Art. 8 do RGPD: em serviços online oferecidos diretamente a crianças, o consentimento abaixo da idade fixada no país (16 anos por padrão; 13 em Portugal) precisa ser dado pelos pais, e a empresa deve fazer esforços razoáveis para verificar isso.')
              : tr('Art. 14 da LGPD: o tratamento deve ser feito no melhor interesse da criança e do adolescente; para crianças, o consentimento específico de um dos pais ou responsável é exigido quando o consentimento for a base legal.')}</p>
          )}

          <label className="flex items-center gap-2 text-sm text-[#0A0A0A]/70 cursor-pointer">
            <input
              type="checkbox"
              checked={involvesAutomatedDecisions}
              onChange={(e) => setInvolvesAutomatedDecisions(e.target.checked)}
              className="rounded border-[#0A0A0A]/20 text-[#B4201A] focus:ring-[#D92B21]/30"
            />{tr('Há decisões tomadas só por meio automatizado (inclusive perfis)')}</label>
          {involvesAutomatedDecisions && (
            <div className="-mt-1">
              <p className="text-xs text-amber-700/90 leading-relaxed mb-1.5">{applicableRegime === "RGPD"
                ? tr('Art. 22 do RGPD: o titular tem direito a não ficar sujeito a decisão só automatizada que o afete significativamente, salvo contrato, lei ou consentimento explícito; nesses casos, garanta intervenção humana e o direito de contestar.')
                : tr('Art. 20 da LGPD: o titular pode pedir a revisão de decisões tomadas só com base em tratamento automatizado, e a empresa deve informar os critérios usados.')}</p>
              <label className={labelClass}>{tr('Garantias adotadas')}{' '}<span className="text-[#0A0A0A]/40">{tr('(opcional)')}</span></label>
              <textarea value={automatedDecisionSafeguards} onChange={(e) => setAutomatedDecisionSafeguards(e.target.value)} rows={2} placeholder={tr('Ex: revisão humana a pedido, canal para contestar a decisão')} className={inputClass} />
            </div>
          )}

          <label className="flex items-center gap-2 text-sm text-[#0A0A0A]/70 cursor-pointer">
            <input
              type="checkbox"
              checked={involvesInternationalTransfer}
              onChange={(e) => setInvolvesInternationalTransfer(e.target.checked)}
              className="rounded border-[#0A0A0A]/20 text-[#B4201A] focus:ring-[#D92B21]/30"
            />{applicableRegime === "RGPD" ? tr('Há transferência de dados para fora do Espaço Econômico Europeu') : tr('Há transferência internacional de dados (para fora do Brasil)')}</label>
          {involvesInternationalTransfer && (
            <div className="-mt-1">
              <label className={labelClass}>{tr('Destino e garantia usada')}{' '}<span className="text-[#0A0A0A]/40">{tr('(opcional)')}</span></label>
              <textarea value={internationalTransferDetails} onChange={(e) => setInternationalTransferDetails(e.target.value)} rows={2} placeholder={applicableRegime === "RGPD" ? tr('Ex: Estados Unidos, provedor de nuvem, cláusulas contratuais-tipo (Art. 46)') : tr('Ex: Estados Unidos, provedor de nuvem, cláusulas-padrão da Resolução CD/ANPD 19/2024')} className={inputClass} />
            </div>
          )}

          <div>
            <label className={labelClass}>{tr('Corresponsáveis pelo tratamento')}{' '}<span className="text-[#0A0A0A]/40">{tr('(opcional)')}</span></label>
            <input value={jointControllers} onChange={(e) => setJointControllers(e.target.value)} placeholder={tr('Empresas que decidem este tratamento junto com a sua (Art. 26 do RGPD)')} className={inputClass} />
          </div>

          <div>
            <label className={labelClass}>{tr('Observações')}{' '}<span className="text-[#0A0A0A]/40">{tr('(opcional)')}</span>
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
              className="flex-1 bg-[#D92B21] hover:bg-[#B4201A] disabled:opacity-50 text-white text-sm font-semibold rounded-lg py-2.5 transition-colors"
            >
              {isLoading
                ? tr('Salvando...')
                : editing
                  ? tr('Salvar alterações')
                  : tr('Adicionar atividade')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#0A0A0A]/5 hover:bg-[#0A0A0A]/10 text-[#0A0A0A] text-sm font-medium rounded-lg py-2.5 transition-colors"
            >{tr('Cancelar')}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
