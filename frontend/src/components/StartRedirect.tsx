import { Navigate } from 'react-router-dom'
import { LoadingSpinner } from './LoadingSpinner'
import { useWorkspaces } from '../contexts/WorkspaceContext'

// Depois do login: abre o Inicio da ultima unidade usada, ou a tela de
// unidades quando a empresa ainda nao tem nenhuma cadastrada.
export function StartRedirect() {
  const { isLoading, currentWorkspace } = useWorkspaces()
  if (isLoading) return <LoadingSpinner label="Abrindo sua unidade..." />
  return (
    <Navigate
      to={currentWorkspace ? `/workspaces/${currentWorkspace.id}/inicio` : '/dashboard'}
      replace
    />
  )
}
