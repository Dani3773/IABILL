import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api/authService'
import { useAuth } from '../contexts/AuthContext'

export function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuth()

  const [tenantId, setTenantId] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await login({ tenantId, email, password })
      setAuth(response)
      navigate('/dashboard')
    } catch {
      // Nunca revelamos se foi o e-mail ou a senha que estava errada -
      // mesma decisao de seguranca ja aplicada no backend.
      setError('E-mail ou senha inválidos')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-slate-800 rounded-xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          Entrar
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">
              ID da Empresa (Tenant)
            </label>
            <input
              type="text"
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              required
              className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg py-2 transition-colors"
          >
            {isLoading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-4">
          Não tem uma conta?{' '}
          <Link to="/signup" className="text-blue-400 hover:underline">
            Cadastre sua empresa
          </Link>
        </p>
      </div>
    </div>
  )
}