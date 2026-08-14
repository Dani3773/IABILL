import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { confirmEmail } from "../api/authService";

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
    <div className="min-h-screen bg-[#161310] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <span className="font-serif text-2xl text-white tracking-tight">
          IA<span className="text-[#14B8A6]">Bill</span>
        </span>

        <div className="mt-8">
          {status === "loading" && (
            <p className="text-slate-400 text-sm">Confirmando seu e-mail...</p>
          )}

          {status === "success" && (
            <>
              <div className="w-14 h-14 rounded-full bg-[#14B8A6]/15 flex items-center justify-center mx-auto mb-4">
                <span className="text-[#14B8A6] text-2xl">✓</span>
              </div>
              <h1 className="text-white text-lg font-semibold mb-2">E-mail confirmado</h1>
              <p className="text-slate-400 text-sm mb-6">{message}</p>
              <Link
                to="/login"
                className="inline-block bg-[#14B8A6] hover:bg-[#10a595] text-[#0A0D16] text-sm font-semibold rounded-lg px-6 py-2.5 transition-colors"
              >
                Entrar agora
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="w-14 h-14 rounded-full bg-red-900/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-red-400 text-2xl">✕</span>
              </div>
              <h1 className="text-white text-lg font-semibold mb-2">Não foi possível confirmar</h1>
              <p className="text-slate-400 text-sm mb-6">{message}</p>
              <Link to="/login" className="text-[#14B8A6] hover:underline text-sm">
                Voltar ao login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}