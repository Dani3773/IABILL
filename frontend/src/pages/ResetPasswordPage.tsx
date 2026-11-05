import { Logo } from "../components/brand/Logo";
import { useState, type FormEvent } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { resetPassword } from "../api/authService";
import { getErrorMessage } from "../api/errorUtils";
import { Alert } from "../components/Alert";
import { CheckCircle2 } from "lucide-react";

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
      setMessage("As senhas não coincidem.");
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
      setMessage(getErrorMessage(err, "Não foi possível redefinir a senha."));
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
            <h1 className="text-white text-lg font-semibold mb-2">Senha redefinida</h1>
            <p className="text-slate-400 text-sm">Redirecionando para o login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h1 className="text-white text-lg font-semibold text-center mb-1">
              Defina sua nova senha
            </h1>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Nova senha</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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

            {status === "error" && <Alert type="error" message={message} />}
            {status === "form" && message && <Alert type="error" message={message} />}

            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full bg-[#0A0A0A] hover:bg-[#2A2A2A] disabled:opacity-50 text-white text-sm font-semibold rounded-lg py-2.5 transition-colors"
            >
              {status === "loading" ? "Redefinindo..." : "Redefinir senha"}
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