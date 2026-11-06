import { AUTH_BUTTON_CLASS, AUTH_INPUT_CLASS, AuthField, AuthShell } from "../components/AuthShell";
import { useState, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { activateAccount, login } from "../api/authService";
import { useAuth } from "../contexts/AuthContext";
import { getErrorMessage } from "../api/errorUtils";
import { Alert } from "../components/Alert";
import { CheckCircle2 } from "lucide-react";

export function AccountActivationPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"form" | "activating" | "success" | "error">("form");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!token) return;

    if (password !== confirmPassword) {
      setMessage("As senhas não coincidem.");
      return;
    }

    setStatus("activating");
    try {
      const result = await activateAccount({ token, password });
      if (!result.success) {
        setStatus("error");
        setMessage(result.message);
        return;
      }

      // Ativação deu certo - loga automaticamente com o e-mail que a pessoa
      // informar, ja que o backend nao retorna o e-mail junto da confirmacao.
      const loginResponse = await login({ email, password });
      if ("mfaRequired" in loginResponse) {
        // Conta ja tem MFA ativada de outra empresa - nao da pra pular a segunda
        // etapa so porque acabou de ativar um convite novo. Manda pro login normal,
        // que vai pedir o codigo MFA no proximo passo.
        navigate("/login");
        return;
      }
      setAuth(loginResponse);
      setStatus("success");
      setTimeout(() => navigate("/inicio"), 1200);
    } catch (err) {
      setStatus("error");
      setMessage(getErrorMessage(err, "Não foi possível ativar a conta."));
    }
  }

  return (
    <AuthShell>

        {status === "success" ? (
          <div>
            <CheckCircle2 className="w-8 h-8 text-emerald-700 mb-4" />
            <h1 className="auth__title auth__title--spaced">Conta ativada</h1>
            <p className="auth__switch mt-0! mb-0!">Abrindo o sistema...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h1 className="auth__title auth__title--spaced">
              Ative sua conta
            </h1>
            <p className="auth__switch mt-0! mb-2!">
              Defina sua senha para acessar o IABill
            </p>

            <AuthField label="Seu e-mail">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="username"
                placeholder="o e-mail que recebeu o convite"
                className={AUTH_INPUT_CLASS}
              />
            </AuthField>
            <AuthField label="Nova senha">
              <input
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
                className={AUTH_INPUT_CLASS}
              />
            </AuthField>
            <AuthField label="Confirme a senha">
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

            {message && <Alert type="error" message={message} />}

            <button
              type="submit"
              disabled={status === "activating"}
              className={AUTH_BUTTON_CLASS}
            >
              {status === "activating" ? "Ativando..." : "Ativar conta e entrar"}
            </button>
          </form>
        )}
    </AuthShell>
  );
}