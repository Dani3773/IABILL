import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api/authService'
import { getErrorMessage } from '../api/errorUtils'
import { useAuth } from '../contexts/AuthContext'
import { Alert } from '../components/Alert'

export function LoginPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await login({ email, password })
      setAuth(response)
      navigate('/dashboard')
    } catch (err) {
      setError(getErrorMessage(err, 'E-mail ou senha inválidos'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="IABill" className="h-14" />
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Conformidade estruturada com apoio de IA
          </p>
        </div>

        <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700/50">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="voce@empresa.com"
                className="w-full rounded-lg bg-slate-900 text-white px-3.5 py-2.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all placeholder:text-slate-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full rounded-lg bg-slate-900 text-white px-3.5 py-2.5 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all placeholder:text-slate-600"
              />
            </div>

            {error && <Alert type="error" message={error} />}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg py-2.5 transition-colors mt-2"
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          Não tem uma conta?{' '}
          <Link to="/signup" className="text-cyan-400 hover:text-cyan-300 font-medium">
            Cadastre sua empresa
          </Link>
        </p>
      </div>
    </div>
  )
}