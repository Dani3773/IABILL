import { AuthShell } from "../components/AuthShell";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { confirmEmail } from "../api/authService";
import { CheckCircle2, XCircle } from "lucide-react";

import { tr } from '../i18n/tr'
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
        setMessage(tr('Não foi possível confirmar seu e-mail. Tente novamente.'));
      });
  }, [token]);

  return (
    <AuthShell>
      {status === "loading" && <p className="auth__switch">{tr('Confirmando seu e-mail...')}</p>}

      {status === "success" && (
        <div>
          <CheckCircle2 className="w-8 h-8 text-emerald-700 mb-4" />
          <h1 className="auth__title auth__title--spaced">{tr('E-mail confirmado')}</h1>
          <p className="auth__switch mt-0! mb-5!">{message}</p>
          <Link
            to="/login"
            className="inline-block bg-[#D92B21] hover:bg-[#B4201A] text-white text-[15px] font-semibold rounded-md px-6 py-3 transition-colors"
          >{tr('Entrar agora')}</Link>
        </div>
      )}

      {status === "error" && (
        <div>
          <XCircle className="w-8 h-8 text-[#B4201A] mb-4" />
          <h1 className="auth__title auth__title--spaced">{tr('Não foi possível confirmar')}</h1>
          <p className="auth__switch mt-0! mb-5!">{message}</p>
          <Link to="/login" className="auth__link">{tr('Voltar ao login')}</Link>
        </div>
      )}
    </AuthShell>
  );
}