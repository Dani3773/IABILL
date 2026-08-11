import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  fetchIncidents,
  createIncident,
  updateIncidentStatus,
  notifyAnpd,
  notifyDataSubjects,
} from '../api/incidentService'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { Alert } from '../components/Alert'
import { getErrorMessage } from '../api/errorUtils'
import type { Incident, IncidentSeverity, IncidentStatus } from '../types/incident'

const SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  LOW: 'Baixa',
  MEDIUM: 'Média',
  HIGH: 'Alta',
  CRITICAL: 'Crítica',
}

const SEVERITY_STYLES: Record<IncidentSeverity, string> = {
  LOW: 'bg-slate-700 text-slate-300',
  MEDIUM: 'bg-yellow-900 text-yellow-300',
  HIGH: 'bg-orange-900 text-orange-300',
  CRITICAL: 'bg-red-900 text-red-300',
}

const STATUS_LABELS: Record<IncidentStatus, string> = {
  IDENTIFIED: 'Identificado',
  ASSESSING: 'Em Avaliação',
  ANPD_NOTIFIED: 'ANPD Notificada',
  DATA_SUBJECTS_NOTIFIED: 'Titulares Notificados',
  RESOLVED: 'Resolvido',
}

const STATUS_STYLES: Record<IncidentStatus, string> = {
  IDENTIFIED: 'bg-slate-700 text-slate-300',
  ASSESSING: 'bg-yellow-900 text-yellow-300',
  ANPD_NOTIFIED: 'bg-blue-900 text-blue-300',
  DATA_SUBJECTS_NOTIFIED: 'bg-cyan-900 text-cyan-300',
  RESOLVED: 'bg-green-900 text-green-300',
}

// Status selecionaveis manualmente no dropdown - ANPD_NOTIFIED e DATA_SUBJECTS_NOTIFIED
// ficam de fora de proposito: so devem ser atingidos via os botoes dedicados de
// notificacao, que gravam o timestamp real. Selecionar via dropdown deixaria o status
// dizendo "notificado" sem nenhum registro de quando isso aconteceu de fato.
const MANUAL_STATUS_OPTIONS: IncidentStatus[] = ['IDENTIFIED', 'ASSESSING', 'RESOLVED']

