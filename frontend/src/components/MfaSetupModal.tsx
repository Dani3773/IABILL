import { useEffect, useState, type FormEvent } from "react";
import QRCode from "qrcode";
import { ShieldCheck, X } from "lucide-react";
import { startMfaSetup, confirmMfaSetup } from "../api/authService";
import { getErrorMessage } from "../api/errorUtils";
import { Alert } from "./Alert";

interface Props {
  onClose: () => void;
  onEnabled: () => void;
}

export function MfaSetupModal({ onClose, onEnabled }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    startMfaSetup()
      .then(async (result) => {
        // O QR code e gerado 100% no navegador, a partir da URI otpauth:// -
        // o segredo TOTP nunca passa por nenhum servico de terceiro.
        const dataUrl = await QRCode.toDataURL(result.otpAuthUri);
        setQrDataUrl(dataUrl);
      })
      .catch((err) => setError(getErrorMessage(err, "Não foi possível iniciar a configuração de MFA.")));
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      const result = await confirmMfaSetup(Number(code));
      if (result.success) {
        onEnabled();
        onClose();
      } else {
        setError("Código inválido. Confira o aplicativo autenticador e tente novamente.");
      }
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível confirmar o código."));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-[#1B2233]/40 backdrop-blur-sm flex items-center justify-center px-4 z-50">
      <div className="w-full max-w-sm bg-white rounded-xl p-6 shadow-2xl border border-[#1B2233]/10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#14B8A6]/10 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-[#14B8A6]" />
            </div>
            <h2 className="text-lg font-serif text-[#1B2233]">Ativar Verificação em 2 Etapas</h2>
          </div>
          <button onClick={onClose} className="text-[#1B2233]/40 hover:text-[#1B2233] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-[#1B2233]/60 mb-4">
          Escaneie o código abaixo com o Google Authenticator, Authy ou outro aplicativo compatível.
        </p>

        {qrDataUrl ? (
          <img src={qrDataUrl} alt="QR Code para configurar MFA" className="mx-auto mb-4 rounded-lg" />
        ) : (
          <div className="h-48 flex items-center justify-center text-sm text-[#1B2233]/40">
            Gerando código...
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#1B2233]/60 mb-1.5">
              Digite o código gerado pelo aplicativo
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              placeholder="000000"
              className="w-full rounded-lg bg-[#F5F2EA] text-[#1B2233] text-sm px-3 py-2.5 border border-[#1B2233]/10 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6] font-mono tracking-widest text-center"
            />
          </div>

          {error && <Alert type="error" message={error} />}

          <button
            type="submit"
            disabled={isLoading || code.length !== 6}
            className="w-full bg-[#14B8A6] hover:bg-[#10a595] disabled:opacity-50 text-[#0A0D16] text-sm font-semibold rounded-lg py-2.5 transition-colors"
          >
            {isLoading ? "Confirmando..." : "Confirmar e ativar"}
          </button>
        </form>
      </div>
    </div>
  );
}