import { useEffect, useState, type FormEvent } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchTenantDetail, updateTenant } from '../api/platformService'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { Alert } from '../components/Alert'
import { getErrorMessage } from '../api/errorUtils'
import type { PlatformTenantDetail } from '../types/platform'

export function PlatformTenantDetailPage() {
  const { tenantId } = useParams<{ tenantId: string }>()

  const [tenant, setTenant] = useState<PlatformTenantDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState('')
  const [documentId, setDocumentId] = useState('')
  const [country, setCountry] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!tenantId) return
    load(tenantId)
  }, [tenantId])

  function load(id: string) {
    setIsLoading(true)
    fetchTenantDetail(id)
      .then((data) => {
        setTenant(data)
        setName(data.name)
        setDocumentId(data.documentId)
        setCountry(data.country)
      })
      .catch((err) => setError(getErrorMessage(err, 'Não foi possível carregar o tenant.')))
      .finally(() => setIsLoading(false))
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault()
    if (!tenantId) return
    setSaving(true)
    setError(null)
    try {
      const updated = await updateTenant(tenantId, { name, documentId, country })
      setTenant(updated)
      setIsEditing(false)
      setSuccessMessage('Dados da empresa atualizados.')
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível salvar as alterações.'))
    } finally {
      setSaving(false)
    }
  }

  if (isLoading) return <LoadingSpinner label="Carregando empresa..." />
  if (!tenant) return <Alert type="error" message="Empresa não encontrada." />

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/platform" className="text-cyan-400 hover:underline text-sm mb-4 inline-block">
        ← Voltar à Plataforma
      </Link>

      <div className="space-y-3 mb-4">
        {error && <Alert type="error" message={error} />}
        {successMessage && <Alert type="success" message={successMessage} />}
      </div>

      <div className="bg-slate-800 rounded-lg p-5 border border-slate-700 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Dados da Empresa</h2>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-cyan-400 hover:underline"
            >
              Editar
            </button>
          )}
        </div>

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Nome</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg bg-slate-900 text-white text-sm px-3 py-2 border border-slate-700 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">CNPJ</label>
              <input
                value={documentId}
                onChange={(e) => setDocumentId(e.target.value)}
                required
                className="w-full rounded-lg bg-slate-900 text-white text-sm px-3 py-2 border border-slate-700 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">País</label>
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value.toUpperCase())}
                maxLength={2}
                required
                className="w-full rounded-lg bg-slate-900 text-white text-sm px-3 py-2 border border-slate-700 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={saving}
                className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
              >
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="text-sm text-slate-400 hover:text-slate-300 px-4 py-2"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-slate-400">Nome</dt>
              <dd className="text-white">{tenant.name}</dd>
            </div>
            <div>
              <dt className="text-slate-400">CNPJ</dt>
              <dd className="text-white">{tenant.documentId}</dd>
            </div>
            <div>
              <dt className="text-slate-400">País</dt>
              <dd className="text-white">{tenant.country}</dd>
            </div>
            <div>
              <dt className="text-slate-400">Cadastrada em</dt>
              <dd className="text-white">{new Date(tenant.createdAt).toLocaleDateString('pt-BR')}</dd>
            </div>
          </dl>
        )}
      </div>

      <div className="bg-slate-800 rounded-lg p-5 border border-slate-700 mb-6">
        <h2 className="text-lg font-semibold text-white mb-3">Usuários ({tenant.users.length})</h2>
        <div className="space-y-2">
          {tenant.users.map((u) => (
            <div key={u.id} className="flex items-center justify-between bg-slate-900 rounded-lg px-3 py-2 text-sm">
              <div>
                <p className="text-white">{u.username}</p>
                <p className="text-slate-400 text-xs">{u.email}</p>
              </div>
              <span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300">{u.role}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800 rounded-lg p-5 border border-slate-700">
        <h2 className="text-lg font-semibold text-white mb-3">Workspaces ({tenant.workspaces.length})</h2>
        <div className="space-y-2">
          {tenant.workspaces.map((w) => (
            <div key={w.id} className="flex items-center justify-between bg-slate-900 rounded-lg px-3 py-2 text-sm">
              <p className="text-white">{w.name}</p>
              <span className="text-xs px-2 py-1 rounded bg-purple-900 text-purple-300">{w.type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}