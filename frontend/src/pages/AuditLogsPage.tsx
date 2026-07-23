import { useEffect, useState } from 'react'
import { fetchAuditLogs } from '../api/auditLogService'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { Alert } from '../components/Alert'
import { getErrorMessage } from '../api/errorUtils'
import type { AuditLog, AuditAction } from '../types/auditLog'

const ACTION_STYLES: Record<AuditAction, string> = {
  CREATE: 'bg-green-900 text-green-300',
  UPDATE: 'bg-blue-900 text-blue-300',
  DELETE: 'bg-red-900 text-red-300',
  VIEW: 'bg-slate-700 text-slate-300',
  AI_GENERATE: 'bg-purple-900 text-purple-300',
  AI_REVIEW: 'bg-purple-900 text-purple-300',
  APPROVE: 'bg-green-900 text-green-300',
  EXPORT: 'bg-slate-700 text-slate-300',
  REJECT: 'bg-red-900 text-red-300',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR')
}

function formatMetadata(metadata: Record<string, unknown> | null): string {
  if (!metadata) return '-'
  return Object.entries(metadata)
    .map(([key, value]) => `${key}: ${value}`)
    .join(', ')
}

export function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAuditLogs()
      .then(setLogs)
      .catch((err) => setError(getErrorMessage(err, 'Não foi possível carregar a trilha de auditoria.')))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <LoadingSpinner label="Carregando trilha de auditoria..." />
  if (error) return <Alert type="error" message={error} />

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-1">Trilha de Auditoria</h2>
      <p className="text-sm text-slate-400 mb-4">
        Registro imutável de todas as ações realizadas no sistema.
      </p>

      {logs.length === 0 ? (
        <p className="text-slate-400">Nenhum registro de auditoria ainda.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-700">
                <th className="py-2 pr-4">Data</th>
                <th className="py-2 pr-4">Ação</th>
                <th className="py-2 pr-4">Entidade</th>
                <th className="py-2 pr-4">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-slate-800">
                  <td className="py-3 pr-4 text-slate-300 whitespace-nowrap">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="py-3 pr-4">
                    <span className={`text-xs px-2 py-1 rounded ${ACTION_STYLES[log.action]}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-slate-300">{log.entityType}</td>
                  <td className="py-3 pr-4 text-slate-400 max-w-xs truncate">
                    {formatMetadata(log.metadata)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}