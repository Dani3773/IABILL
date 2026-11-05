import { Logo } from "../components/brand/Logo";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api/authService";
import { getErrorMessage } from "../api/errorUtils";
import { Alert } from "../components/Alert";
import { CheckCircle2 } from "lucide-react";

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
      setError(getErrorMessage(err, "Não foi possível processar a solicitação."));
      setStatus("form");
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

        {status === "sent" ? (
          <div className="text-center">
            <div className="w-14 h-14 rounded-full bg-[#D92B21]/15 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-[#FF8A80]" />
            </div>
            <h1 className="text-white text-lg font-semibold mb-2">Verifique seu e-mail</h1>
            <p className="text-slate-400 text-sm mb-6">{message}</p>
            <Link to="/login" className="text-[#FF8A80] hover:underline text-sm">
              Voltar ao login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h1 className="text-white text-lg font-semibold text-center mb-1">
              Esqueceu sua senha?
            </h1>
            <p className="text-slate-400 text-sm text-center mb-4">
              Informe seu e-mail e enviaremos instruções para redefinir sua senha.
            </p>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="voce@empresa.com"
                className="w-full rounded-lg bg-white/5 text-white text-sm px-3 py-2.5 border border-white/10 focus:outline-none focus:border-[#0A0A0A]"
              />
            </div>

            {error && <Alert type="error" message={error} />}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full bg-[#0A0A0A] hover:bg-[#2A2A2A] disabled:opacity-50 text-white text-sm font-semibold rounded-lg py-2.5 transition-colors"
            >
              {status === "loading" ? "Enviando..." : "Enviar instruções"}
            </button>

            <p className="text-center">
              <Link to="/login" className="text-slate-500 hover:text-slate-300 text-xs">
                Voltar ao login
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}