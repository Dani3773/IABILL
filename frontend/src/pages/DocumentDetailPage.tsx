import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  fetchDocumentById,
  generateDocumentContent,
  updateDocumentContent,
  reviewDocument,
  rejectDocument,
  approveDocument,
} from '../api/documentService'
import { useAuth } from '../contexts/AuthContext'
import type { Document } from '../types/document'

export function DocumentDetailPage() {
  const { documentId } = useParams<{ documentId: string }>()
  const { role } = useAuth()

  const [document, setDocument] = useState<Document | null>(null)
  const [editedContent, setEditedContent] = useState('')
  const [instruction, setInstruction] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [showRejectionForm, setShowRejectionForm] = useState(false)

  const [isLoading, setIsLoading] = useState(true)
  const [isActionLoading, setIsActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!documentId) return
    loadDocument(documentId)
  }, [documentId])

  function loadDocument(id: string) {
    setIsLoading(true)
    fetchDocumentById(id)
      .then((doc) => {
        setDocument(doc)
        setEditedContent(doc.generatedContent ?? '')
      })
      .catch(() => setError('Não foi possível carregar o documento.'))
      .finally(() => setIsLoading(false))
  }

  async function handleGenerate() {
    if (!documentId || !instruction.trim()) return
    setIsActionLoading(true)
    setError(null)
    try {
      await generateDocumentContent(documentId, { instruction })
      loadDocument(documentId)
      setInstruction('')
    } catch {
      setError('Falha ao gerar conteúdo. Tente novamente.')
    } finally {
      setIsActionLoading(false)
    }
  }

  async function handleSaveContent() {
    if (!documentId) return
    setIsActionLoading(true)
    setError(null)
    try {
      const updated = await updateDocumentContent(documentId, editedContent)
      setDocument(updated)
    } catch {
      setError('Falha ao salvar o conteúdo.')
    } finally {
      setIsActionLoading(false)
    }
  }

  async function handleReview() {
    if (!documentId) return
    setIsActionLoading(true)
    setError(null)
    try {
      const updated = await reviewDocument(documentId)
      setDocument(updated)
    } catch {
      setError('Falha ao marcar como revisado.')
    } finally {
      setIsActionLoading(false)
    }
  }

  async function handleReject() {
    if (!documentId || !rejectionReason.trim()) return
    setIsActionLoading(true)
    setError(null)
    try {
      const updated = await rejectDocument(documentId, rejectionReason)
      setDocument(updated)
      setRejectionReason('')
      setShowRejectionForm(false)
    } catch {
      setError('Falha ao rejeitar o documento.')
    } finally {
      setIsActionLoading(false)
    }
  }

  async function handleApprove() {
    if (!documentId) return
    setIsActionLoading(true)
    setError(null)
    try {
      const updated = await approveDocument(documentId)
      setDocument(updated)
    } catch {
      setError('Falha ao aprovar. Verifique se você tem permissão de ADMIN.')
    } finally {
      setIsActionLoading(false)
    }
  }

  if (isLoading) return <p className="text-slate-400">Carregando...</p>
  if (!document) return <p className="text-red-400">Documento não encontrado.</p>

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to={`/workspaces/${document.workspaceId}/documents`}
        className="text-blue-400 hover:underline text-sm mb-4 inline-block"
      >
        ← Voltar aos Documentos
      </Link>

      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-semibold text-white">{document.title}</h2>
        <span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300">
          {document.status}
        </span>
      </div>
      <p className="text-sm text-slate-400 mb-6">{document.type}</p>

      {error && (
        <p className="text-red-400 text-sm mb-4 bg-red-950 rounded-lg p-3">{error}</p>
      )}

      {/* DRAFT: pedir para a IA gerar */}
      {document.status === 'DRAFT' && (
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mb-4">
          <label className="block text-sm text-slate-300 mb-2">
            Instrução para a IA
          </label>
          <textarea
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            rows={3}
            placeholder="Ex: Escreva um resumo sobre a retenção de dados e base legal utilizada"
            className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:outline-none focus:border-blue-500 mb-3"
          />
          <button
            onClick={handleGenerate}
            disabled={isActionLoading || !instruction.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 transition-colors"
          >
            {isActionLoading ? 'Gerando...' : 'Gerar com IA'}
          </button>
        </div>
      )}

      {/* Conteúdo gerado - editável enquanto nao APROVADO */}
      {document.generatedContent !== null && (
        <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 mb-4">
          <label className="block text-sm text-slate-300 mb-2">
            Conteúdo {document.status === 'APPROVED' ? '(aprovado, somente leitura)' : ''}
          </label>
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            rows={10}
            readOnly={document.status === 'APPROVED'}
            className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:outline-none focus:border-blue-500 mb-3 disabled:opacity-70"
          />
          {document.status !== 'APPROVED' && (
            <button
              onClick={handleSaveContent}
              disabled={isActionLoading || editedContent === document.generatedContent}
              className="bg-slate-600 hover:bg-slate-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
            >
              Salvar edição manual
            </button>
          )}
        </div>
      )}

      {/* Acoes de revisao - GENERATED ou REVIEWED */}
      {(document.status === 'GENERATED' || document.status === 'REVIEWED') && (
        <div className="flex flex-wrap gap-3">
          {document.status === 'GENERATED' && (
            <button
              onClick={handleReview}
              disabled={isActionLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 transition-colors"
            >
              Marcar como Revisado
            </button>
          )}

          {role === 'ADMIN' && document.status === 'REVIEWED' && (
            <button
              onClick={handleApprove}
              disabled={isActionLoading}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-medium rounded-lg px-4 py-2 transition-colors"
            >
              Aprovar
            </button>
          )}

          {!showRejectionForm ? (
            <button
              onClick={() => setShowRejectionForm(true)}
              disabled={isActionLoading}
              className="bg-red-900 hover:bg-red-800 disabled:opacity-50 text-red-300 font-medium rounded-lg px-4 py-2 transition-colors"
            >
              Rejeitar
            </button>
          ) : (
            <div className="w-full bg-slate-800 rounded-lg p-4 border border-red-900 mt-2">
              <label className="block text-sm text-slate-300 mb-2">
                Motivo da rejeição
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={2}
                className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:outline-none focus:border-red-500 mb-3"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReject}
                  disabled={isActionLoading || !rejectionReason.trim()}
                  className="bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
                >
                  Confirmar rejeição
                </button>
                <button
                  onClick={() => setShowRejectionForm(false)}
                  className="text-slate-400 hover:text-slate-300 text-sm px-4 py-2"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}