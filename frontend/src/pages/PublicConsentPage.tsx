import { useEffect, useState, type FormEvent } from "react";
import { useParams } from "react-router-dom";
import { ShieldCheck, CheckCircle2 } from "lucide-react";
import { fetchPublicConsentInfo, submitConsent } from "../api/consentService";
import { getErrorMessage } from "../api/errorUtils";

import { tr } from '../i18n/tr'
export function PublicConsentPage() {
  const { activityId } = useParams<{ activityId: string }>();
  const [loading, setLoading] = useState(true);
  const [found, setFound] = useState(false);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [processName, setProcessName] = useState<string | null>(null);
  const [purpose, setPurpose] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!activityId) return;
    fetchPublicConsentInfo(activityId)
      .then((info) => {
        setFound(info.found);
        setWorkspaceName(info.workspaceName);
        setProcessName(info.processName);
        setPurpose(info.purpose);
      })
      .catch(() => setFound(false))
      .finally(() => setLoading(false));
  }, [activityId]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!activityId || !agreed) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await submitConsent(activityId, { consenterName: name, consenterEmail: email });
      setSubmitted(true);
    } catch (err) {
      setError(getErrorMessage(err, tr('Não foi possível registrar seu consentimento.')));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FBF8F8] flex items-center justify-center text-[#0A0A0A]/50 text-sm">{tr('Carregando...')}</div>
    );
  }

  if (!found) {
    return (
      <div className="min-h-screen bg-[#FBF8F8] flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-[#0A0A0A] text-lg font-semibold mb-2">{tr('Link inválido')}</h1>
          <p className="text-[#0A0A0A]/55 text-sm">{tr('Não encontramos nenhuma atividade correspondente a este link.')}</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#FBF8F8] flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-14 h-14 rounded-full bg-[#D92B21]/15 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-7 h-7 text-[#0A0A0A]" />
          </div>
          <h1 className="text-[#0A0A0A] text-lg font-semibold mb-2">{tr('Consentimento registrado')}</h1>
          <p className="text-[#0A0A0A]/55 text-sm">{tr('Obrigado. Seu consentimento foi registrado com sucesso junto a')}{' '}{workspaceName}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF8F8] px-4 py-12">
      <div className="max-w-lg mx-auto">
        <p className="text-xs tracking-widest text-[#0A0A0A] uppercase mb-2">{tr('Termo de Consentimento · Art. 8º LGPD')}</p>
        <h1 className="text-[#0A0A0A] text-2xl mb-1">{workspaceName}</h1>
        <p className="text-[#0A0A0A]/55 text-sm mb-6">{processName}</p>

        <div className="bg-white rounded-xl p-5 border border-[#0A0A0A]/10 mb-6">
          <p className="text-sm text-[#0A0A0A]/80 leading-relaxed whitespace-pre-wrap">{purpose}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-xl p-6 border border-[#0A0A0A]/10">
          <div>
            <label className="block text-sm text-[#0A0A0A]/70 mb-1">{tr('Seu nome completo')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg bg-[#FBF8F8] text-[#0A0A0A] px-3 py-2 border border-[#0A0A0A]/10 focus:outline-none focus:ring-2 focus:ring-[#D92B21]/30 focus:border-[#0A0A0A]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#0A0A0A]/70 mb-1">{tr('Seu e-mail')}</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg bg-[#FBF8F8] text-[#0A0A0A] px-3 py-2 border border-[#0A0A0A]/10 focus:outline-none focus:ring-2 focus:ring-[#D92B21]/30 focus:border-[#0A0A0A]"
            />
          </div>
          <label className="flex items-start gap-2 text-sm text-[#0A0A0A]/70 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              required
              className="mt-0.5 rounded border-[#0A0A0A]/20 text-[#B4201A] focus:ring-[#D92B21]/30"
            />{tr('Li e concordo com a finalidade de tratamento de dados descrita acima.')}</label>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting || !agreed}
            className="w-full flex items-center justify-center gap-2 bg-[#0A0A0A] hover:bg-[#2A2A2A] disabled:opacity-50 text-white text-sm font-semibold rounded-lg py-2.5 transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            {isSubmitting ? tr('Registrando...') : tr('Confirmar consentimento')}
          </button>
        </form>
      </div>
    </div>
  );
}