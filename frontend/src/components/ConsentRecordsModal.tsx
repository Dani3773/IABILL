import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { X, ShieldCheck } from "lucide-react";
import { fetchConsentRecords } from "../api/consentService";
import { getErrorMessage } from "../api/errorUtils";
import type { ConsentRecord } from "../types/consent";

interface Props {
  activityId: string;
  activityName: string;
  onClose: () => void;
}

export function ConsentRecordsModal({ activityId, activityName, onClose }: Props) {
  const [records, setRecords] = useState<ConsentRecord[]>([]);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const publicUrl = `https://iabill.com/consentimento/${activityId}`;

  useEffect(() => {
    fetchConsentRecords(activityId)
      .then(setRecords)
      .catch((err) => setError(getErrorMessage(err, "Não foi possível carregar os consentimentos.")))
      .finally(() => setIsLoading(false));

    QRCode.toDataURL(publicUrl)
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [activityId]);

  return (
    <div className="fixed inset-0 bg-[#0A0A0A]/40 flex items-center justify-center px-4 z-50 py-8 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-xl p-6 shadow-2xl border border-[#0A0A0A]/10 my-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#D92B21]/10 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-[#B4201A]" />
            </div>
            <h2 className="text-lg text-[#0A0A0A]">Prova de Consentimento</h2>
          </div>
          <button onClick={onClose} className="text-[#0A0A0A]/40 hover:text-[#0A0A0A] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-[#0A0A0A]/55 mb-4">{activityName}</p>

        <div className="flex items-center gap-4 mb-6 bg-[#fbfaf6] rounded-lg p-4">
          {qrDataUrl && (
            <img src={qrDataUrl} alt="QR Code de consentimento" className="w-20 h-20 rounded-lg bg-white p-1" />
          )}
          <div className="min-w-0">
            <p className="text-xs text-[#0A0A0A]/55 mb-1">Link para coletar consentimento:</p>
            <button
              type="button"
              onClick={() => window.open(publicUrl, "_blank", "noopener,noreferrer")}
              className="text-[#0A0A0A] hover:underline text-sm break-all text-left"
            >
              {publicUrl}
            </button>
          </div>
        </div>

        <h3 className="text-sm font-medium text-[#0A0A0A]/70 mb-2">
          Consentimentos registrados ({records.length})
        </h3>

        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

        {isLoading ? (
          <p className="text-sm text-[#0A0A0A]/40">Carregando...</p>
        ) : records.length === 0 ? (
          <p className="text-sm text-[#0A0A0A]/50">Nenhum consentimento registrado ainda.</p>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {records.map((r) => (
              <div key={r.id} className="bg-[#fbfaf6] rounded-lg p-3 text-sm">
                <p className="font-medium text-[#0A0A0A]">{r.consenterName}</p>
                <p className="text-xs text-[#0A0A0A]/55">{r.consenterEmail}</p>
                <p className="text-xs text-[#0A0A0A]/45 mt-1">
                  {new Date(r.consentedAt).toLocaleString("pt-BR")}
                  {r.ipAddress && ` · IP: ${r.ipAddress}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}