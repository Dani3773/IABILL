import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchPublicPrivacyPolicy } from "../api/documentService";

export function PublicPrivacyPolicyPage() {
  const { workspaceDocumentId } = useParams<{ workspaceDocumentId: string }>();
  const [loading, setLoading] = useState(true);
  const [found, setFound] = useState(false);
  const [workspaceName, setWorkspaceName] = useState<string | null>(null);
  const [content, setContent] = useState<string | null>(null);
  const [publishedAt, setPublishedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!workspaceDocumentId) return;
    fetchPublicPrivacyPolicy(workspaceDocumentId)
      .then((res) => {
        setFound(res.found);
        setWorkspaceName(res.workspaceName);
        setContent(res.content);
        setPublishedAt(res.publishedAt);
      })
      .catch(() => setFound(false))
      .finally(() => setLoading(false));
  }, [workspaceDocumentId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F2EA] flex items-center justify-center text-[#1B2233]/50 text-sm">
        Carregando...
      </div>
    );
  }

  if (!found || !content) {
    return (
      <div className="min-h-screen bg-[#F5F2EA] flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-[#1B2233] text-lg font-semibold mb-2">
            Política de Privacidade não disponível
          </h1>
          <p className="text-[#1B2233]/55 text-sm">
            {workspaceName
              ? `${workspaceName} ainda não publicou uma política de privacidade neste link.`
              : "Não encontramos nenhuma empresa correspondente a este link."}
          </p>
          <Link to="/" className="text-[#0d7a6d] hover:underline text-sm mt-4 inline-block font-medium">
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F2EA] px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <p className="font-mono text-xs tracking-widest text-[#0d7a6d] uppercase mb-2">
          Política de Privacidade
        </p>
        <h1 className="text-[#1B2233] text-2xl font-serif mb-1">{workspaceName}</h1>
        {publishedAt && (
          <p className="text-[#1B2233]/45 text-xs mb-8">
            Publicada em {new Date(publishedAt).toLocaleDateString("pt-BR")}
          </p>
        )}
        <div className="bg-white rounded-xl p-6 border border-[#1B2233]/10">
          <p className="text-[#1B2233]/80 text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
        </div>
      </div>
    </div>
  );
}