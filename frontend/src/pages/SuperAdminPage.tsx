import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchAllTenants } from '../api/platformService'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { Alert } from '../components/Alert'
import { getErrorMessage } from '../api/errorUtils'
import type { PlatformTenantSummary } from '../types/platform'

import { getSystemLanguage, tr } from '../i18n/tr'
export function SuperAdminPage() {
  const navigate = useNavigate()
  const [tenants, setTenants] = useState<PlatformTenantSummary[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAllTenants()
      .then(setTenants)
      .catch((err) => setError(getErrorMessage(err, tr('Não foi possível carregar os tenants.'))))
      .finally(() => setIsLoading(false))
  }, [])

  if (isLoading) return <LoadingSpinner label={tr('Carregando visão da plataforma...')} />

  return (
    <div>
      <h2 className="text-xl text-[#0A0A0A] mb-1">{tr('Visão Geral da Plataforma')}</h2>
      <p className="text-sm text-[#0A0A0A]/55 mb-6">{tr('Todas as empresas cadastradas no IABill (')}{tenants.length}{' '}{tr('no total).')}</p>

      {error && <div className="mb-4"><Alert type="error" message={error} /></div>}

      <div className="bg-white rounded-xl border border-[#0A0A0A]/10 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[#0A0A0A]/50 border-b border-[#0A0A0A]/10">
              <th className="py-3 px-4">{tr('Empresa')}</th>
              <th className="py-3 px-4">{tr('Cadastrada em')}</th>
              <th className="py-3 px-4 text-center">{tr('Usuários')}</th>
              <th className="py-3 px-4 text-center">{tr('Unidades')}</th>
              <th className="py-3 px-4 text-center">{tr('Documentos')}</th>
              <th className="py-3 px-4 text-center">{tr('Status')}</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr
                key={t.id}
                onClick={() => navigate(`/platform/${t.id}`)}
                className="border-b border-[#0A0A0A]/8 last:border-0 hover:bg-[#fbfaf6] cursor-pointer transition-colors"
              >
                <td className="py-3 px-4 text-[#0A0A0A] font-medium">{t.name}</td>
                <td className="py-3 px-4 text-[#0A0A0A]/60 whitespace-nowrap">
                  {new Date(t.createdAt).toLocaleDateString(getSystemLanguage())}
                </td>
                <td className="py-3 px-4 text-center text-[#0A0A0A]/70">{t.userCount}</td>
                <td className="py-3 px-4 text-center text-[#0A0A0A]/70">{t.workspaceCount}</td>
                <td className="py-3 px-4 text-center text-[#0A0A0A]/70">{t.documentCount}</td>
                <td className="py-3 px-4 text-center">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      t.active ? 'bg-[#D92B21]/12 text-[#0A0A0A]' : 'bg-red-50 text-red-700'
                    }`}
                  >
                    {t.active ? tr('Ativo') : tr('Inativo')}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}