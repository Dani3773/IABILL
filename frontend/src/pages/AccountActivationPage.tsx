import { Logo } from "../components/brand/Logo";
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
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch (err) {
      setStatus("error");
      setMessage(getErrorMessage(err, "Não foi possível ativar a conta."));
    }
  }

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-6">
          <span className="text-2xl text-white tracking-tight">
            <Logo />
          </span>
        </div>

        {status === "success" ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-[#D92B21]/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-[#FF8A80]" />
            </div>
            <h1 className="text-white text-lg font-semibold mb-2">Conta ativada</h1>
            <p className="text-slate-400 text-sm">Redirecionando para o painel...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h1 className="text-white text-lg font-semibold text-center mb-1">
              Ative sua conta
            </h1>
            <p className="text-slate-400 text-sm text-center mb-4">
              Defina sua senha para acessar o IABill
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Seu e-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="o e-mail que recebeu o convite"
                className="w-full rounded-lg bg-white/5 text-white text-sm px-3 py-2.5 border border-white/10 focus:outline-none focus:border-[#0A0A0A]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Nova senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                placeholder="Mínimo 8 caracteres"
                className="w-full rounded-lg bg-white/5 text-white text-sm px-3 py-2.5 border border-white/10 focus:outline-none focus:border-[#0A0A0A]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Confirme a senha</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-lg bg-white/5 text-white text-sm px-3 py-2.5 border border-white/10 focus:outline-none focus:border-[#0A0A0A]"
              />
            </div>

            {message && <Alert type="error" message={message} />}

            <button
              type="submit"
              disabled={status === "activating"}
              className="w-full bg-[#0A0A0A] hover:bg-[#2A2A2A] disabled:opacity-50 text-white text-sm font-semibold rounded-lg py-2.5 transition-colors"
            >
              {status === "activating" ? "Ativando..." : "Ativar conta e entrar"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}