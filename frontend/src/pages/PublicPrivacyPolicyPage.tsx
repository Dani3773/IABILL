import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchPublicPrivacyPolicy } from "../api/documentService";
import { renderMarkdown } from "../utils/markdown";

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
      <div className="min-h-screen bg-[#FBF8F8] flex items-center justify-center text-[#0A0A0A]/50 text-sm">
        Carregando...
      </div>
    );
  }

  if (!found || !content) {
    return (
      <div className="min-h-screen bg-[#FBF8F8] flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="text-[#0A0A0A] text-lg font-semibold mb-2">
            Política de Privacidade não disponível
          </h1>
          <p className="text-[#0A0A0A]/55 text-sm">
            {workspaceName
              ? `${workspaceName} ainda não publicou uma política de privacidade neste link.`
              : "Não encontramos nenhuma empresa correspondente a este link."}
          </p>
          <Link to="/" className="text-[#0A0A0A] hover:underline text-sm mt-4 inline-block font-medium">
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FBF8F8] px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <p className="text-xs tracking-widest text-[#0A0A0A] uppercase mb-2">
          Política de Privacidade
        </p>
        <h1 className="text-[#0A0A0A] text-2xl mb-1">{workspaceName}</h1>
        {publishedAt && (
          <p className="text-[#0A0A0A]/45 text-xs mb-8">
            Publicada em {new Date(publishedAt).toLocaleDateString("pt-BR")}
          </p>
        )}
        <div
          className="bg-white rounded-xl p-6 border border-[#0A0A0A]/10 text-[#0A0A0A]/80 text-sm leading-relaxed"
          dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
        />
      </div>
    </div>
  );
}