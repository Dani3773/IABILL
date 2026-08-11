import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { login, signup } from "../api/authService";
import { getErrorMessage } from "../api/errorUtils";
import { useAuth } from "../contexts/AuthContext";
import { Alert } from "../components/Alert";

interface Props {
  initialMode?: "login" | "signup";
}

export function AuthPage({ initialMode = "login" }: Props) {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [isSignUpMode, setIsSignUpMode] = useState(initialMode === "signup");

  // Login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup
  const [tenantName, setTenantName] = useState("");
  const [tenantDocumentId, setTenantDocumentId] = useState("");
  const [tenantCountry, setTenantCountry] = useState("BR");
  const [adminUsername, setAdminUsername] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupLoading, setSignupLoading] = useState(false);
  const [cnpjLookupLoading, setCnpjLookupLoading] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const response = await login({ email, password });
      setAuth(response);
      navigate(response.tenantId ? '/dashboard' : '/platform')
    } catch (err) {
      setLoginError(getErrorMessage(err, "E-mail ou senha inválidos"));
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleCnpjBlur() {
    const sanitized = tenantDocumentId.replace(/\D/g, "");
    if (sanitized.length !== 14) return;

    setCnpjLookupLoading(true);
    try {
      const response = await fetch(`/api/v1/auth/cnpj/${sanitized}`);
      if (response.ok) {
        const data = await response.json();
        if (data.found && data.name) {
          setTenantName(data.name);
        }
      }
    } catch {
      // Falha silenciosa deliberada - autopreenchimento e opcional,
      // usuario sempre pode digitar o nome manualmente.
    } finally {
      setCnpjLookupLoading(false);
    }
  }

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setSignupError(null);
    setSignupLoading(true);
    try {
      const response = await signup({
        tenantName,
        tenantDocumentId,
        tenantCountry,
        adminUsername,
        adminEmail,
        adminPassword,
      });
      setAuth(response);
      navigate("/dashboard");
    } catch (err) {
      setSignupError(
        getErrorMessage(
          err,
          "Não foi possível criar a conta. Verifique os dados.",
        ),
      );
    } finally {
      setSignupLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 flex items-center justify-center px-4 py-8">
      <div className="relative w-full max-w-3xl h-[600px] bg-slate-800 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-700/50">
        {/* Formulario de Login - metade esquerda */}
        <div
          className={`absolute top-0 left-0 w-1/2 h-full flex items-center transition-all duration-700 ease-in-out ${
            isSignUpMode
              ? "translate-x-full opacity-0 pointer-events-none"
              : "translate-x-0 opacity-100"
          }`}
        >
          <form onSubmit={handleLogin} className="w-full px-10 space-y-3.5">
            <img src="/logo.png" alt="IABill" className="h-10 mx-auto mb-2" />
            <h1 className="text-xl font-bold text-white text-center mb-4">
              Entrar
            </h1>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="voce@empresa.com"
                className="w-full rounded-lg bg-slate-900 text-white text-sm px-3 py-2 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all placeholder:text-slate-600"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full rounded-lg bg-slate-900 text-white text-sm px-3 py-2 pr-10 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-all placeholder:text-slate-600"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? (
                    <EyeOff className="w-3.5 h-3.5" />
                  ) : (
                    <Eye className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {loginError && <Alert type="error" message={loginError} />}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2.5 transition-colors mt-2"
            >
              {loginLoading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        </div>

        {/* Formulario de Cadastro - metade direita */}
        <div
          className={`absolute top-0 right-0 w-1/2 h-full flex items-center transition-all duration-700 ease-in-out ${
            isSignUpMode
              ? "translate-x-0 opacity-100"
              : "-translate-x-full opacity-0 pointer-events-none"
          }`}
        >
          <form
            onSubmit={handleSignup}
            className="w-full px-8 py-4 space-y-2 overflow-y-auto max-h-full"
          >
            <h1 className="text-lg font-bold text-white text-center mb-2">
              Cadastrar Empresa
            </h1>

            <input
              type="text"
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              required
              placeholder="Nome da empresa"
              className="w-full rounded-lg bg-slate-900 text-white text-xs px-3 py-1.5 border border-slate-700 focus:outline-none focus:border-cyan-500"
            />
            <input
              type="text"
              value={tenantDocumentId}
              onChange={(e) => setTenantDocumentId(e.target.value)}
              required
              placeholder="CNPJ"
              onBlur={handleCnpjBlur}
              className="w-full rounded-lg bg-slate-900 text-white text-xs px-3 py-1.5 border border-slate-700 focus:outline-none focus:border-cyan-500"
            />
            <input
              type="text"
              value={tenantCountry}
              onChange={(e) => setTenantCountry(e.target.value.toUpperCase())}
              maxLength={2}
              required
              placeholder="País (ex: BR)"
              className="w-full rounded-lg bg-slate-900 text-white text-xs px-3 py-1.5 border border-slate-700 focus:outline-none focus:border-cyan-500"
            />
            <input
              type="text"
              value={adminUsername}
              onChange={(e) => setAdminUsername(e.target.value)}
              required
              placeholder="Seu nome de usuário"
              className="w-full rounded-lg bg-slate-900 text-white text-xs px-3 py-1.5 border border-slate-700 focus:outline-none focus:border-cyan-500"
            />
            <input
              type="email"
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
              required
              placeholder="Seu e-mail"
              className="w-full rounded-lg bg-slate-900 text-white text-xs px-3 py-1.5 border border-slate-700 focus:outline-none focus:border-cyan-500"
            />
            <div className="relative">
              <input
                type={showSignupPassword ? "text" : "password"}
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                minLength={8}
                required
                placeholder="Senha (mínimo 8 caracteres)"
                className="w-full rounded-lg bg-slate-900 text-white text-xs px-3 py-1.5 pr-9 border border-slate-700 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={() => setShowSignupPassword(!showSignupPassword)}
                tabIndex={-1}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showSignupPassword ? (
                  <EyeOff className="w-3.5 h-3.5" />
                ) : (
                  <Eye className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {signupError && <Alert type="error" message={signupError} />}

            <button
              type="submit"
              disabled={signupLoading}
              className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm font-medium rounded-lg py-2 transition-colors mt-2"
            >
              {signupLoading ? "Criando..." : "Criar conta"}
            </button>
          </form>
        </div>

        {/* Painel deslizante colorido (overlay) - versao simplificada, sem o bug de largura */}
        <div
          className={`absolute top-0 left-1/2 w-1/2 h-full overflow-hidden transition-transform duration-700 ease-in-out z-20 bg-gradient-to-br from-cyan-600 to-slate-900 ${
            isSignUpMode ? "-translate-x-full" : "translate-x-0"
          }`}
        >
          {/* Mensagem exibida no modo LOGIN (painel fica a direita, convida para cadastro) */}
          <div
            className={`absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center text-center px-10 transition-all duration-700 ease-in-out ${
              isSignUpMode
                ? "translate-x-full opacity-0 pointer-events-none"
                : "translate-x-0 opacity-100"
            }`}
          >
            <h2 className="text-2xl font-bold text-white mb-3">Olá!</h2>
            <p className="text-slate-200 text-sm mb-6">
              Ainda não tem uma conta? Cadastre sua empresa e comece a usar o
              IABill.
            </p>
            <button
              onClick={() => setIsSignUpMode(true)}
              className="border-2 border-white text-white text-sm font-medium rounded-lg px-6 py-2 hover:bg-white/10 transition-colors"
            >
              Cadastrar
            </button>
          </div>

          {/* Mensagem exibida no modo CADASTRO (painel fica a esquerda, convida para login) */}
          <div
            className={`absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center text-center px-10 transition-all duration-700 ease-in-out ${
              isSignUpMode
                ? "translate-x-0 opacity-100"
                : "-translate-x-full opacity-0 pointer-events-none"
            }`}
          >
            <h2 className="text-2xl font-bold text-white mb-3">
              Bem-vindo de volta!
            </h2>
            <p className="text-slate-200 text-sm mb-6">
              Já tem uma conta? Entre com seus dados para acessar o IABill.
            </p>
            <button
              onClick={() => setIsSignUpMode(false)}
              className="border-2 border-white text-white text-sm font-medium rounded-lg px-6 py-2 hover:bg-white/10 transition-colors"
            >
              Entrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
