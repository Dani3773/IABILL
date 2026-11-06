import { Logo } from "../components/brand/Logo";
import {
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Check,
  ArrowRight,
  ArrowLeft,
  Building2,
  MapPin,
  UserRound,
  Mail,
  Lock,
  Phone,
  Globe,
  Landmark,
  Hash,
  Loader2,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import { login, signup } from "../api/authService";
import { getErrorMessage } from "../api/errorUtils";
import { useAuth } from "../contexts/AuthContext";
import { Alert } from "../components/Alert";
import { COUNTRIES, BRAZILIAN_STATES } from "../constants/locations";
import { AxiosError } from "axios";
import { resendConfirmation } from "../api/authService";
import { Link } from "react-router-dom";
import { loginWithMfa } from "../api/authService";

type SignupStep = 1 | 2 | 3;
type LegalRegime = "LGPD" | "RGPD";
type StepDirection = "fwd" | "back";

const STEPS: { label: string; icon: typeof Building2 }[] = [
  { label: "Empresa", icon: Building2 },
  { label: "Endereço", icon: MapPin },
  { label: "Conta", icon: UserRound },
];

const INPUT_CLASS =
  "w-full rounded-lg bg-white/[0.05] text-white text-sm px-3 py-2.5 border border-white/10 transition-all duration-200 placeholder:text-slate-600 " +
  "hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-[#D92B21]/35 focus:border-[#D92B21]/70 focus:bg-white/[0.07] " +
  "[&:-webkit-autofill]:[-webkit-text-fill-color:#fff] [&:-webkit-autofill]:[transition:background-color_9999s]";
const INPUT_WITH_ICON = INPUT_CLASS + " pl-9";

function Wordmark({ size = "text-2xl" }: { size?: string }) {
  return (
    <div className="select-none">
      <span className={`${size} text-white tracking-tight`}>
        <Logo />
      </span>
      <p className="text-sm text-slate-400 mt-1">
        Adequação à LGPD e ao RGPD
      </p>
    </div>
  );
}

function ApprovalSeal({ size = 96 }: { size?: number }) {
  return (
    <svg viewBox="0 0 200 200" style={{ width: size, height: size }}>
      <defs>
        <path id="seal-circle-auth" d="M 100,100 m -78,0 a 78,78 0 1,1 156,0 a 78,78 0 1,1 -156,0" />
      </defs>
      <circle cx="100" cy="100" r="94" fill="none" stroke="#D92B21" strokeWidth="1.5" opacity="0.5" />
      <circle cx="100" cy="100" r="78" fill="none" stroke="#D92B21" strokeWidth="2" />
      <text fill="#D92B21" fontSize="10.5" letterSpacing="3" fontFamily="Switzer, sans-serif">
        <textPath href="#seal-circle-auth" startOffset="0%">CONTA CRIADA · IABILL · BEM-VINDO ·</textPath>
      </text>
      <g transform="translate(100,100)">
        <circle r="46" fill="none" stroke="#D92B21" strokeWidth="1.5" />
        <path
          d="M -18,2 L -6,16 L 20,-14"
          fill="none"
          stroke="#D92B21"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

function Field({
  label,
  optional,
  children,
}: {
  label: string;
  optional?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="flex items-baseline gap-1.5 text-[11px] font-medium text-slate-400 mb-1.5 tracking-wide">
        {label}
        {optional && <span className="text-slate-600 font-normal">· opcional</span>}
      </span>
      {children}
    </label>
  );
}

function passwordStrength(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  return Math.min(4, Math.max(1, score));
}

const STRENGTH_META = [
  { label: "", color: "transparent" },
  { label: "Fraca", color: "#F87171" },
  { label: "Média", color: "#FBBF24" },
  { label: "Boa", color: "#D92B21" },
  { label: "Forte", color: "#D92B21" },
];

export function AuthPage({ initialMode = "login" }: { initialMode?: "login" | "signup" }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuth } = useAuth();
  const [isSignUpMode, setIsSignUpMode] = useState(initialMode === "signup");
  const [step, setStep] = useState<SignupStep>(1);
  const [stepDirection, setStepDirection] = useState<StepDirection>("fwd");
  const [justCreated, setJustCreated] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const [workspaceDocumentId, setWorkspaceDocumentId] = useState("");
  const [workspaceName, setWorkspaceName] = useState(
    (location.state as { company?: string } | null)?.company ?? "",
  );
  const [workspacePhone, setWorkspacePhone] = useState("");
  const [legalRegimes, setLegalRegimes] = useState<LegalRegime[]>(["LGPD"]);
  const [cnpjLookupLoading, setCnpjLookupLoading] = useState(false);
  const [cnpjAutofilled, setCnpjAutofilled] = useState(false);

  const [workspaceCountry, setWorkspaceCountry] = useState("Brasil");
  const [workspaceState, setWorkspaceState] = useState("");
  const [workspaceCity, setWorkspaceCity] = useState("");
  const [workspaceStreet, setWorkspaceStreet] = useState("");
  const [workspaceAddressNumber, setWorkspaceAddressNumber] = useState("");

  const [adminUsername, setAdminUsername] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);

  const [signupError, setSignupError] = useState<string | null>(null);
  const [signupLoading, setSignupLoading] = useState(false);

  const autofillTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const strength = passwordStrength(adminPassword);

  const [workspaceNeighborhood, setWorkspaceNeighborhood] = useState("");
  const [workspacePostalCode, setWorkspacePostalCode] = useState("");
  const [cepLookupLoading, setCepLookupLoading] = useState(false);

  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [signupSuccess, setSignupSuccess] = useState<string | null>(null);

  const [mfaStep, setMfaStep] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaLoading, setMfaLoading] = useState(false);

  function handleCapsLock(e: KeyboardEvent<HTMLInputElement>) {
    setCapsLockOn(e.getModifierState?.("CapsLock") ?? false);
  }

  async function handleLogin(e: FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setNeedsConfirmation(false);
    setResendMessage(null);
    setLoginLoading(true);
    try {
      const response = await login({ email, password });
      if ("mfaRequired" in response) {
        setMfaStep(true);
        return;
      }
      setAuth(response);
      navigate(response.tenantId ? "/dashboard" : "/platform");
    } catch (err) {
      if (err instanceof AxiosError && err.response?.status === 403) {
        setNeedsConfirmation(true);
        setLoginError(getErrorMessage(err, "Confirme seu e-mail antes de entrar."));
      } else {
        setLoginError(getErrorMessage(err, "E-mail ou senha inválidos"));
      }
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleMfaSubmit(e: FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setMfaLoading(true);
    try {
      const response = await loginWithMfa({ email, password, code: Number(mfaCode) });
      setAuth(response);
      navigate(response.tenantId ? "/dashboard" : "/platform");
    } catch (err) {
      setLoginError(getErrorMessage(err, "Código inválido."));
    } finally {
      setMfaLoading(false);
    }
  }

  async function handleResendConfirmation() {
    setResendLoading(true);
    setResendMessage(null);
    try {
      const result = await resendConfirmation({ email, password });
      setResendMessage(result.message);
    } catch (err) {
      setResendMessage(getErrorMessage(err, "Não foi possível reenviar o e-mail."));
    } finally {
      setResendLoading(false);
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

  function formatPhone(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
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
        if (data.found && data.name) {
          setWorkspaceName(data.name);
          setCnpjAutofilled(true);
          clearTimeout(autofillTimer.current);
          autofillTimer.current = setTimeout(() => setCnpjAutofilled(false), 1800);
        }
      }
    } catch {
      // Falha silenciosa deliberada.
    } finally {
      setCnpjLookupLoading(false);
    }
  }

  function formatCep(value: string): string {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)}-${digits.slice(5)}`;
  }

  async function handleCepBlur() {
    const sanitized = workspacePostalCode.replace(/\D/g, "");
    if (sanitized.length !== 8) return;

    setCepLookupLoading(true);
    try {
      const response = await fetch(`/api/v1/auth/cep/${sanitized}`);
      const stillSameCep = workspacePostalCode.replace(/\D/g, "") === sanitized;
      if (!stillSameCep) return;

      if (response.ok) {
        const data = await response.json();
        if (data.found) {
          if (data.street) setWorkspaceStreet(data.street);
          if (data.neighborhood) setWorkspaceNeighborhood(data.neighborhood);
          if (data.city) setWorkspaceCity(data.city);
          if (data.state) setWorkspaceState(data.state);
        }
      }
    } catch {
      // Falha silenciosa deliberada - autopreenchimento e opcional.
    } finally {
      setCepLookupLoading(false);
    }
  }

  function toggleLegalRegime(regime: LegalRegime) {
    setLegalRegimes((prev) => (prev.includes(regime) ? prev.filter((r) => r !== regime) : [...prev, regime]));
  }

  function canAdvanceFromStep1() {
    return workspaceDocumentId.replace(/\D/g, "").length === 14 && workspaceName.trim().length > 0 && legalRegimes.length > 0;
  }
  function canAdvanceFromStep2() {
    return workspaceCountry.trim().length > 0;
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
    setStepDirection("fwd");
    setStep((prev) => (prev < 3 ? ((prev + 1) as SignupStep) : prev));
  }
  function goBack() {
    setSignupError(null);
    setStepDirection("back");
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
        workspaceNeighborhood: workspaceNeighborhood || undefined,
        workspacePostalCode: workspacePostalCode || undefined,
        workspaceStreet: workspaceStreet || undefined,
        workspaceAddressNumber: workspaceAddressNumber || undefined,
        workspacePhone: workspacePhone || undefined,
        workspaceLegalRegimes: legalRegimes,
        adminUsername,
        adminEmail,
        adminPassword,
      });
      setJustCreated(true);
      setSignupSuccess(response.message);
    } catch (err) {
      setSignupError(getErrorMessage(err, "Não foi possível criar a conta. Verifique os dados."));
    } finally {
      setSignupLoading(false);
    }
  }

  function switchMode(toSignup: boolean) {
    if (toSignup === isSignUpMode) return;
    setIsSignUpMode(toSignup);
    setStep(1);
    setStepDirection("fwd");
    setSignupError(null);
    setLoginError(null);
  }

  const addressParts = [workspaceStreet, workspaceAddressNumber].filter(Boolean).join(", ");
  const cityState = [workspaceCity, workspaceState].filter(Boolean).join(" - ");

  return (
    <div className="relative min-h-screen bg-[#000000] flex items-center justify-center px-4 py-8 overflow-hidden">
      <style>{`
        @keyframes iabill-card-enter {
          from { opacity: 0; transform: translateY(16px) scale(0.985); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .iabill-card-enter { animation: iabill-card-enter 0.65s cubic-bezier(0.16,1,0.3,1) both; }
        @keyframes iabill-seal-pop {
          0% { opacity: 0; transform: scale(0.6) rotate(-16deg); }
          70% { opacity: 1; transform: scale(1.06) rotate(-4deg); }
          100% { opacity: 1; transform: scale(1) rotate(-6deg); }
        }
        .iabill-seal-pop { animation: iabill-seal-pop 0.6s cubic-bezier(0.16,1,0.3,1) both; }
        @keyframes iabill-slide-fwd {
          from { opacity: 0; transform: translateX(18px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes iabill-slide-back {
          from { opacity: 0; transform: translateX(-18px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .iabill-step-fwd { animation: iabill-slide-fwd 0.32s cubic-bezier(0.16,1,0.3,1) both; }
        .iabill-step-back { animation: iabill-slide-back 0.32s cubic-bezier(0.16,1,0.3,1) both; }
        @keyframes iabill-shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
        .iabill-shake { animation: iabill-shake 0.4s ease-in-out both; }
        .iabill-card-edge {
          background: #141414;
        }
        @media (prefers-reduced-motion: reduce) {
          .iabill-seal-pop, .iabill-step-fwd, .iabill-step-back,
          .iabill-card-enter, .iabill-shake { animation: none; }
        }
      `}</style>

      <div className="iabill-card-enter iabill-card-edge relative w-full max-w-4xl grid md:grid-cols-[1fr_1.15fr] rounded-2xl overflow-hidden ">
        <div className="absolute top-0 inset-x-8 h-px bg-linear-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

        <div className="hidden md:flex flex-col justify-between p-8 border-r border-white/10 bg-white/1.5">
          {isSignUpMode ? (
            <>
              <div>
                <p className="text-sm text-[#FF8A80] mb-6">
                  Pré-visualização · Cadastro
                </p>
                <div className="space-y-4">
                  <div>
                    <div className="h-2 w-2/3 bg-white/10 rounded-full mb-2" />
                    <h2 className="text-xl text-white leading-snug min-h-10 transition-all">
                      {workspaceName || <span className="text-slate-600">Sua empresa aparece aqui</span>}
                    </h2>
                    {workspaceDocumentId && (
                      <p className="text-xs text-slate-400 mt-1">{formatCnpj(workspaceDocumentId)}</p>
                    )}
                  </div>
                  {legalRegimes.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {legalRegimes.map((r) => (
                        <span
                          key={r}
                          className="text-[10px] tracking-wide uppercase bg-[#D92B21]/15 text-[#FF8A80] border border-[#D92B21]/20 rounded px-2 py-1"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  )}
                  {(addressParts || workspaceNeighborhood || cityState || workspaceCountry) && (
                    <div className="pt-3 border-t border-white/10">
                      <p className="text-sm text-slate-500 mb-1">Endereço</p>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {addressParts && <>{addressParts}<br /></>}
                        {workspaceNeighborhood && <>{workspaceNeighborhood}<br /></>}
                        {cityState && <>{cityState}<br /></>}
                        {workspaceCountry}
                      </p>
                    </div>
                  )}
                  {workspacePhone && <p className="text-xs text-slate-400 ">{workspacePhone}</p>}
                </div>
              </div>
              <div className="flex items-center justify-center pt-6 min-h-34">
                {justCreated ? (
                  <div className="iabill-seal-pop drop-">
                    <ApprovalSeal size={112} />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D92B21]/60 animate-pulse" />
                    <p className="text-sm text-slate-600">
                      Aguardando confirmação
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div>
              <p className="text-sm text-[#FF8A80] mb-2">
                Bem-vindo de volta
              </p>
              <h2 className="text-xl text-white leading-snug mb-6">
                Sua conformidade, sempre auditável.
              </h2>

              <div className="grid grid-cols-3 gap-2 mb-6 pb-6 border-b border-white/10">
                <div>
                  <p className="text-lg text-white">1.000</p>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wide leading-tight mt-0.5">
                    Precision@1
                  </p>
                </div>
                <div>
                  <p className="text-lg text-white">1.000</p>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wide leading-tight mt-0.5">
                    Recall@5
                  </p>
                </div>
                <div>
                  <p className="text-lg text-white">100%</p>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wide leading-tight mt-0.5">
                    Recusa correta
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                Cada ação sobre dados pessoais fica registrada numa trilha de auditoria imutável,
                validada por avaliação quantitativa do mecanismo de recuperação de contexto.
              </p>
            </div>
          )}
        </div>

        <div className="p-8 flex flex-col">
          <div className="mb-6">
            <Wordmark />
          </div>

          <div className="relative grid grid-cols-2 rounded-xl bg-white/4 border border-white/10 p-1 mb-6 text-sm">
            <div
              className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] rounded-lg bg-white/10 border border-white/10 shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                isSignUpMode ? "translate-x-full" : "translate-x-0"
              }`}
            />
            <button
              type="button"
              onClick={() => switchMode(false)}
              className={`relative z-10 py-1.5 rounded-lg font-medium transition-colors duration-300 ${
                !isSignUpMode ? "text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Entrar
            </button>
            <button
              type="button"
              onClick={() => switchMode(true)}
              className={`relative z-10 py-1.5 rounded-lg font-medium transition-colors duration-300 ${
                isSignUpMode ? "text-white" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              Cadastrar
            </button>
          </div>

          {!isSignUpMode && mfaStep ? (
            <form onSubmit={handleMfaSubmit} className="space-y-4 flex-1 flex flex-col">
              <Field label="Código de verificação">
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    autoFocus
                    placeholder="000000"
                    className={INPUT_WITH_ICON + " tracking-widest text-center"}
                  />
                </div>
              </Field>
              <p className="text-xs text-slate-500">
                Abra seu aplicativo autenticador e digite o código de 6 dígitos.
              </p>
              {loginError && (
                <div key={loginError} className="iabill-shake">
                  <Alert type="error" message={loginError} />
                </div>
              )}
              <div className="flex-1" />
              <button
                type="submit"
                disabled={mfaLoading || mfaCode.length !== 6}
                className="w-full flex items-center justify-center gap-2 bg-[#D92B21] hover:bg-[#B4201A] active:scale-[0.985] disabled:opacity-60 disabled:pointer-events-none text-white text-sm font-semibold rounded-lg py-2.5 transition-all duration-200 "
              >
                {mfaLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Verificando...
                  </>
                ) : (
                  "Verificar"
                )}
              </button>
              <button
                type="button"
                onClick={() => { setMfaStep(false); setMfaCode(""); }}
                className="text-xs text-slate-500 hover:text-slate-300 text-center"
              >
                Voltar ao login
              </button>
            </form>
          ) : !isSignUpMode ? (
            <form onSubmit={handleLogin} className="space-y-4 flex-1 flex flex-col">
              <Field label="E-mail">
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="username"
                    placeholder="voce@empresa.com"
                    className={INPUT_WITH_ICON}
                  />
                </div>
              </Field>
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400 tracking-wide">Senha</span>
                <Link to="/esqueci-senha" className="text-[11px] text-[#FF8A80] hover:underline">
                  Esqueceu a senha?
                </Link>
              </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleCapsLock}
                    onKeyUp={handleCapsLock}
                    onBlur={() => setCapsLockOn(false)}
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={INPUT_WITH_ICON + " pr-10"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              {capsLockOn && (
                <p className="flex items-center gap-1.5 text-xs text-[#FBBF24]">
                  <AlertTriangle className="w-3.5 h-3.5" /> Caps Lock está ativado
                </p>
              )}
              {loginError && (
                <div key={loginError} className="iabill-shake">
                  <Alert type="error" message={loginError} />
                </div>
              )}
              {needsConfirmation && (
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={resendLoading}
                    className="text-[#FF8A80] hover:underline text-xs disabled:opacity-50"
                  >
                    {resendLoading ? "Reenviando..." : "Reenviar e-mail de confirmação"}
                  </button>
                  {resendMessage && (
                    <p className="text-xs text-slate-400 mt-1">{resendMessage}</p>
                  )}
                </div>
              )}
              <div className="flex-1" />
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full flex items-center justify-center gap-2 bg-[#D92B21] hover:bg-[#B4201A] active:scale-[0.985] disabled:opacity-60 disabled:pointer-events-none text-white text-sm font-semibold rounded-lg py-2.5 transition-all duration-200 "
              >
                {loginLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Entrando...
                  </>
                ) : (
                  <>
                    Entrar <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
              <p className="flex items-center justify-center gap-1.5 text-sm text-slate-600 pt-1">
                <ShieldCheck className="w-3 h-3" /> Conexão criptografada
              </p>
            </form>
          ) : justCreated ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-8 text-center">
              <div className="iabill-seal-pop md:hidden drop-">
                <ApprovalSeal size={120} />
              </div>
              <p className="text-lg text-white">Conta criada</p>
              <p className="text-sm text-slate-400 max-w-xs">{signupSuccess}</p>
              <button
                type="button"
                onClick={() => switchMode(false)}
                className="text-[#FF8A80] hover:underline text-sm mt-2"
              >
                Ir para o login
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                {STEPS.map(({ label, icon: Icon }, i) => {
                  const stepNum = (i + 1) as SignupStep;
                  const isDone = step > stepNum;
                  const isCurrent = step === stepNum;
                  return (
                    <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                            isDone
                              ? "bg-[#D92B21] text-white"
                              : isCurrent
                                ? "border-2 border-[#0A0A0A] text-[#FF8A80] "
                                : "border border-slate-700 text-slate-600"
                          }`}
                        >
                          {isDone ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                        </div>
                        <span
                          className={`text-[11px] hidden sm:block transition-colors duration-300 ${
                            isCurrent ? "text-white font-medium" : isDone ? "text-slate-400" : "text-slate-600"
                          }`}
                        >
                          {label}
                        </span>
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className="flex-1 h-px bg-slate-800 relative overflow-hidden rounded-full">
                          <div
                            className={`absolute inset-y-0 left-0 bg-[#D92B21] transition-all duration-500 ease-out ${
                              isDone ? "w-full" : "w-0"
                            }`}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <form onSubmit={handleSignup} className="flex-1 flex flex-col">
                <div
                  key={step}
                  className={`${stepDirection === "fwd" ? "iabill-step-fwd" : "iabill-step-back"} space-y-3 flex-1 min-h-68`}
                >
                  {step === 1 && (
                    <>
                      <Field label="CNPJ">
                        <div className="relative">
                          <Building2 className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            inputMode="numeric"
                            value={workspaceDocumentId}
                            onChange={(e) => setWorkspaceDocumentId(formatCnpj(e.target.value))}
                            onBlur={handleCnpjBlur}
                            required
                            autoComplete="off"
                            placeholder="00.000.000/0000-00"
                            className={INPUT_WITH_ICON + " "}
                          />
                          {cnpjLookupLoading && (
                            <Loader2 className="w-4 h-4 text-[#FF8A80] animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                          )}
                        </div>
                      </Field>
                      <Field label="Nome da empresa">
                        <div className="relative">
                          <Landmark className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={workspaceName}
                            onChange={(e) => setWorkspaceName(e.target.value)}
                            required
                            autoComplete="off"
                            placeholder="Razão social"
                            className={
                              INPUT_WITH_ICON +
                              (cnpjAutofilled
                                ? " ring-2 ring-[#D92B21]/50 border-[#D92B21]/70 bg-[#D92B21]/6"
                                : "")
                            }
                          />
                        </div>
                      </Field>
                      <Field label="Telefone" optional>
                        <div className="relative">
                          <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="tel"
                            inputMode="numeric"
                            value={workspacePhone}
                            onChange={(e) => setWorkspacePhone(formatPhone(e.target.value))}
                            autoComplete="off"
                            placeholder="(00) 00000-0000"
                            className={INPUT_WITH_ICON + " "}
                          />
                        </div>
                      </Field>
                      <div>
                        <p className="text-[11px] font-medium text-slate-400 mb-1.5 tracking-wide">Regime legal aplicável</p>
                        <div className="flex gap-3">
                          {(["LGPD", "RGPD"] as LegalRegime[]).map((regime) => {
                            const active = legalRegimes.includes(regime);
                            return (
                              <button
                                type="button"
                                key={regime}
                                onClick={() => toggleLegalRegime(regime)}
                                aria-pressed={active}
                                className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg py-2.5 border transition-all duration-200 active:scale-[0.97] ${
                                  active
                                    ? "bg-[#D92B21]/15 border-[#0A0A0A] text-[#FF8A80] "
                                    : "border-white/10 text-slate-500 hover:border-white/25 hover:text-slate-300"
                                }`}
                              >
                                {active && <Check className="w-3 h-3" />}
                                {regime === "LGPD" ? "LGPD (Brasil)" : "RGPD (UE)"}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </>
                  )}
                  {step === 2 && (
                    <>
                      <Field label="País">
                        <div className="relative">
                          <Globe className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <select
                            value={workspaceCountry}
                            onChange={(e) => {
                              setWorkspaceCountry(e.target.value);
                              setWorkspaceState("");
                            }}
                            required
                            className={INPUT_WITH_ICON + " appearance-none cursor-pointer"}
                          >
                            {COUNTRIES.map((c) => (
                              <option key={c.code} value={c.name} className="bg-[#000000]">
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </Field>

                      <Field label="CEP" optional={workspaceCountry !== "Brasil"}>
                        <div className="relative">
                          <Hash className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            inputMode="numeric"
                            value={workspacePostalCode}
                            onChange={(e) => setWorkspacePostalCode(formatCep(e.target.value))}
                            onBlur={workspaceCountry === "Brasil" ? handleCepBlur : undefined}
                            autoComplete="off"
                            placeholder={workspaceCountry === "Brasil" ? "00000-000" : "Código postal"}
                            className={INPUT_WITH_ICON + " "}
                          />
                          {cepLookupLoading && (
                            <Loader2 className="w-4 h-4 text-[#FF8A80] animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                          )}
                        </div>
                      </Field>

                      <div className="grid grid-cols-2 gap-2">
                        <Field label="Estado">
                          {workspaceCountry === "Brasil" ? (
                            <select
                              value={workspaceState}
                              onChange={(e) => setWorkspaceState(e.target.value)}
                              className={INPUT_CLASS + " appearance-none cursor-pointer"}
                            >
                              <option value="" className="bg-[#000000]">Selecione</option>
                              {BRAZILIAN_STATES.map((s) => (
                                <option key={s} value={s} className="bg-[#000000]">
                                  {s}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={workspaceState}
                              onChange={(e) => setWorkspaceState(e.target.value)}
                              autoComplete="off"
                              placeholder="Estado/Região"
                              className={INPUT_CLASS}
                            />
                          )}
                        </Field>
                        <Field label="Cidade" optional>
                          <input
                            type="text"
                            value={workspaceCity}
                            onChange={(e) => setWorkspaceCity(e.target.value)}
                            autoComplete="off"
                            placeholder="Florianópolis"
                            className={INPUT_CLASS}
                          />
                        </Field>
                      </div>

                      <Field label="Bairro" optional>
                        <input
                          type="text"
                          value={workspaceNeighborhood}
                          onChange={(e) => setWorkspaceNeighborhood(e.target.value)}
                          autoComplete="off"
                          placeholder="Centro"
                          className={INPUT_CLASS}
                        />
                      </Field>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <Field label="Rua" optional>
                            <div className="relative">
                              <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                              <input
                                type="text"
                                value={workspaceStreet}
                                onChange={(e) => setWorkspaceStreet(e.target.value)}
                                autoComplete="off"
                                placeholder="Av. Beira-Mar Norte"
                                className={INPUT_WITH_ICON}
                              />
                            </div>
                          </Field>
                        </div>
                        <Field label="Número" optional>
                          <div className="relative">
                            <Hash className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              value={workspaceAddressNumber}
                              onChange={(e) => setWorkspaceAddressNumber(e.target.value)}
                              autoComplete="off"
                              placeholder="1000"
                              className={INPUT_WITH_ICON}
                            />
                          </div>
                        </Field>
                      </div>
                      <p className="text-[11px] text-slate-600 pt-1 leading-relaxed">
                        {workspaceCountry === "Brasil"
                          ? "Informe o CEP para preencher automaticamente rua, bairro, cidade e estado."
                          : "O endereço é usado nos registros de conformidade da sua organização. Você pode completá-lo depois."}
                      </p>
                    </>
                  )}
                  {step === 3 && (
                    <>
                      <Field label="Nome de usuário">
                        <div className="relative">
                          <UserRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="text"
                            value={adminUsername}
                            onChange={(e) => setAdminUsername(e.target.value)}
                            required
                            placeholder="Como devemos te chamar"
                            className={INPUT_WITH_ICON}
                          />
                        </div>
                      </Field>
                      <Field label="E-mail">
                        <div className="relative">
                          <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type="email"
                            value={adminEmail}
                            onChange={(e) => setAdminEmail(e.target.value)}
                            required
                            autoComplete="username"
                            placeholder="voce@empresa.com"
                            className={INPUT_WITH_ICON}
                          />
                        </div>
                      </Field>
                      <Field label="Senha">
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                          <input
                            type={showSignupPassword ? "text" : "password"}
                            value={adminPassword}
                            onChange={(e) => setAdminPassword(e.target.value)}
                            minLength={8}
                            required
                            autoComplete="new-password"
                            placeholder="Mínimo 8 caracteres"
                            className={INPUT_WITH_ICON + " pr-10"}
                          />
                          <button
                            type="button"
                            onClick={() => setShowSignupPassword(!showSignupPassword)}
                            tabIndex={-1}
                            aria-label={showSignupPassword ? "Ocultar senha" : "Mostrar senha"}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                          >
                            {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </Field>
                      {adminPassword && (
                        <div className="space-y-1.5">
                          <div className="flex gap-1.5">
                            {[1, 2, 3, 4].map((seg) => (
                              <div
                                key={seg}
                                className="h-1 flex-1 rounded-full transition-all duration-300"
                                style={{
                                  backgroundColor:
                                    seg <= strength ? STRENGTH_META[strength].color : "rgba(255,255,255,0.08)",
                                }}
                              />
                            ))}
                          </div>
                          <p
                            className="text-[11px] font-medium transition-colors duration-300"
                            style={{ color: STRENGTH_META[strength].color }}
                          >
                            Senha {STRENGTH_META[strength].label?.toLowerCase()}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </div>
                {signupError && (
                  <div key={signupError} className="iabill-shake mt-3">
                    <Alert type="error" message={signupError} />
                  </div>
                )}
                <div className="flex gap-2 pt-4">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={goBack}
                      className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-white px-3 py-2.5 rounded-lg hover:bg-white/5 transition-all"
                    >
                      <ArrowLeft className="w-4 h-4" /> Voltar
                    </button>
                  )}
                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={goNext}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-[#D92B21] hover:bg-[#B4201A] active:scale-[0.985] text-white text-sm font-semibold rounded-lg py-2.5 transition-all duration-200 "
                    >
                      Continuar <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={signupLoading}
                      className="flex-1 flex items-center justify-center gap-2 bg-[#D92B21] hover:bg-[#B4201A] active:scale-[0.985] disabled:opacity-60 disabled:pointer-events-none text-white text-sm font-semibold rounded-lg py-2.5 transition-all duration-200 "
                    >
                      {signupLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Criando...
                        </>
                      ) : (
                        "Criar conta"
                      )}
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