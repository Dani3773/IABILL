import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Check, ArrowRight, ArrowLeft } from "lucide-react";
import { login, signup } from "../api/authService";
import { getErrorMessage } from "../api/errorUtils";
import { useAuth } from "../contexts/AuthContext";
import { Alert } from "../components/Alert";

type SignupStep = 1 | 2 | 3;
type LegalRegime = "LGPD" | "RGPD";

const STEP_LABELS = ["Empresa", "Endereço", "Conta"];

function Wordmark({ size = "text-2xl" }: { size?: string }) {
  return (
    <div className="flex items-center gap-2">
      <svg viewBox="0 0 28 28" className="w-7 h-7 shrink-0">
        <rect x="1" y="1" width="26" height="26" rx="6" fill="none" stroke="#B8862B" strokeWidth="1.5" />
        <path d="M8 14.5 12 18.5 20 9" fill="none" stroke="#14B8A6" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className={`font-serif ${size} text-white`}>
        <span className="text-[#14B8A6]">IA</span>Bill
      </span>
    </div>
  );
}

function ApprovalSeal({ size = 96 }: { size?: number }) {
  return (
    <svg viewBox="0 0 200 200" style={{ width: size, height: size }}>
      <defs>
        <path id="seal-circle-auth" d="M 100,100 m -78,0 a 78,78 0 1,1 156,0 a 78,78 0 1,1 -156,0" />
      </defs>
      <circle cx="100" cy="100" r="94" fill="none" stroke="#B8862B" strokeWidth="1.5" opacity="0.5" />
      <circle cx="100" cy="100" r="78" fill="none" stroke="#B8862B" strokeWidth="2" />
      <text fill="#B8862B" fontSize="10.5" letterSpacing="3" fontFamily="ui-monospace, monospace">
        <textPath href="#seal-circle-auth" startOffset="0%">CONTA CRIADA · IABILL · BEM-VINDO ·</textPath>
      </text>
      <g transform="translate(100,100)">
        <circle r="46" fill="none" stroke="#B8862B" strokeWidth="1.5" />
        <path d="M -18,2 L -6,16 L 20,-14" fill="none" stroke="#B8862B" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

export function AuthPage({ initialMode = "login" }: { initialMode?: "login" | "signup" }) {
  const navigate = useNavigate();
  const { setAuth } = useAuth();
  const [isSignUpMode, setIsSignUpMode] = useState(initialMode === "signup");
  const [step, setStep] = useState<SignupStep>(1);
  const [justCreated, setJustCreated] = useState(false);

  // Login
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup - empresa
  const [workspaceDocumentId, setWorkspaceDocumentId] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspacePhone, setWorkspacePhone] = useState("");
  const [legalRegimes, setLegalRegimes] = useState<LegalRegime[]>(["LGPD"]);
  const [cnpjLookupLoading, setCnpjLookupLoading] = useState(false);

  // Signup - endereço
  const [workspaceCountry, setWorkspaceCountry] = useState("BR");
  const [workspaceState, setWorkspaceState] = useState("");
  const [workspaceCity, setWorkspaceCity] = useState("");
  const [workspaceStreet, setWorkspaceStreet] = useState("");
  const [workspaceAddressNumber, setWorkspaceAddressNumber] = useState("");

  // Signup - conta
  const [adminUsername, setAdminUsername] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupLoading, setSignupLoading] = useState(false);

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      const response = await login({ email, password });
      setAuth(response);
      navigate(response.tenantId ? "/dashboard" : "/platform");
    } catch (err) {
      setLoginError(getErrorMessage(err, "E-mail ou senha inválidos"));
    } finally {
      setLoginLoading(false);
    }
  }

  function formatCnpj(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 14);
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
    if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`;
  }

  async function handleCnpjBlur() {
    const sanitized = workspaceDocumentId.replace(/\D/g, "");
    if (sanitized.length !== 14) return;

    setCnpjLookupLoading(true);
    try {
      const response = await fetch(`/api/v1/auth/cnpj/${sanitized}`);
      const stillSameCnpj = workspaceDocumentId.replace(/\D/g, "") === sanitized;
      if (!stillSameCnpj) return;

      if (response.ok) {
        const data = await response.json();
        if (data.found && data.name) setWorkspaceName(data.name);
      }
    } catch {
      // Falha silenciosa deliberada - autopreenchimento e opcional.
    } finally {
      setCnpjLookupLoading(false);
    }
  }

  function toggleLegalRegime(regime: LegalRegime) {
    setLegalRegimes((prev) =>
      prev.includes(regime) ? prev.filter((r) => r !== regime) : [...prev, regime],
    );
  }

  function canAdvanceFromStep1() {
    return workspaceDocumentId.replace(/\D/g, "").length === 14 && workspaceName.trim().length > 0 && legalRegimes.length > 0;
  }

  function canAdvanceFromStep2() {
    return workspaceCountry.trim().length === 2;
  }

  function goNext() {
    setSignupError(null);
    if (step === 1 && !canAdvanceFromStep1()) {
      setSignupError("Preencha CNPJ, nome da empresa e selecione ao menos um regime legal.");
      return;
    }
    if (step === 2 && !canAdvanceFromStep2()) {
      setSignupError("Informe o país (código de 2 letras, ex: BR).");
      return;
    }
    setStep((prev) => (prev < 3 ? ((prev + 1) as SignupStep) : prev));
  }

  function goBack() {
    setSignupError(null);
    setStep((prev) => (prev > 1 ? ((prev - 1) as SignupStep) : prev));
  }

  async function handleSignup(e: FormEvent) {
    e.preventDefault();
    setSignupError(null);
    setSignupLoading(true);
    try {
      const response = await signup({
        tenantName: workspaceName,
        workspaceName,
        workspaceDocumentId,
        workspaceCountry,
        workspaceState: workspaceState || undefined,
        workspaceCity: workspaceCity || undefined,
        workspaceStreet: workspaceStreet || undefined,
        workspaceAddressNumber: workspaceAddressNumber || undefined,
        workspacePhone: workspacePhone || undefined,
        workspaceLegalRegimes: legalRegimes,
        adminUsername,
        adminEmail,
        adminPassword,
      });
      setJustCreated(true);
      setTimeout(() => {
        setAuth(response);
        navigate("/dashboard");
      }, 1400);
    } catch (err) {
      setSignupError(getErrorMessage(err, "Não foi possível criar a conta. Verifique os dados."));
    } finally {
      setSignupLoading(false);
    }
  }

  function switchMode(toSignup: boolean) {
    setIsSignUpMode(toSignup);
    setStep(1);
    setSignupError(null);
    setLoginError(null);
  }

  const addressParts = [workspaceStreet, workspaceAddressNumber].filter(Boolean).join(", ");
  const cityState = [workspaceCity, workspaceState].filter(Boolean).join(" - ");

  return (
    <div className="min-h-screen bg-[#0E1220] flex items-center justify-center px-4 py-8">
      <style>{`
        @keyframes iabill-seal-pop {
          from { opacity: 0; transform: scale(0.7) rotate(-12deg); }
          to { opacity: 1; transform: scale(1) rotate(-6deg); }
        }
        .iabill-seal-pop { animation: iabill-seal-pop 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        @keyframes iabill-fade-slide {
          from { opacity: 0; transform: translateX(12px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .iabill-step-in { animation: iabill-fade-slide 0.35s ease-out both; }
        @media (prefers-reduced-motion: reduce) {
          .iabill-seal-pop, .iabill-step-in { animation: none; }
        }
      `}</style>

      <div className="w-full max-w-4xl grid md:grid-cols-[1fr_1.15fr] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
        {/* Painel esquerdo - preview ao vivo (documento) */}
        <div className="hidden md:flex flex-col justify-between bg-[#EDEAE1] p-8">
          <div>
            <p className="font-mono text-[10px] tracking-widest text-[#0d7a6d] uppercase mb-6">
              {isSignUpMode ? "Pré-visualização · Cadastro" : "Bem-vindo de volta"}
            </p>

            {isSignUpMode ? (
              <div className="space-y-4">
                <div>
                  <div className="h-2 w-2/3 bg-[#1B2233]/15 rounded-full mb-2" />
                  <h2 className="font-serif text-xl text-[#1B2233] leading-snug min-h-[2.5rem]">
                    {workspaceName || "Sua empresa aparece aqui"}
                  </h2>
                  {workspaceDocumentId && (
                    <p className="font-mono text-xs text-[#1B2233]/50 mt-1">
                      {formatCnpj(workspaceDocumentId)}
                    </p>
                  )}
                </div>

                {legalRegimes.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {legalRegimes.map((r) => (
                      <span
                        key={r}
                        className="text-[10px] font-mono tracking-wide uppercase bg-[#14B8A6]/15 text-[#0d7a6d] rounded px-2 py-1"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                )}

                {(addressParts || cityState || workspaceCountry) && (
                  <div className="pt-3 border-t border-[#1B2233]/10">
                    <p className="text-[10px] font-mono uppercase tracking-wide text-[#1B2233]/40 mb-1">
                      Endereço
                    </p>
                    <p className="text-xs text-[#1B2233]/70 leading-relaxed">
                      {addressParts && <>{addressParts}<br /></>}
                      {cityState && <>{cityState}<br /></>}
                      {workspaceCountry}
                    </p>
                  </div>
                )}

                {workspacePhone && (
                  <p className="text-xs text-[#1B2233]/60 font-mono">{workspacePhone}</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="h-2 w-3/4 bg-[#1B2233]/15 rounded-full" />
                <div className="h-2 w-full bg-[#1B2233]/10 rounded-full" />
                <div className="h-2 w-5/6 bg-[#1B2233]/10 rounded-full" />
                <div className="h-2 w-2/3 bg-[#1B2233]/10 rounded-full" />
              </div>
            )}
          </div>

          <div className="flex items-center justify-center pt-6">
            {justCreated ? (
              <div className="iabill-seal-pop">
                <ApprovalSeal size={112} />
              </div>
            ) : (
              <p className="text-[10px] font-mono text-[#1B2233]/35 uppercase tracking-widest">
                Aguardando confirmação
              </p>
            )}
          </div>
        </div>

        {/* Painel direito - formulário */}
        <div className="bg-[#0E1220] p-8 flex flex-col">
          <div className="mb-6">
            <Wordmark />
          </div>

          <div className="flex items-center gap-1 mb-6 text-sm">
            <button
              onClick={() => switchMode(false)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                !isSignUpMode ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => switchMode(true)}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                isSignUpMode ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Cadastrar
            </button>
          </div>

          {!isSignUpMode ? (
            <form onSubmit={handleLogin} className="space-y-4 flex-1">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                  placeholder="voce@empresa.com"
                  className="w-full rounded-lg bg-white/5 text-white text-sm px-3 py-2.5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/40 focus:border-[#14B8A6] transition-all placeholder:text-slate-600"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full rounded-lg bg-white/5 text-white text-sm px-3 py-2.5 pr-10 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/40 focus:border-[#14B8A6] transition-all placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {loginError && <Alert type="error" message={loginError} />}
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-[#14B8A6] hover:bg-[#0d9c8c] disabled:opacity-50 text-[#0E1220] text-sm font-semibold rounded-lg py-2.5 transition-colors mt-2"
              >
                {loginLoading ? "Entrando..." : "Entrar"}
              </button>
            </form>
          ) : (
            <div className="flex-1 flex flex-col">
              {/* Stepper */}
              <div className="flex items-center gap-2 mb-6">
                {STEP_LABELS.map((label, i) => {
                  const stepNum = (i + 1) as SignupStep;
                  const isDone = step > stepNum;
                  const isCurrent = step === stepNum;
                  return (
                    <div key={label} className="flex items-center gap-2 flex-1">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-medium shrink-0 transition-colors ${
                          isDone
                            ? "bg-[#14B8A6] text-[#0E1220]"
                            : isCurrent
                              ? "border-2 border-[#14B8A6] text-[#14B8A6]"
                              : "border border-slate-700 text-slate-600"
                        }`}
                      >
                        {isDone ? <Check className="w-3 h-3" /> : stepNum}
                      </div>
                      <span className={`text-[11px] hidden sm:block ${isCurrent ? "text-white" : "text-slate-600"}`}>
                        {label}
                      </span>
                      {i < STEP_LABELS.length - 1 && <div className="flex-1 h-px bg-slate-800" />}
                    </div>
                  );
                })}
              </div>

              <form onSubmit={handleSignup} className="flex-1 flex flex-col">
                <div key={step} className="iabill-step-in space-y-3 flex-1">
                  {step === 1 && (
                    <>
                      <input
                        type="text"
                        value={workspaceDocumentId}
                        onChange={(e) => setWorkspaceDocumentId(formatCnpj(e.target.value))}
                        onBlur={handleCnpjBlur}
                        required
                        autoComplete="off"
                        placeholder="CNPJ"
                        className="w-full rounded-lg bg-white/5 text-white text-sm px-3 py-2.5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/40 focus:border-[#14B8A6] placeholder:text-slate-600"
                      />
                      {cnpjLookupLoading && (
                        <p className="text-xs text-[#14B8A6]">Buscando dados da empresa...</p>
                      )}
                      <input
                        type="text"
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                        required
                        autoComplete="off"
                        placeholder="Nome da empresa"
                        className="w-full rounded-lg bg-white/5 text-white text-sm px-3 py-2.5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/40 focus:border-[#14B8A6] placeholder:text-slate-600"
                      />
                      <input
                        type="text"
                        value={workspacePhone}
                        onChange={(e) => setWorkspacePhone(e.target.value)}
                        autoComplete="off"
                        placeholder="Telefone (opcional)"
                        className="w-full rounded-lg bg-white/5 text-white text-sm px-3 py-2.5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/40 focus:border-[#14B8A6] placeholder:text-slate-600"
                      />
                      <div>
                        <p className="text-xs text-slate-400 mb-2">Regime legal aplicável</p>
                        <div className="flex gap-3">
                          {(["LGPD", "RGPD"] as LegalRegime[]).map((regime) => (
                            <button
                              type="button"
                              key={regime}
                              onClick={() => toggleLegalRegime(regime)}
                              className={`flex-1 text-xs font-medium rounded-lg py-2.5 border transition-colors ${
                                legalRegimes.includes(regime)
                                  ? "bg-[#14B8A6]/15 border-[#14B8A6] text-[#14B8A6]"
                                  : "border-white/10 text-slate-500 hover:border-white/20"
                              }`}
                            >
                              {regime === "LGPD" ? "LGPD (Brasil)" : "RGPD (UE)"}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {step === 2 && (
                    <>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={workspaceCountry}
                          onChange={(e) => setWorkspaceCountry(e.target.value.toUpperCase())}
                          maxLength={2}
                          required
                          placeholder="País"
                          className="w-full rounded-lg bg-white/5 text-white text-sm px-3 py-2.5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/40 focus:border-[#14B8A6] placeholder:text-slate-600"
                        />
                        <input
                          type="text"
                          value={workspaceState}
                          onChange={(e) => setWorkspaceState(e.target.value)}
                          autoComplete="off"
                          placeholder="Estado"
                          className="w-full rounded-lg bg-white/5 text-white text-sm px-3 py-2.5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/40 focus:border-[#14B8A6] placeholder:text-slate-600"
                        />
                        <input
                          type="text"
                          value={workspaceCity}
                          onChange={(e) => setWorkspaceCity(e.target.value)}
                          autoComplete="off"
                          placeholder="Cidade"
                          className="w-full rounded-lg bg-white/5 text-white text-sm px-3 py-2.5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/40 focus:border-[#14B8A6] placeholder:text-slate-600"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={workspaceStreet}
                          onChange={(e) => setWorkspaceStreet(e.target.value)}
                          autoComplete="off"
                          placeholder="Rua"
                          className="col-span-2 w-full rounded-lg bg-white/5 text-white text-sm px-3 py-2.5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/40 focus:border-[#14B8A6] placeholder:text-slate-600"
                        />
                        <input
                          type="text"
                          value={workspaceAddressNumber}
                          onChange={(e) => setWorkspaceAddressNumber(e.target.value)}
                          autoComplete="off"
                          placeholder="Número"
                          className="w-full rounded-lg bg-white/5 text-white text-sm px-3 py-2.5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/40 focus:border-[#14B8A6] placeholder:text-slate-600"
                        />
                      </div>
                    </>
                  )}

                  {step === 3 && (
                    <>
                      <input
                        type="text"
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        required
                        placeholder="Seu nome de usuário"
                        className="w-full rounded-lg bg-white/5 text-white text-sm px-3 py-2.5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/40 focus:border-[#14B8A6] placeholder:text-slate-600"
                      />
                      <input
                        type="email"
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        required
                        autoComplete="username"
                        placeholder="Seu e-mail"
                        className="w-full rounded-lg bg-white/5 text-white text-sm px-3 py-2.5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/40 focus:border-[#14B8A6] placeholder:text-slate-600"
                      />
                      <div className="relative">
                        <input
                          type={showSignupPassword ? "text" : "password"}
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          minLength={8}
                          required
                          autoComplete="new-password"
                          placeholder="Senha (mínimo 8 caracteres)"
                          className="w-full rounded-lg bg-white/5 text-white text-sm px-3 py-2.5 pr-10 border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/40 focus:border-[#14B8A6] placeholder:text-slate-600"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword(!showSignupPassword)}
                          tabIndex={-1}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                        >
                          {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {signupError && (
                  <div className="mt-3">
                    <Alert type="error" message={signupError} />
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={goBack}
                      className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white px-3 py-2.5 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" /> Voltar
                    </button>
                  )}
                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={goNext}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-[#14B8A6] hover:bg-[#0d9c8c] text-[#0E1220] text-sm font-semibold rounded-lg py-2.5 transition-colors"
                    >
                      Continuar <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={signupLoading || justCreated}
                      className="flex-1 bg-[#B8862B] hover:bg-[#A9791F] disabled:opacity-50 text-[#0E1220] text-sm font-semibold rounded-lg py-2.5 transition-colors"
                    >
                      {justCreated ? "Conta criada ✓" : signupLoading ? "Criando..." : "Criar conta"}
                    </button>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}