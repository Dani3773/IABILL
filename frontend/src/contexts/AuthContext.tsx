import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { fetchCurrentUser, logout as logoutRequest } from '../api/authService'
import type { AuthMeResponse } from '../types/auth'

interface AuthState {
  userId: string | null
  tenantId: string | null
  role: 'ADMIN' | 'USER' | 'SUPER_ADMIN' | null
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean
  isLoading: boolean
  setAuth: (data: AuthMeResponse) => void
  clearAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const EMPTY_STATE: AuthState = { userId: null, tenantId: null, role: null }

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(EMPTY_STATE)
  const [isLoading, setIsLoading] = useState(true)

  // Ao carregar a pagina (F5, ou primeira visita), pergunta pro backend
  // quem esta logado - o cookie httpOnly (se existir e for valido) resolve isso.
  useEffect(() => {
    fetchCurrentUser()
      .then((data) => setState({ userId: data.userId, tenantId: data.tenantId, role: data.role }))
      .catch(() => setState(EMPTY_STATE))
      .finally(() => setIsLoading(false))
  }, [])

  function setAuth(data: AuthMeResponse) {
    setState({ userId: data.userId, tenantId: data.tenantId, role: data.role })
  }

  async function clearAuth() {
    try {
      await logoutRequest()
    } finally {
      setState(EMPTY_STATE)
    }
  }

  return (
    <AuthContext.Provider
      value={{ ...state, isAuthenticated: !!state.userId, isLoading, setAuth, clearAuth }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
}