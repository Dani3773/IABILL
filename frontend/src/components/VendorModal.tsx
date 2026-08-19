import { useState, type FormEvent } from "react";
import { X, Truck } from "lucide-react";
import { createVendor, updateVendor } from "../api/vendorService";
import { getErrorMessage } from "../api/errorUtils";
import type { Vendor } from "../types/vendor";

interface Props {
  workspaceId: string;
  editing: Vendor | null;
  onClose: () => void;
  onSaved: (vendor: Vendor) => void;
}

export function VendorModal({ workspaceId, editing, onClose, onSaved }: Props) {
  const [name, setName] = useState(editing?.name ?? "");
  const [serviceProvided, setServiceProvided] = useState(editing?.serviceProvided ?? "");
  const [sharedDataCategories, setSharedDataCategories] = useState(editing?.sharedDataCategories ?? "");
  const [dpaSigned, setDpaSigned] = useState(editing?.dpaSigned ?? false);
  const [dpaSignedAt, setDpaSignedAt] = useState(editing?.dpaSignedAt?.slice(0, 10) ?? "");
  const [securityClausesConfirmed, setSecurityClausesConfirmed] = useState(editing?.securityClausesConfirmed ?? false);
  const [observations, setObservations] = useState(editing?.observations ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const payload = {
        workspaceId,
        name,
        serviceProvided,
        sharedDataCategories,
        dpaSigned,
        dpaSignedAt: dpaSignedAt || undefined,
        securityClausesConfirmed,
        observations: observations || undefined,
      };
      const saved = editing ? await updateVendor(editing.id, payload) : await createVendor(payload);
      onSaved(saved);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível salvar o fornecedor."));
    } finally {
      setIsLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg bg-[#F5F2EA] text-[#1B2233] text-sm px-3 py-2 border border-[#1B2233]/10 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6] placeholder:text-[#1B2233]/40";
  const labelClass = "block text-xs font-medium text-[#1B2233]/60 mb-1.5";

  return (
    <div className="fixed inset-0 bg-[#1B2233]/40 backdrop-blur-sm flex items-center justify-center px-4 z-50 py-8 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-xl p-6 shadow-2xl border border-[#1B2233]/10 my-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#14B8A6]/10 flex items-center justify-center">
              <Truck className="w-4 h-4 text-[#14B8A6]" />
            </div>
            <h2 className="text-lg font-serif text-[#1B2233]">
              {editing ? "Editar Fornecedor" : "Novo Fornecedor"}
            </h2>
          </div>
          <button onClick={onClose} className="text-[#1B2233]/40 hover:text-[#1B2233] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className={labelClass}>Categorias de dado compartilhado</label>
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
            <label className="flex items-center gap-2 text-sm text-[#1B2233]/70 cursor-pointer">
              <input
                type="checkbox"
                checked={dpaSigned}
                onChange={(e) => setDpaSigned(e.target.checked)}
                className="rounded border-[#1B2233]/20 text-[#14B8A6] focus:ring-[#14B8A6]/30"
              />
              DPA assinado
            </label>
            <label className="flex items-center gap-2 text-sm text-[#1B2233]/70 cursor-pointer">
              <input
                type="checkbox"
                checked={securityClausesConfirmed}
                onChange={(e) => setSecurityClausesConfirmed(e.target.checked)}
                className="rounded border-[#1B2233]/20 text-[#14B8A6] focus:ring-[#14B8A6]/30"
              />
              Cláusulas de segurança confirmadas
            </label>
          </div>

          {dpaSigned && (
            <div>
              <label className={labelClass}>Data de assinatura do DPA</label>
              <input
                type="date"
                value={dpaSignedAt}
                onChange={(e) => setDpaSignedAt(e.target.value)}
                className={inputClass}
              />
            </div>
          )}

          <div>
            <label className={labelClass}>Observações <span className="text-[#1B2233]/40">(opcional)</span></label>
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
              {isLoading ? "Salvando..." : editing ? "Salvar alterações" : "Adicionar fornecedor"}
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