export function IncidentsPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()

  const [incidents, setIncidents] = useState<Incident[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [affectedDataCategories, setAffectedDataCategories] = useState('')
  const [estimatedAffectedCount, setEstimatedAffectedCount] = useState('')
  const [severity, setSeverity] = useState<IncidentSeverity>('MEDIUM')
  const [mitigationMeasures, setMitigationMeasures] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!workspaceId) return
    load(workspaceId)
  }, [workspaceId])

  function load(id: string) {
    setIsLoading(true)
    fetchIncidents(id)
      .then(setIncidents)
      .catch((err) => setError(getErrorMessage(err, 'Não foi possível carregar os incidentes.')))
      .finally(() => setIsLoading(false))
  }

  async function handleCreate() {
    if (!workspaceId || !title.trim() || !description.trim() || !affectedDataCategories.trim()) return
    setIsSaving(true)
    setError(null)
    try {
      const created = await createIncident({
        workspaceId,
        title,
        description,
        affectedDataCategories,
        estimatedAffectedCount: estimatedAffectedCount ? Number(estimatedAffectedCount) : undefined,
        severity,
        mitigationMeasures: mitigationMeasures || undefined,
      })
      setIncidents((prev) => [created, ...prev])
      setTitle('')
      setDescription('')
      setAffectedDataCategories('')
      setEstimatedAffectedCount('')
      setSeverity('MEDIUM')
      setMitigationMeasures('')
      setShowForm(false)
      setSuccessMessage('Incidente registrado.')
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível registrar o incidente.'))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleStatusChange(id: string, status: IncidentStatus) {
    try {
      const updated = await updateIncidentStatus(id, status)
      setIncidents((prev) => prev.map((i) => (i.id === id ? updated : i)))
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível atualizar o status.'))
    }
  }

  async function handleNotifyAnpd(id: string) {
    if (!window.confirm('Confirma que a ANPD foi notificada sobre este incidente agora?')) return
    try {
      const updated = await notifyAnpd(id)
      setIncidents((prev) => prev.map((i) => (i.id === id ? updated : i)))
      setSuccessMessage('Notificação à ANPD registrada.')
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível registrar a notificação.'))
    }
  }

  async function handleNotifyDataSubjects(id: string) {
    if (!window.confirm('Confirma que os titulares afetados foram notificados agora?')) return
    try {
      const updated = await notifyDataSubjects(id)
      setIncidents((prev) => prev.map((i) => (i.id === id ? updated : i)))
      setSuccessMessage('Notificação aos titulares registrada.')
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível registrar a notificação.'))
    }
  }

  if (isLoading) return <LoadingSpinner label="Carregando incidentes..." />

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        to={`/workspaces/${workspaceId}/documents`}
        className="text-cyan-400 hover:underline text-sm mb-4 inline-block"
      >
        ← Voltar aos Documentos
      </Link>

      <h2 className="text-xl font-semibold text-white mb-1">Incidentes de Segurança</h2>
      <p className="text-sm text-slate-400 mb-6">
        Registro de incidentes e vazamentos de dados pessoais, conforme Art. 48 da LGPD.
      </p>

      <div className="space-y-3 mb-4">
        {error && <Alert type="error" message={error} />}
        {successMessage && <Alert type="success" message={successMessage} />}
      </div>

      <div className="mb-6">
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="bg-red-700 hover:bg-red-600 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
          >
            + Registrar novo incidente
          </button>
        ) : (
          <div className="bg-slate-800 rounded-lg p-4 border border-red-900/50 space-y-2">
            <h3 className="text-sm font-medium text-slate-300 mb-1">Novo incidente</h3>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do incidente"
              className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:outline-none focus:border-cyan-500"
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Descrição do que aconteceu"
              className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:outline-none focus:border-cyan-500"
            />
            <textarea
              value={affectedDataCategories}
              onChange={(e) => setAffectedDataCategories(e.target.value)}
              rows={2}
              placeholder="Categorias de dados afetadas (ex: CPF, e-mail, dados bancários)"
              className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:outline-none focus:border-cyan-500"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={estimatedAffectedCount}
                onChange={(e) => setEstimatedAffectedCount(e.target.value)}
                placeholder="Nº estimado de titulares afetados"
                className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:outline-none focus:border-cyan-500"
              />
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as IncidentSeverity)}
                className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:outline-none focus:border-cyan-500"
              >
                {Object.entries(SEVERITY_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    Severidade: {label}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              value={mitigationMeasures}
              onChange={(e) => setMitigationMeasures(e.target.value)}
              rows={2}
              placeholder="Medidas de mitigação já adotadas (opcional)"
              className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:outline-none focus:border-cyan-500"
            />
            <div className="flex gap-2 pt-1">
              <button
                onClick={handleCreate}
                disabled={isSaving || !title.trim() || !description.trim() || !affectedDataCategories.trim()}
                className="bg-red-700 hover:bg-red-600 disabled:opacity-50 text-white text-sm font-medium rounded-lg px-4 py-2 transition-colors"
              >
                {isSaving ? 'Registrando...' : 'Registrar incidente'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="text-sm text-slate-400 hover:text-slate-300 px-4 py-2"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      <h3 className="text-sm font-medium text-slate-300 mb-2">Incidentes registrados ({incidents.length})</h3>
      {incidents.length === 0 ? (
        <p className="text-slate-400 text-sm">Nenhum incidente registrado.</p>
      ) : (
        <div className="space-y-3">
          {incidents.map((incident) => (
            <div key={incident.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-white text-sm">{incident.title}</p>
                    <span className={`text-xs px-2 py-0.5 rounded ${SEVERITY_STYLES[incident.severity]}`}>
                      {SEVERITY_LABELS[incident.severity]}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{incident.description}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Dados afetados: {incident.affectedDataCategories}
                    {incident.estimatedAffectedCount != null && ` · ~${incident.estimatedAffectedCount} titulares`}
                  </p>
                </div>
                <select
                  value={incident.status}
                  onChange={(e) => handleStatusChange(incident.id, e.target.value as IncidentStatus)}
                  disabled={!MANUAL_STATUS_OPTIONS.includes(incident.status)}
                  className={`text-xs rounded px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-cyan-500 ${STATUS_STYLES[incident.status]}`}
                >
                  {incident.status === 'ANPD_NOTIFIED' || incident.status === 'DATA_SUBJECTS_NOTIFIED' ? (
                    <option value={incident.status}>{STATUS_LABELS[incident.status]}</option>
                  ) : (
                    MANUAL_STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div className="flex items-center gap-4 pt-2 mt-2 border-t border-slate-700 text-xs">
                {incident.anpdNotifiedAt ? (
                  <span className="text-blue-400">
                    ANPD notificada em {new Date(incident.anpdNotifiedAt).toLocaleString('pt-BR')}
                  </span>
                ) : (
                  <button onClick={() => handleNotifyAnpd(incident.id)} className="text-blue-400 hover:underline">
                    Registrar notificação à ANPD
                  </button>
                )}
                {incident.dataSubjectsNotifiedAt ? (
                  <span className="text-cyan-400">
                    Titulares notificados em {new Date(incident.dataSubjectsNotifiedAt).toLocaleString('pt-BR')}
                  </span>
                ) : (
                  <button
                    onClick={() => handleNotifyDataSubjects(incident.id)}
                    className="text-cyan-400 hover:underline"
                  >
                    Registrar notificação aos titulares
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}