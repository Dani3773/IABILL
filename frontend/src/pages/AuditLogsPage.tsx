import { useEffect, useState } from 'react'
import { fetchAuditLogs } from '../api/auditLogService'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { Alert } from '../components/Alert'
import { getErrorMessage } from '../api/errorUtils'
import type { AuditLog, AuditAction } from '../types/auditLog'
import { Download } from 'lucide-react'

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

  function handleExportCsv() {
    // Link direto para o endpoint - o navegador trata a resposta como download
    // por causa do header Content-Disposition que o backend ja envia.
    window.open(`${import.meta.env.VITE_API_URL ?? ''}/api/v1/audit-logs/export`, '_blank')
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-white mb-1">Trilha de Auditoria</h2>
          <p className="text-sm text-slate-400">
            Registro imutável de todas as ações realizadas no sistema.
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors shrink-0"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {logs.length === 0 ? (
        <p className="text-slate-400">Nenhum registro de auditoria ainda.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400 border-b border-slate-700">
                <th className="py-2 pr-4">Data</th>
                <th className="py-2 pr-4">Usuário</th>
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
                  <td className="py-3 pr-4 text-slate-300">
                    {log.username ?? <span className="text-slate-500 italic">Sistema</span>}
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