import { Logo } from "../components/brand/Logo";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { confirmEmail } from "../api/authService";
import { CheckCircle2, XCircle } from "lucide-react";

export function EmailConfirmationPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) return;
    confirmEmail(token)
      .then((result) => {
        setStatus(result.success ? "success" : "error");
        setMessage(result.message);
      })
      .catch(() => {
        setStatus("error");
        setMessage("Não foi possível confirmar seu e-mail. Tente novamente.");
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <span className="text-2xl text-white tracking-tight">
          <Logo />
        </span>

        <div className="mt-8">
          {status === "loading" && (
            <p className="text-slate-400 text-sm">Confirmando seu e-mail...</p>
          )}

          {status === "success" && (
            <>
              <div className="w-14 h-14 rounded-full bg-[#D92B21]/15 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-7 h-7 text-[#FF8A80]" />
              </div>
              <h1 className="text-white text-lg font-semibold mb-2">E-mail confirmado</h1>
              <p className="text-slate-400 text-sm mb-6">{message}</p>
              <Link
                to="/login"
                className="inline-block bg-[#0A0A0A] hover:bg-[#2A2A2A] text-white text-sm font-semibold rounded-lg px-6 py-2.5 transition-colors"
              >
                Entrar agora
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-14 h-14 rounded-full bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-7 h-7 text-red-400" />
              </div>
              <h1 className="text-white text-lg font-semibold mb-2">Não foi possível confirmar</h1>
              <p className="text-slate-400 text-sm mb-6">{message}</p>
              <Link to="/login" className="text-[#FF8A80] hover:underline text-sm">
                Voltar ao login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}