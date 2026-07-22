import { createContext, useContext, useState, type ReactNode } from 'react'
import { jwtDecode } from 'jwt-decode'
import type { LoginResponse } from '../types/auth'

interface JwtPayload {
  sub: string // userId
  tenantId: string
  role: 'ADMIN' | 'USER'
  exp: number
}

interface AuthState {
  token: string | null
  userId: string | null
  tenantId: string | null
  role: 'ADMIN' | 'USER' | null
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean
  setAuth: (data: LoginResponse) => void
  clearAuth: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const STORAGE_KEY = 'auth_token'

function decodeStateFromToken(token: string): AuthState {
  try {
    const payload = jwtDecode<JwtPayload>(token)

    // Se o token ja expirou, trata como se nao houvesse autenticacao.
    if (payload.exp * 1000 < Date.now()) {
      return { token: null, userId: null, tenantId: null, role: null }
    }

    return {
      token,
      userId: payload.sub,
      tenantId: payload.tenantId,
      role: payload.role,
    }
  } catch {
    return { token: null, userId: null, tenantId: null, role: null }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    return stored
      ? decodeStateFromToken(stored)
      : { token: null, userId: null, tenantId: null, role: null }
  })

  function setAuth(data: LoginResponse) {
    sessionStorage.setItem(STORAGE_KEY, data.token)
    setState(decodeStateFromToken(data.token))
  }

  function clearAuth() {
    sessionStorage.removeItem(STORAGE_KEY)
    setState({ token: null, userId: null, tenantId: null, role: null })
  }

  return (
    <AuthContext.Provider
      value={{ ...state, isAuthenticated: !!state.token, setAuth, clearAuth }}
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