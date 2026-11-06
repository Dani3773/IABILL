import { AUTH_BUTTON_CLASS, AUTH_INPUT_CLASS, AuthField, AuthShell } from "../components/AuthShell";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api/authService";
import { getErrorMessage } from "../api/errorUtils";
import { Alert } from "../components/Alert";
import { CheckCircle2 } from "lucide-react";

import { tr } from '../i18n/tr'
export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"form" | "loading" | "sent">("form");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setStatus("loading");
    try {
      const result = await forgotPassword({ email });
      setMessage(result.message);
      setStatus("sent");
    } catch (err) {
      setError(getErrorMessage(err, tr('Não foi possível processar a solicitação.')));
      setStatus("form");
    }
  }

  return (
    <AuthShell>

        {status === "sent" ? (
          <div>
            <CheckCircle2 className="w-8 h-8 text-emerald-700 mb-4" />
            <h1 className="auth__title auth__title--spaced">{tr('Verifique seu e-mail')}</h1>
            <p className="auth__switch mt-0! mb-5!">{message}</p>
            <Link to="/login" className="auth__link">{tr('Voltar ao login')}</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h1 className="auth__title auth__title--spaced">{tr('Esqueceu sua senha?')}</h1>
            <p className="auth__switch mt-0! mb-2!">{tr('Informe seu e-mail e enviaremos instruções para redefinir sua senha.')}</p>

            <AuthField label={tr('E-mail')}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                placeholder={tr('voce@empresa.com')}
                className={AUTH_INPUT_CLASS}
              />
            </AuthField>

            {error && <Alert type="error" message={error} />}

            <button
              type="submit"
              disabled={status === "loading"}
              className={AUTH_BUTTON_CLASS}
            >
              {status === "loading" ? tr('Enviando...') : tr('Enviar instruções')}
            </button>

            <p className="text-center">
              <Link to="/login" className="auth__link">{tr('Voltar ao login')}</Link>
            </p>
          </form>
        )}
    </AuthShell>
  );
}