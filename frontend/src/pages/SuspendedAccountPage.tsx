import { ShieldAlert } from "lucide-react";

export function SuspendedAccountPage() {
  return (
    <div className="min-h-screen bg-[#FBF8F8] flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-7 h-7 text-amber-600" />
        </div>
        <h1 className="text-[#0A0A0A] text-lg font-semibold mb-2">Empresa desativada</h1>
        <p className="text-[#0A0A0A]/55 text-sm mb-6">
          O acesso desta empresa ao IABill foi temporariamente desativado. Entre em contato com o suporte para mais informações.
        </p>
        <button
          type="button"
          onClick={() => window.open("mailto:danielfelisberto3@gmail.com", "_self")}
          className="inline-flex items-center gap-2 bg-[#0A0A0A] hover:bg-[#2A2A2A] text-white text-sm font-semibold rounded-lg px-6 py-3 transition-colors"
        >
          Falar com o suporte
        </button>
      </div>
    </div>
  );
}