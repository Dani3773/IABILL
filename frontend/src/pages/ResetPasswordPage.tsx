import { AUTH_BUTTON_CLASS, AUTH_INPUT_CLASS, AuthField, AuthShell } from "../components/AuthShell";
import { useState, type FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { resetPassword } from "../api/authService";
import { getErrorMessage } from "../api/errorUtils";
import { Alert } from "../components/Alert";
import { CheckCircle2 } from "lucide-react";

import { tr } from '../i18n/tr'
export function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"form" | "loading" | "success" | "error">("form");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;

    if (newPassword !== confirmPassword) {
      setMessage(tr('As senhas não coincidem.'));
      return;
    }

    setStatus("loading");
    try {
      const result = await resetPassword({ token, newPassword });
      if (!result.success) {
        setStatus("error");
        setMessage(result.message);
        return;
      }
      setStatus("success");
      setMessage(result.message);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setStatus("error");
      setMessage(getErrorMessage(err, tr('Não foi possível redefinir a senha.')));
    }
  }

  return (
    <AuthShell>

        {status === "success" ? (
          <div>
            <CheckCircle2 className="w-8 h-8 text-emerald-700 mb-4" />
            <h1 className="auth__title auth__title--spaced">{tr('Senha redefinida')}</h1>
            <p className="auth__switch mt-0! mb-0!">{tr('Redirecionando para o login...')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h1 className="auth__title auth__title--spaced">{tr('Defina sua nova senha')}</h1>

            <AuthField label={tr('Nova senha')}>
              <input
                type="password"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                placeholder={tr('Mínimo 8 caracteres')}
                className={AUTH_INPUT_CLASS}
              />
            </AuthField>
            <AuthField label={tr('Confirme a senha')}>
              <input
                type="password"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className={AUTH_INPUT_CLASS}
              />
            </AuthField>

            {status === "error" && <Alert type="error" message={message} />}
            {status === "form" && message && <Alert type="error" message={message} />}

            <button
              type="submit"
              disabled={status === "loading"}
              className={AUTH_BUTTON_CLASS}
            >
              {status === "loading" ? tr('Redefinindo...') : tr('Redefinir senha')}
            </button>

            <p className="text-center">
              <Link to="/login" className="auth__link">{tr('Voltar ao login')}</Link>
            </p>
          </form>
        )}
    </AuthShell>
  );
}