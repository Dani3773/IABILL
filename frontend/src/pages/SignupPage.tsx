import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signup } from '../api/authService'
import { useAuth } from '../contexts/AuthContext'
import { getErrorMessage } from '../api/errorUtils'
import { Alert } from '../components/Alert'

export function SignupPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuth()

  const [tenantName, setTenantName] = useState('')
  const [tenantDocumentId, setTenantDocumentId] = useState('')
  const [tenantCountry, setTenantCountry] = useState('BR')
  const [adminUsername, setAdminUsername] = useState('')
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await signup({
        tenantName,
        tenantDocumentId,
        tenantCountry,
        adminUsername,
        adminEmail,
        adminPassword,
      })
      setAuth(response)
      navigate('/dashboard')
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível criar a conta. Verifique os dados e tente novamente.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md bg-slate-800 rounded-xl p-8 shadow-xl">
        <div className="flex justify-center mb-6">
          <img src="../public/Logo.png" alt="IABill" className="h-20" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-6 text-center">
          Cadastrar Empresa
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Nome da Empresa
            </label>
            <input
              type="text"
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              required
              className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">
              CNPJ / Documento
            </label>
            <input
              type="text"
              value={tenantDocumentId}
              onChange={(e) => setTenantDocumentId(e.target.value)}
              required
              className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">
              País (código ISO, ex: BR)
            </label>
            <input
              type="text"
              value={tenantCountry}
              onChange={(e) => setTenantCountry(e.target.value.toUpperCase())}
              maxLength={2}
              required
              className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <hr className="border-slate-700" />

          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Seu nome de usuário (Admin)
            </label>
            <input
              type="text"
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
              required
              className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Seu e-mail
            </label>
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              required
              className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-300 mb-1">
              Senha (mínimo 8 caracteres)
            </label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              minLength={8}
              required
              className="w-full rounded-lg bg-slate-700 text-white px-3 py-2 border border-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {error && <Alert type="error" message={error} />}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white font-medium rounded-lg py-2 transition-colors"
          >
            {isLoading ? 'Criando conta...' : 'Criar conta'}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm mt-4">
          Já tem uma conta?{' '}
          <Link to="/login" className="text-cyan-400 hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}