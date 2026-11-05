import { useEffect, useState, type FormEvent } from "react";
import { fetchSectors } from "../api/sectorService";
import type { Sector } from "../types/sector";
import { X, Truck } from "lucide-react";
import { createVendor, updateVendor } from "../api/vendorService";
import { getErrorMessage } from "../api/errorUtils";
import type { Vendor } from "../types/vendor";
import type { TransferSafeguard } from "../types/vendor";

const TRANSFER_SAFEGUARD_LABELS: Record<TransferSafeguard, string> = {
  DECISAO_ADEQUACAO: "Decisão de Adequação",
  CLAUSULAS_CONTRATUAIS_PADRAO: "Cláusulas Contratuais Padrão",
  CONSENTIMENTO_ESPECIFICO: "Consentimento Específico do Titular",
  OUTRO: "Outro",
};

interface Props {
  workspaceId: string;
  editing: Vendor | null;
  onClose: () => void;
  onSaved: (vendor: Vendor) => void;
}

export function VendorModal({ workspaceId, editing, onClose, onSaved }: Props) {
  const [name, setName] = useState(editing?.name ?? "");
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [sectorId, setSectorId] = useState(editing?.sectorId ?? "");

  useEffect(() => {
    fetchSectors(workspaceId)
      .then(setSectors)
      .catch(() => setSectors([]));
  }, [workspaceId]);
  const [serviceProvided, setServiceProvided] = useState(
    editing?.serviceProvided ?? "",
  );
  const [sharedDataCategories, setSharedDataCategories] = useState(
    editing?.sharedDataCategories ?? "",
  );
  const [dpaSigned, setDpaSigned] = useState(editing?.dpaSigned ?? false);
  const [dpaSignedAt, setDpaSignedAt] = useState(
    editing?.dpaSignedAt?.slice(0, 10) ?? "",
  );
  const [securityClausesConfirmed, setSecurityClausesConfirmed] = useState(
    editing?.securityClausesConfirmed ?? false,
  );
  const [observations, setObservations] = useState(editing?.observations ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [involvesInternationalTransfer, setInvolvesInternationalTransfer] =
    useState(editing?.involvesInternationalTransfer ?? false);
  const [destinationCountry, setDestinationCountry] = useState(
    editing?.destinationCountry ?? "",
  );
  const [transferSafeguard, setTransferSafeguard] = useState<
    TransferSafeguard | ""
  >(editing?.transferSafeguard ?? "");
  const [transferSafeguardDetails, setTransferSafeguardDetails] = useState(
    editing?.transferSafeguardDetails ?? "",
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    if (dpaSigned && !dpaSignedAt) {
      setError(
        'Informe a data de assinatura do DPA, ou desmarque a opção "DPA assinado".',
      );
      return;
    }
    try {
      const payload = {
        workspaceId,
        sectorId: sectorId || undefined,
        name,
        serviceProvided,
        sharedDataCategories,
        dpaSigned,
        dpaSignedAt: dpaSignedAt || undefined,
        securityClausesConfirmed,
        observations: observations || undefined,
        involvesInternationalTransfer,
        destinationCountry: involvesInternationalTransfer ? destinationCountry || undefined : undefined,
        transferSafeguard: involvesInternationalTransfer && transferSafeguard ? transferSafeguard : undefined,
        transferSafeguardDetails: involvesInternationalTransfer ? transferSafeguardDetails || undefined : undefined,
      };
      const saved = editing
        ? await updateVendor(editing.id, payload)
        : await createVendor(payload);
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível salvar o fornecedor."));
    } finally {
      setIsLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg bg-[#FBF8F8] text-[#0A0A0A] text-sm px-3 py-2 border border-[#0A0A0A]/10 focus:outline-none focus:ring-2 focus:ring-[#D92B21]/30 focus:border-[#0A0A0A] placeholder:text-[#0A0A0A]/40";
  const labelClass = "block text-xs font-medium text-[#0A0A0A]/60 mb-1.5";

  return (
    <div className="fixed inset-0 bg-[#0A0A0A]/40 flex items-center justify-center px-4 z-50 py-8 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-xl p-6 shadow-2xl border border-[#0A0A0A]/10 my-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D92B21]/10 flex items-center justify-center">
              <Truck className="w-4 h-4 text-[#B4201A]" />
            </div>
            <h2 className="text-lg text-[#0A0A0A]">
              {editing ? "Editar Fornecedor" : "Novo Fornecedor"}
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
            <label className={labelClass}>
              Setor <span className="text-[#0A0A0A]/40">(opcional)</span>
            </label>
            <select
              value={sectorId}
              onChange={(e) => setSectorId(e.target.value)}
              className={inputClass}
            >
              <option value="">Sem setor definido</option>
              {sectors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Nome do fornecedor</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ex: AWS, Operadora de Plano de Saúde X"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Serviço prestado</label>
            <textarea
              value={serviceProvided}
              onChange={(e) => setServiceProvided(e.target.value)}
              required
              rows={2}
              placeholder="Ex: Infraestrutura de nuvem, gestão de benefícios"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>
              Categorias de dado compartilhado
            </label>
            <textarea
              value={sharedDataCategories}
              onChange={(e) => setSharedDataCategories(e.target.value)}
              required
              rows={2}
              placeholder="Ex: dados de identificação, dados bancários"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm text-[#0A0A0A]/70 cursor-pointer">
              <input
                type="checkbox"
                checked={dpaSigned}
                onChange={(e) => setDpaSigned(e.target.checked)}
                className="rounded border-[#0A0A0A]/20 text-[#B4201A] focus:ring-[#D92B21]/30"
              />
              DPA assinado
            </label>
            <label className="flex items-center gap-2 text-sm text-[#0A0A0A]/70 cursor-pointer">
              <input
                type="checkbox"
                checked={securityClausesConfirmed}
                onChange={(e) => setSecurityClausesConfirmed(e.target.checked)}
                className="rounded border-[#0A0A0A]/20 text-[#B4201A] focus:ring-[#D92B21]/30"
              />
              Cláusulas de segurança confirmadas
            </label>
          </div>

                    <div className="border-t border-[#0A0A0A]/8 pt-4">
            <label className="flex items-center gap-2 text-sm text-[#0A0A0A]/70 cursor-pointer mb-1">
              <input
                type="checkbox"
                checked={involvesInternationalTransfer}
                onChange={(e) => setInvolvesInternationalTransfer(e.target.checked)}
                className="rounded border-[#0A0A0A]/20 text-[#B4201A] focus:ring-[#D92B21]/30"
              />
              Envolve transferência internacional de dados
            </label>
            <p className="text-xs text-[#0A0A0A]/45 mb-3">
              Marque se este fornecedor está sediado fora do Brasil, ou processa dado em servidor fora do país.
            </p>
            {involvesInternationalTransfer && (
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>País de destino</label>
                  <input
                    type="text"
                    value={destinationCountry}
                    onChange={(e) => setDestinationCountry(e.target.value)}
                    placeholder="Ex: Estados Unidos, Irlanda"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Garantia de proteção usada</label>
                  <select
                    value={transferSafeguard}
                    onChange={(e) => setTransferSafeguard(e.target.value as TransferSafeguard)}
                    className={inputClass}
                  >
                    <option value="">Selecione</option>
                    {Object.entries(TRANSFER_SAFEGUARD_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>
                    Detalhes da garantia <span className="text-[#0A0A0A]/40">(opcional)</span>
                  </label>
                  <textarea
                    value={transferSafeguardDetails}
                    onChange={(e) => setTransferSafeguardDetails(e.target.value)}
                    rows={2}
                    placeholder="Ex: qual cláusula específica, ou detalhe da decisão de adequação aplicável"
                    className={inputClass}
                  />
                </div>
              </div>
            )}
          </div>

          {dpaSigned && (
            <div>
              <label className={labelClass}>Data de assinatura do DPA</label>
              <input
                type="date"
                value={dpaSignedAt}
                onChange={(e) => setDpaSignedAt(e.target.value)}
                required
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label className={labelClass}>
              Observações <span className="text-[#0A0A0A]/40">(opcional)</span>
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
              className="flex-1 bg-[#0A0A0A] hover:bg-[#2A2A2A] disabled:opacity-50 text-white text-sm font-semibold rounded-lg py-2.5 transition-colors"
            >
              {isLoading
                ? "Salvando..."
                : editing
                  ? "Salvar alterações"
                  : "Adicionar fornecedor"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#0A0A0A]/5 hover:bg-[#0A0A0A]/10 text-[#0A0A0A] text-sm font-medium rounded-lg py-2.5 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
