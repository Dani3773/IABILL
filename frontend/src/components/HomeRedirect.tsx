import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

// Decide para onde mandar o usuario ao acessar a raiz do app (ou uma rota
// desconhecida) - Super-Admins sem tenant vao para "Plataforma", todo
// o resto vai para o Inicio da ultima unidade usada.
export function HomeRedirect() {
  const { tenantId } = useAuth()
  return <Navigate to={tenantId ? '/inicio' : '/platform'} replace />
}
