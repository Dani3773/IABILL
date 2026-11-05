import { useEffect, useState, type FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { lookupWorkspace, submitDataSubjectRequest } from "../api/dataSubjectRequestService";
import { getErrorMessage } from "../api/errorUtils";
import type { DataSubjectRequestType } from "../types/dataSubjectRequest";
import { CheckCircle2 } from "lucide-react";

const TYPE_LABELS: Record<DataSubjectRequestType, string> = {
  ACCESS: "Acesso aos meus dados",
  CORRECTION: "Correção de dados incorretos",
  DELETION: "Eliminação (exclusão) dos meus dados",
  PORTABILITY: "Portabilidade dos meus dados",
  ANONYMIZATION: "Anonimização dos meus dados",
  CONSENT_REVOCATION: "Revogação de consentimento",
};

export function PublicDataSubjectRequestPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [companyFound, setCompanyFound] = useState(false);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [requesterDocumentId, setRequesterDocumentId] = useState("");
  const [requestType, setRequestType] = useState<DataSubjectRequestType>("ACCESS");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!documentId) return;
    lookupWorkspace(documentId)
      .then((info) => {
        setCompanyFound(info.found);
        setCompanyName(info.workspaceName);
      })
      .catch(() => setCompanyFound(false))
      .finally(() => setLoadingCompany(false));
  }, [documentId]);

    function formatCpf(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!documentId) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await submitDataSubjectRequest(documentId, {
        requesterName,
        requesterEmail,
        requesterDocumentId: requesterDocumentId || undefined,
        requestType,
        description,
      });
      setSubmitted(true);
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível enviar sua solicitação. Tente novamente."));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loadingCompany) {
    return (
      <div className="min-h-screen bg-[#FBF8F8] flex items-center justify-center text-[#0A0A0A]/50 text-sm">
        Carregando...
      </div>
    );
  }

  if (!companyFound) {
    return (
      <div className="min-h-screen bg-[#FBF8F8] flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-[#0A0A0A] text-lg font-semibold mb-2">Empresa não encontrada</h1>
          <p className="text-[#0A0A0A]/55 text-sm">
            O link que você acessou não corresponde a nenhuma empresa cadastrada no IABill. Confirme o link com
            quem forneceu, ou entre em contato diretamente com a empresa.
          </p>
          <Link to="/" className="text-[#0A0A0A] hover:underline text-sm mt-4 inline-block font-medium">
            Voltar ao início
          </Link>
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
          <h1 className="text-[#0A0A0A] text-lg font-semibold mb-2">Solicitação enviada</h1>
          <p className="text-[#0A0A0A]/55 text-sm">
            Sua solicitação foi recebida por <strong className="text-[#0A0A0A]">{companyName}</strong> e será
            analisada. Você pode ser contatado pelo e-mail informado para dar continuidade ao processo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF8F8] px-4 py-12">
      <div className="max-w-lg mx-auto">
        <p className="text-xs tracking-widest text-[#0A0A0A] uppercase mb-2">
          Portal de solicitação do titular · Art. 18 LGPD
        </p>
        <h1 className="text-[#0A0A0A] text-2xl mb-1">{companyName}</h1>
        <p className="text-[#0A0A0A]/55 text-sm mb-8">
          Use este formulário para solicitar acesso, correção, eliminação, portabilidade ou anonimização dos seus
          dados pessoais tratados por esta empresa.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4 bg-white rounded-xl p-6 border border-[#0A0A0A]/10">
          <div>
            <label className="block text-sm text-[#0A0A0A]/70 mb-1">Seu nome completo</label>
            <input
              type="text"
              value={requesterName}
              onChange={(e) => setRequesterName(e.target.value)}
              required
              className="w-full rounded-lg bg-[#FBF8F8] text-[#0A0A0A] px-3 py-2 border border-[#0A0A0A]/10 focus:outline-none focus:ring-2 focus:ring-[#D92B21]/30 focus:border-[#0A0A0A]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#0A0A0A]/70 mb-1">Seu e-mail</label>
            <input
              type="email"
              value={requesterEmail}
              onChange={(e) => setRequesterEmail(e.target.value)}
              required
              className="w-full rounded-lg bg-[#FBF8F8] text-[#0A0A0A] px-3 py-2 border border-[#0A0A0A]/10 focus:outline-none focus:ring-2 focus:ring-[#D92B21]/30 focus:border-[#0A0A0A]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#0A0A0A]/70 mb-1">CPF (opcional, ajuda a empresa a te localizar)</label>
            <input
              type="text"
              inputMode="numeric"
              value={requesterDocumentId}
              onChange={(e) => setRequesterDocumentId(formatCpf(e.target.value))}
              placeholder="000.000.000-00"
              className="w-full rounded-lg bg-[#FBF8F8] text-[#0A0A0A] px-3 py-2 border border-[#0A0A0A]/10 focus:outline-none focus:ring-2 focus:ring-[#D92B21]/30 focus:border-[#0A0A0A]"
            />
          </div>
          <div>
            <label className="block text-sm text-[#0A0A0A]/70 mb-1">Tipo de solicitação</label>
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value as DataSubjectRequestType)}
              className="w-full rounded-lg bg-[#FBF8F8] text-[#0A0A0A] px-3 py-2 border border-[#0A0A0A]/10 focus:outline-none focus:ring-2 focus:ring-[#D92B21]/30 focus:border-[#0A0A0A]"
            >
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-[#0A0A0A]/70 mb-1">Descreva sua solicitação</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              rows={4}
              placeholder="Ex: Gostaria de saber quais dados meus vocês possuem, e desde quando."
              className="w-full rounded-lg bg-[#FBF8F8] text-[#0A0A0A] px-3 py-2 border border-[#0A0A0A]/10 focus:outline-none focus:ring-2 focus:ring-[#D92B21]/30 focus:border-[#0A0A0A] placeholder:text-[#0A0A0A]/40"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#0A0A0A] hover:bg-[#2A2A2A] disabled:opacity-50 text-white text-sm font-semibold rounded-lg py-2.5 transition-colors"
          >
            {isSubmitting ? "Enviando..." : "Enviar solicitação"}
          </button>
        </form>
      </div>
    </div>
  );
}