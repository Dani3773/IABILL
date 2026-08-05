import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAllTenants } from '../api/platformService'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { Alert } from '../components/Alert'
import { getErrorMessage } from '../api/errorUtils'
import type { PlatformTenantSummary } from '../types/platform'

export function SuperAdminPage() {
  const navigate = useNavigate()
  const [tenants, setTenants] = useState<PlatformTenantSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAllTenants()
      .then(setTenants)
      .catch((err) => setError(getErrorMessage(err, 'Não foi possível carregar os tenants.')))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <LoadingSpinner label="Carregando visão da plataforma..." />

  return (
    <div>
      <h2 className="text-xl font-semibold text-white mb-1">Visão Geral da Plataforma</h2>
      <p className="text-sm text-slate-400 mb-6">
        Todas as empresas cadastradas no IABill ({tenants.length} no total).
      </p>

      {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-slate-400 border-b border-slate-700">
              <th className="py-2 pr-4">Empresa</th>
              <th className="py-2 pr-4">CNPJ</th>
              <th className="py-2 pr-4">País</th>
              <th className="py-2 pr-4">Cadastrada em</th>
              <th className="py-2 pr-4 text-center">Usuários</th>
              <th className="py-2 pr-4 text-center">Workspaces</th>
              <th className="py-2 pr-4 text-center">Documentos</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr
                key={t.id}
                onClick={() => navigate(`/platform/${t.id}`)}
                className="border-b border-slate-800 hover:bg-slate-800/50 cursor-pointer transition-colors"
              >
                <td className="py-3 pr-4 text-white font-medium">{t.name}</td>
                <td className="py-3 pr-4 text-slate-400">{t.documentId}</td>
                <td className="py-3 pr-4 text-slate-400">{t.country}</td>
                <td className="py-3 pr-4 text-slate-400 whitespace-nowrap">
                  {new Date(t.createdAt).toLocaleDateString('pt-BR')}
                </td>
                <td className="py-3 pr-4 text-center text-slate-300">{t.userCount}</td>
                <td className="py-3 pr-4 text-center text-slate-300">{t.workspaceCount}</td>
                <td className="py-3 pr-4 text-center text-slate-300">{t.documentCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}