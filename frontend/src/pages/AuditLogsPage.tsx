import { useEffect, useState } from 'react'
import { fetchAuditLogs } from '../api/auditLogService'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { Alert } from '../components/Alert'
import { getErrorMessage } from '../api/errorUtils'
import type { AuditLog, AuditAction } from '../types/auditLog'
import { Download } from 'lucide-react'

const ACTION_STYLES: Record<AuditAction, string> = {
  CREATE: 'bg-[#14B8A6]/12 text-[#0d7a6d]',
  UPDATE: 'bg-blue-50 text-blue-700',
  DELETE: 'bg-red-50 text-red-700',
  VIEW: 'bg-[#1B2233]/8 text-[#1B2233]/60',
  AI_GENERATE: 'bg-[#B8862B]/12 text-[#B8862B]',
  AI_REVIEW: 'bg-[#B8862B]/12 text-[#B8862B]',
  APPROVE: 'bg-[#14B8A6]/12 text-[#0d7a6d]',
  EXPORT: 'bg-[#1B2233]/8 text-[#1B2233]/60',
  REJECT: 'bg-red-50 text-red-700',
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
          <h2 className="text-xl font-serif text-[#1B2233] mb-1">Trilha de Auditoria</h2>
          <p className="text-sm text-[#1B2233]/55">
            Registro imutável de todas as ações realizadas no sistema.
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 bg-[#14B8A6] hover:bg-[#10a595] text-[#0A0D16] text-sm font-semibold rounded-lg px-4 py-2 transition-colors shrink-0"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {logs.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#1B2233]/10 p-10 text-center">
          <p className="text-[#1B2233]/55 text-sm">Nenhum registro de auditoria ainda.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#1B2233]/10 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#1B2233]/50 border-b border-[#1B2233]/10">
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Usuário</th>
                <th className="py-3 px-4">Ação</th>
                <th className="py-3 px-4">Entidade</th>
                <th className="py-3 px-4">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b border-[#1B2233]/8 last:border-0">
                  <td className="py-3 px-4 text-[#1B2233]/70 whitespace-nowrap">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="py-3 px-4 text-[#1B2233]">
                    {log.username ?? <span className="text-[#1B2233]/40 italic">Sistema</span>}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${ACTION_STYLES[log.action]}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-[#1B2233]/70">{log.entityType}</td>
                  <td className="py-3 px-4 text-[#1B2233]/50 max-w-xs truncate">
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