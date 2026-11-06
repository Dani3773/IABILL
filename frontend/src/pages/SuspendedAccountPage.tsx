import { ShieldAlert } from "lucide-react";
import { AUTH_BUTTON_CLASS, AuthShell } from "../components/AuthShell";

import { tr } from '../i18n/tr'
export function SuspendedAccountPage() {
  return (
    <AuthShell>
      <ShieldAlert className="w-8 h-8 text-amber-700 mb-4" />
      <h1 className="auth__title auth__title--spaced">{tr('Empresa desativada')}</h1>
      <p className="auth__switch mt-0! mb-5!">{tr('O acesso desta empresa ao IABill foi temporariamente desativado. Entre em contato com o suporte para mais informações.')}</p>
      <button
        type="button"
        onClick={() => window.open("mailto:danielfelisberto3@gmail.com", "_self")}
        className={AUTH_BUTTON_CLASS}
      >{tr('Falar com o suporte')}</button>
    </AuthShell>
  );
}