import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchDocumentsByWorkspace } from '../api/documentService'
import { CreateDocumentModal } from '../components/CreateDocumentModal'
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
  const [showCreateModal, setShowCreateModal] = useState(false)

  useEffect(() => {
    if (!workspaceId) return

    fetchDocumentsByWorkspace(workspaceId)
      .then(setDocuments)
      .catch(() => setError('Não foi possível carregar os documentos.'))
      .finally(() => setIsLoading(false))
  }, [workspaceId])

  function handleCreated(newDocument: Document) {
    setDocuments((prev) => [...prev, newDocument])
  }

  if (isLoading) {
    return <p className="text-slate-400">Carregando...</p>
  }

  return (
    <div>
      <Link to="/dashboard" className="text-cyan-400 hover:underline text-sm mb-4 inline-block">
        ← Voltar aos Workspaces
      </Link>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Documentos</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
        >
          + Novo Documento
        </button>
      </div>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      {documents.length === 0 ? (
        <p className="text-slate-400">Nenhum documento cadastrado ainda neste workspace.</p>
      ) : (
        <div className="space-y-2">
          {documents.map((doc) => (
            <Link
              key={doc.id}
              to={`/documents/${doc.id}`}
              className="flex items-center justify-between bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-cyan-500 transition-colors"
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

      {showCreateModal && workspaceId && (
        <CreateDocumentModal
          workspaceId={workspaceId}
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}