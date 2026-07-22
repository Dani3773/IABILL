import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchDocumentsByWorkspace } from '../api/documentService'
import type { Document, DocumentStatus } from '../types/document'

const STATUS_STYLES: Record<DocumentStatus, string> = {
  DRAFT: 'bg-slate-700 text-slate-300',
  GENERATED: 'bg-yellow-900 text-yellow-300',
  REVIEWED: 'bg-blue-900 text-blue-300',
  APPROVED: 'bg-green-900 text-green-300',
}

const STATUS_LABELS: Record<DocumentStatus, string> = {
  DRAFT: 'Rascunho',
  GENERATED: 'Gerado por IA',
  REVIEWED: 'Revisado',
  APPROVED: 'Aprovado',
}

export function DocumentsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const [documents, setDocuments] = useState<Document[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!workspaceId) return

    fetchDocumentsByWorkspace(workspaceId)
      .then(setDocuments)
      .catch(() => setError('Não foi possível carregar os documentos.'))
      .finally(() => setIsLoading(false))
  }, [workspaceId])

  if (isLoading) {
    return <p className="text-slate-400">Carregando...</p>
  }

  if (error) {
    return <p className="text-red-400">{error}</p>
  }

  return (
    <div>
      <Link to="/dashboard" className="text-blue-400 hover:underline text-sm mb-4 inline-block">
        ← Voltar aos Workspaces
      </Link>

      <h2 className="text-xl font-semibold text-white mb-4">
        Documentos
      </h2>

      {documents.length === 0 ? (
        <p className="text-slate-400">
          Nenhum documento cadastrado ainda neste workspace.
        </p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <Link
              key={doc.id}
              to={`/documents/${doc.id}`}
              className="flex items-center justify-between bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-blue-500 transition-colors"
            >
              <div>
                <p className="font-medium text-white">{doc.title}</p>
                <p className="text-xs text-slate-400">{doc.type}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded ${STATUS_STYLES[doc.status]}`}>
                {STATUS_LABELS[doc.status]}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}