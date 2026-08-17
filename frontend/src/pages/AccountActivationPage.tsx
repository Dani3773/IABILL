import { useState, type FormEvent } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { activateAccount, login } from "../api/authService";
import { useAuth } from "../contexts/AuthContext";
import { getErrorMessage } from "../api/errorUtils";
import { Alert } from "../components/Alert";

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
      setAuth(loginResponse);
      setStatus("success");
      setTimeout(() => navigate("/dashboard"), 1200);
    } catch (err) {
      setStatus("error");
      setMessage(getErrorMessage(err, "Não foi possível ativar a conta."));
    }
  }

  return (
    <div className="min-h-screen bg-[#161310] flex items-center justify-center px-4">
      <div className="max-w-sm w-full">
        <div className="text-center mb-6">
          <span className="font-serif text-2xl text-white tracking-tight">
            IA<span className="text-[#14B8A6]">Bill</span>
          </span>
        </div>

        {status === "success" ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-[#14B8A6]/15 flex items-center justify-center mx-auto mb-4">
              <span className="text-[#14B8A6] text-2xl">✓</span>
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
                className="w-full rounded-lg bg-white/5 text-white text-sm px-3 py-2.5 border border-white/10 focus:outline-none focus:border-[#14B8A6]"
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
                className="w-full rounded-lg bg-white/5 text-white text-sm px-3 py-2.5 border border-white/10 focus:outline-none focus:border-[#14B8A6]"
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
                className="w-full rounded-lg bg-white/5 text-white text-sm px-3 py-2.5 border border-white/10 focus:outline-none focus:border-[#14B8A6]"
              />
            </div>

            {message && <Alert type="error" message={message} />}

            <button
              type="submit"
              disabled={status === "activating"}
              className="w-full bg-[#14B8A6] hover:bg-[#10a595] disabled:opacity-50 text-[#0A0D16] text-sm font-semibold rounded-lg py-2.5 transition-colors"
            >
              {status === "activating" ? "Ativando..." : "Ativar conta e entrar"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}