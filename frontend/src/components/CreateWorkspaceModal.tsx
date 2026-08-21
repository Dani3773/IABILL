import { useState, type FormEvent } from "react";
import { X, Building2 } from "lucide-react";
import { createWorkspace } from "../api/workspaceService";
import { useAuth } from "../contexts/AuthContext";
import type { Workspace } from "../types/workspace";
import { getErrorMessage } from "../api/errorUtils";
import { COUNTRIES, BRAZILIAN_STATES } from "../constants/locations";

interface Props {
  onClose: () => void;
  onCreated: (workspace: Workspace) => void;
}

export function CreateWorkspaceModal({ onClose, onCreated }: Props) {
  const { tenantId } = useAuth();
  const [name, setName] = useState("");
  const [type, setType] = useState<"MATRIZ" | "FILIAL">("FILIAL");
  const [documentId, setDocumentId] = useState("");
  const [country, setCountry] = useState("Brasil");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [street, setStreet] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [legalRegimes, setLegalRegimes] = useState<("LGPD" | "RGPD")[]>(["LGPD"]);
  const [cepLookupLoading, setCepLookupLoading] = useState(false);
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

  function formatCep(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }

  function toggleLegalRegime(regime: "LGPD" | "RGPD") {
    setLegalRegimes((prev) =>
      prev.includes(regime) ? prev.filter((r) => r !== regime) : [...prev, regime],
    );
  }

  async function handleCepBlur() {
    const sanitized = postalCode.replace(/\D/g, "");
    if (sanitized.length !== 8) return;
    setCepLookupLoading(true);
    try {
      const response = await fetch(`/api/v1/auth/cep/${sanitized}`);
      const stillSameCep = postalCode.replace(/\D/g, "") === sanitized;
      if (!stillSameCep) return;
      if (response.ok) {
        const data = await response.json();
        if (data.found) {
          if (data.street) setStreet(data.street);
          if (data.neighborhood) setNeighborhood(data.neighborhood);
          if (data.city) setCity(data.city);
          if (data.state) setState(data.state);
        }
      }
    } catch {
      // Falha silenciosa deliberada - autopreenchimento e opcional.
    } finally {
      setCepLookupLoading(false);
    }
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
        neighborhood: neighborhood || undefined,
        postalCode: postalCode || undefined,
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

  const inputClass =
    "w-full rounded-lg bg-[#F5F2EA] text-[#1B2233] text-sm px-3 py-2 border border-[#1B2233]/10 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6] placeholder:text-[#1B2233]/40";
  const labelClass = "block text-xs font-medium text-[#1B2233]/60 mb-1.5";

  return (
    <div className="fixed inset-0 bg-[#1B2233]/40 backdrop-blur-sm flex items-center justify-center px-4 z-50 py-8">
      <div className="w-full max-w-md bg-white rounded-xl p-6 shadow-2xl border border-[#1B2233]/10 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#14B8A6]/10 flex items-center justify-center">
              <Building2 className="w-4 h-4 text-[#14B8A6]" />
            </div>
            <h2 className="text-lg font-serif text-[#1B2233]">Novo Workspace</h2>
          </div>
          <button onClick={onClose} className="text-[#1B2233]/40 hover:text-[#1B2233] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className={labelClass}>Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ex: Filial São Paulo"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Tipo</label>
            <select value={type} onChange={(e) => setType(e.target.value as "MATRIZ" | "FILIAL")} className={inputClass}>
              <option value="FILIAL">Filial</option>
              <option value="MATRIZ">Matriz</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>CNPJ</label>
            <input
              type="text"
              value={documentId}
              onChange={(e) => setDocumentId(formatCnpj(e.target.value))}
              required
              autoComplete="off"
              placeholder="Somente números"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Telefone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="off"
              placeholder="Opcional"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>País</label>
            <select
              value={country}
              onChange={(e) => {
                setCountry(e.target.value);
                setState("");
              }}
              required
              className={inputClass}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>{country === "Brasil" ? "CEP" : "Código postal"}</label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={postalCode}
                onChange={(e) => setPostalCode(formatCep(e.target.value))}
                onBlur={country === "Brasil" ? handleCepBlur : undefined}
                autoComplete="off"
                placeholder={country === "Brasil" ? "00000-000" : "Código postal"}
                className={inputClass}
              />
              {cepLookupLoading && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#0d7a6d]">
                  buscando...
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className={labelClass}>Estado</label>
              {country === "Brasil" ? (
                <select value={state} onChange={(e) => setState(e.target.value)} className={inputClass}>
                  <option value="">Selecione</option>
                  {BRAZILIAN_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  autoComplete="off"
                  placeholder="Estado/Região"
                  className={inputClass}
                />
              )}
            </div>
            <div>
              <label className={labelClass}>Cidade</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                autoComplete="off"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Bairro</label>
            <input
              type="text"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              autoComplete="off"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className={labelClass}>Rua</label>
              <input
                type="text"
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                autoComplete="off"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Número</label>
              <input
                type="text"
                value={addressNumber}
                onChange={(e) => setAddressNumber(e.target.value)}
                autoComplete="off"
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Regime legal aplicável</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 text-sm text-[#1B2233]/70">
                <input
                  type="checkbox"
                  checked={legalRegimes.includes("LGPD")}
                  onChange={() => toggleLegalRegime("LGPD")}
                  className="rounded border-[#1B2233]/20 text-[#14B8A6] focus:ring-[#14B8A6]/30"
                />
                LGPD
              </label>
              <label className="flex items-center gap-1.5 text-sm text-[#1B2233]/70">
                <input
                  type="checkbox"
                  checked={legalRegimes.includes("RGPD")}
                  onChange={() => toggleLegalRegime("RGPD")}
                  className="rounded border-[#1B2233]/20 text-[#14B8A6] focus:ring-[#14B8A6]/30"
                />
                RGPD
              </label>
            </div>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-[#14B8A6] hover:bg-[#10a595] disabled:opacity-50 text-[#0A0D16] text-sm font-semibold rounded-lg py-2.5 transition-colors"
            >
              {isLoading ? "Criando..." : "Criar"}
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