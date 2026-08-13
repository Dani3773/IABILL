import { useState, type FormEvent } from "react";
import { createWorkspace } from "../api/workspaceService";
import { useAuth } from "../contexts/AuthContext";
import type { Workspace } from "../types/workspace";
import { getErrorMessage } from "../api/errorUtils";

interface Props {
  onClose: () => void;
  onCreated: (workspace: Workspace) => void;
}

export function CreateWorkspaceModal({ onClose, onCreated }: Props) {
  const { tenantId } = useAuth();
  const [name, setName] = useState("");
  const [type, setType] = useState<"MATRIZ" | "FILIAL">("FILIAL");
  const [documentId, setDocumentId] = useState("");
  const [country, setCountry] = useState("BR");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [street, setStreet] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [legalRegimes, setLegalRegimes] = useState<("LGPD" | "RGPD")[]>(["LGPD"]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  function formatCnpj(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 14);
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  }

  function toggleLegalRegime(regime: "LGPD" | "RGPD") {
    setLegalRegimes((prev) =>
      prev.includes(regime) ? prev.filter((r) => r !== regime) : [...prev, regime],
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!tenantId) return;
    if (legalRegimes.length === 0) {
      setError("Selecione ao menos um regime legal aplicável.");
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const workspace = await createWorkspace({
        tenantId,
        name,
        type,
        documentId,
        country,
        state: state || undefined,
        city: city || undefined,
        street: street || undefined,
        addressNumber: addressNumber || undefined,
        phone: phone || undefined,
        legalRegimes,
      });
      onCreated(workspace);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível criar o workspace."));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 z-50">
      <div className="w-full max-w-md bg-slate-800 rounded-xl p-6 shadow-xl border border-slate-700 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Novo Workspace</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm text-slate-300 mb-1">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ex: Filial São Paulo"
              className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Tipo</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "MATRIZ" | "FILIAL")}
              className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:outline-none focus:border-cyan-500"
            >
              <option value="FILIAL">Filial</option>
              <option value="MATRIZ">Matriz</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">CNPJ</label>
            <input
              type="text"
              value={documentId}
              onChange={(e) => setDocumentId(formatCnpj(e.target.value))}
              required
              placeholder="Somente números"
              className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Telefone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Opcional"
              className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="block text-sm text-slate-300 mb-1">País</label>
              <input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value.toUpperCase())}
                maxLength={2}
                required
                className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Estado</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Cidade</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-sm text-slate-300 mb-1">Rua</label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Número</label>
              <input
                type="text"
                value={addressNumber}
                onChange={(e) => setAddressNumber(e.target.value)}
                className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1">Regime legal aplicável</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={legalRegimes.includes("LGPD")}
                  onChange={() => toggleLegalRegime("LGPD")}
                  className="accent-cyan-500"
                />
                LGPD
              </label>
              <label className="flex items-center gap-1.5 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={legalRegimes.includes("RGPD")}
                  onChange={() => toggleLegalRegime("RGPD")}
                  className="accent-cyan-500"
                />
                RGPD
              </label>
            </div>
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-medium rounded-lg py-2 transition-colors"
            >
              {isLoading ? "Criando..." : "Criar"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-lg py-2 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}