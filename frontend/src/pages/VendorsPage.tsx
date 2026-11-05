import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Truck, CheckCircle2, XCircle, Trash2, Pencil } from "lucide-react";
import { fetchVendors, deleteVendor } from "../api/vendorService";
import { VendorModal } from "../components/VendorModal";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { Alert } from "../components/Alert";
import { getErrorMessage } from "../api/errorUtils";
import type { Vendor } from "../types/vendor";

export function VendorsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);

  useEffect(() => {
    if (!workspaceId) return;
    load(workspaceId);
  }, [workspaceId]);

  function load(id: string) {
    setIsLoading(true);
    fetchVendors(id)
      .then(setVendors)
      .catch((err) => setError(getErrorMessage(err, "Não foi possível carregar os fornecedores.")))
      .finally(() => setIsLoading(false));
  }

  function handleSaved(vendor: Vendor) {
    setVendors((prev) => {
      const exists = prev.some((v) => v.id === vendor.id);
      return exists ? prev.map((v) => (v.id === vendor.id ? vendor : v)) : [...prev, vendor];
    });
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Remover este fornecedor do registro?")) return;
    try {
      await deleteVendor(id);
      setVendors((prev) => prev.filter((v) => v.id !== id));
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível remover o fornecedor."));
    }
  }

  if (isLoading) return <LoadingSpinner label="Carregando fornecedores..." />;

  return (
    <div>
      <Link
        to={`/workspaces/${workspaceId}/pilares`}
        className="flex items-center gap-1.5 text-[#0A0A0A] hover:text-[#B4201A] text-sm mb-4 font-medium transition-colors w-fit"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Voltar aos Pilares
      </Link>

      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-xl text-[#0A0A0A]">Fornecedores e Terceiros</h1>
          <p className="text-sm text-[#0A0A0A]/55 mt-0.5">
            Registro de fornecedores/operadores com acesso a dados pessoais, conforme Art. 39 da LGPD.
          </p>
        </div>
        <button
          onClick={() => { setEditing(null); setShowModal(true); }}
          className="bg-[#0A0A0A] hover:bg-[#2A2A2A] text-white text-sm font-semibold rounded-lg px-4 py-2.5 transition-colors shrink-0"
        >
          + Novo Fornecedor
        </button>
      </div>

      {error && <div className="my-4"><Alert type="error" message={error} /></div>}

      {vendors.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#0A0A0A]/10 p-10 text-center mt-6">
          <Truck className="w-8 h-8 text-[#0A0A0A]/25 mx-auto mb-3" />
          <p className="text-[#0A0A0A]/55 text-sm">Nenhum fornecedor registrado ainda.</p>
        </div>
      ) : (
        <div className="space-y-2 mt-6">
          {vendors.map((vendor) => (
            <div key={vendor.id} className="bg-white rounded-xl p-4 border border-[#0A0A0A]/10">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-[#0A0A0A]">{vendor.name}</p>
                    {vendor.sectorName && (
                      <span className="text-[10px] uppercase tracking-wide bg-[#0A0A0A]/8 text-[#0A0A0A]/60 rounded px-1.5 py-0.5">
                        {vendor.sectorName}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#0A0A0A]/60 mb-2">{vendor.serviceProvided}</p>
                  <p className="text-xs text-[#0A0A0A]/50 mb-3">
                    <span className="text-[#0A0A0A]/70">Dados compartilhados:</span> {vendor.sharedDataCategories}
                  </p>
                  <div className="flex items-center gap-4 text-xs">
                    <span className={`flex items-center gap-1 ${vendor.dpaSigned ? "text-[#0A0A0A]" : "text-[#0A0A0A]/40"}`}>
                      {vendor.dpaSigned ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      DPA {vendor.dpaSigned ? `assinado${vendor.dpaSignedAt ? ` em ${new Date(vendor.dpaSignedAt).toLocaleDateString("pt-BR")}` : ""}` : "não assinado"}
                    </span>
                    <span className={`flex items-center gap-1 ${vendor.securityClausesConfirmed ? "text-[#0A0A0A]" : "text-[#0A0A0A]/40"}`}>
                      {vendor.securityClausesConfirmed ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      Cláusulas de segurança
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => { setEditing(vendor); setShowModal(true); }}
                    className="text-[#0A0A0A]/40 hover:text-[#B4201A] transition-colors"
                    title="Editar"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(vendor.id)}
                    className="text-[#0A0A0A]/40 hover:text-red-600 transition-colors"
                    title="Remover"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && workspaceId && (
        <VendorModal
          workspaceId={workspaceId}
          editing={editing}
          onClose={() => setShowModal(false)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}