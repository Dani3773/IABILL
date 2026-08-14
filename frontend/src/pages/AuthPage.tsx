import {
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
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

type SignupStep = 1 | 2 | 3;
type LegalRegime = "LGPD" | "RGPD";
type StepDirection = "fwd" | "back";

const STEPS: { label: string; icon: typeof Building2 }[] = [
  { label: "Empresa", icon: Building2 },
  { label: "Endereço", icon: MapPin },
  { label: "Conta", icon: UserRound },
];

const NOISE_TEXTURE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E\")";

const INPUT_CLASS =
  "w-full rounded-lg bg-white/[0.05] text-white text-sm px-3 py-2.5 border border-white/10 transition-all duration-200 placeholder:text-slate-600 " +
  "hover:border-white/20 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/35 focus:border-[#14B8A6]/70 focus:bg-white/[0.07] " +
  "[&:-webkit-autofill]:[-webkit-text-fill-color:#fff] [&:-webkit-autofill]:[transition:background-color_9999s]";
const INPUT_WITH_ICON = INPUT_CLASS + " pl-9";

function Wordmark({ size = "text-2xl" }: { size?: string }) {
  return (
    <div className="select-none">
      <span className={`font-serif ${size} text-white tracking-tight`}>
        IA<span className="text-[#14B8A6]">Bill</span>
      </span>
      <p className="font-mono text-[9px] text-slate-500 uppercase tracking-[0.25em] mt-0.5">
        Plataforma de conformidade
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
      <circle cx="100" cy="100" r="94" fill="none" stroke="#B8862B" strokeWidth="1.5" opacity="0.5" />
      <circle cx="100" cy="100" r="78" fill="none" stroke="#B8862B" strokeWidth="2" />
      <text fill="#B8862B" fontSize="10.5" letterSpacing="3" fontFamily="ui-monospace, monospace">
        <textPath href="#seal-circle-auth" startOffset="0%">CONTA CRIADA · IABILL · BEM-VINDO ·</textPath>
      </text>
      <g transform="translate(100,100)">
        <circle r="46" fill="none" stroke="#B8862B" strokeWidth="1.5" />
        <path
          d="M -18,2 L -6,16 L 20,-14"
          fill="none"
          stroke="#B8862B"
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
  { label: "Boa", color: "#14B8A6" },
  { label: "Forte", color: "#B8862B" },
];

export function AuthPage({ initialMode = "login" }: { initialMode?: "login" | "signup" }) {
  const navigate = useNavigate();
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
  const [workspaceName, setWorkspaceName] = useState("");
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

  function handleCapsLock(e: KeyboardEvent<HTMLInputElement>) {
    setCapsLockOn(e.getModifierState?.("CapsLock") ?? false);
  }

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
      setTimeout(() => {
        setAuth(response);
        navigate("/dashboard");
      }, 1600);
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
    <div className="relative min-h-screen bg-[#161310] flex items-center justify-center px-4 py-8 overflow-hidden">
      <style>{`
        @keyframes iabill-glow-pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
        .iabill-glow-pulse { animation: iabill-glow-pulse 8s ease-in-out infinite; }
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
        .iabill-sheen { position: relative; overflow: hidden; }
        .iabill-sheen::after {
          content: '';
          position: absolute;
          top: 0; left: -80%;
          width: 45%; height: 100%;
          background: linear-gradient(105deg, transparent, rgba(255,255,255,0.35), transparent);
          transform: skewX(-18deg);
          transition: left 0.55s ease;
          pointer-events: none;
        }
        .iabill-sheen:hover::after { left: 130%; }
        .iabill-card-edge {
          background:
            linear-gradient(rgba(255,255,255,0.045), rgba(255,255,255,0.045)) padding-box,
            linear-gradient(135deg, rgba(20,184,166,0.35), rgba(255,255,255,0.08) 30%, rgba(255,255,255,0.06) 65%, rgba(184,134,43,0.35)) border-box;
          border: 1px solid transparent;
        }
        @media (prefers-reduced-motion: reduce) {
          .iabill-seal-pop, .iabill-step-fwd, .iabill-step-back,
          .iabill-glow-pulse, .iabill-card-enter, .iabill-shake { animation: none; }
          .iabill-sheen::after { display: none; }
        }
      `}</style>

      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 90% 80% at 50% 45%, black, transparent)",
          WebkitMaskImage: "radial-gradient(ellipse 90% 80% at 50% 45%, black, transparent)",
        }}
      />
      <div className="absolute inset-0 opacity-[0.035] pointer-events-none" style={{ backgroundImage: NOISE_TEXTURE }} />
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none iabill-glow-pulse"
        style={{
          background: "radial-gradient(ellipse 700px 500px at 50% 50%, rgba(184,134,43,0.10), transparent 70%)",
        }}
      />

      <div className="iabill-card-enter iabill-card-edge relative w-full max-w-4xl grid md:grid-cols-[1fr_1.15fr] rounded-2xl overflow-hidden backdrop-blur-xl shadow-[0_24px_80px_-16px_rgba(0,0,0,0.7)]">
        <div className="absolute top-0 inset-x-8 h-px bg-linear-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

        <div className="hidden md:flex flex-col justify-between p-8 border-r border-white/10 bg-white/1.5">
          {isSignUpMode ? (
            <>
              <div>
                <p className="font-mono text-[10px] tracking-[0.2em] text-[#14B8A6] uppercase mb-6">
                  Pré-visualização · Cadastro
                </p>
                <div className="space-y-4">
                  <div>
                    <div className="h-2 w-2/3 bg-white/10 rounded-full mb-2" />
                    <h2 className="font-serif text-xl text-white leading-snug min-h-10 transition-all">
                      {workspaceName || <span className="text-slate-600">Sua empresa aparece aqui</span>}
                    </h2>
                    {workspaceDocumentId && (
                      <p className="font-mono text-xs text-slate-400 mt-1">{formatCnpj(workspaceDocumentId)}</p>
                    )}
                  </div>
                  {legalRegimes.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {legalRegimes.map((r) => (
                        <span
                          key={r}
                          className="text-[10px] font-mono tracking-wide uppercase bg-[#14B8A6]/15 text-[#14B8A6] border border-[#14B8A6]/20 rounded px-2 py-1"
                        >
                          {r}
                        </span>
                      ))}
                    </div>
                  )}
                  {(addressParts || workspaceNeighborhood || cityState || workspaceCountry) && (
                    <div className="pt-3 border-t border-white/10">
                      <p className="text-[10px] font-mono uppercase tracking-[0.15em] text-slate-500 mb-1">Endereço</p>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {addressParts && <>{addressParts}<br /></>}
                        {workspaceNeighborhood && <>{workspaceNeighborhood}<br /></>}
                        {cityState && <>{cityState}<br /></>}
                        {workspaceCountry}
                      </p>
                    </div>
                  )}
                  {workspacePhone && <p className="text-xs text-slate-400 font-mono">{workspacePhone}</p>}
                </div>
              </div>
              <div className="flex items-center justify-center pt-6 min-h-34">
                {justCreated ? (
                  <div className="iabill-seal-pop drop-shadow-[0_0_24px_rgba(184,134,43,0.35)]">
                    <ApprovalSeal size={112} />
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#B8862B]/60 animate-pulse" />
                    <p className="text-[10px] font-mono text-slate-600 uppercase tracking-[0.2em]">
                      Aguardando confirmação
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] text-[#14B8A6] uppercase mb-2">
                Bem-vindo de volta
              </p>
              <h2 className="font-serif text-xl text-white leading-snug mb-6">
                Sua conformidade, sempre auditável.
              </h2>

              <div className="grid grid-cols-3 gap-2 mb-6 pb-6 border-b border-white/10">
                <div>
                  <p className="font-mono text-lg text-white">1.000</p>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wide leading-tight mt-0.5">
                    Precision@1
                  </p>
                </div>
                <div>
                  <p className="font-mono text-lg text-white">1.000</p>
                  <p className="text-[9px] text-slate-500 uppercase tracking-wide leading-tight mt-0.5">
                    Recall@5
                  </p>
                </div>
                <div>
                  <p className="font-mono text-lg text-white">100%</p>
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

          {!isSignUpMode ? (
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
              <Field label="Senha">
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
              </Field>
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
              <div className="flex-1" />
              <button
                type="submit"
                disabled={loginLoading}
                className="iabill-sheen w-full flex items-center justify-center gap-2 bg-[#14B8A6] hover:bg-[#10a595] active:scale-[0.985] disabled:opacity-60 disabled:pointer-events-none text-[#0A0D16] text-sm font-semibold rounded-lg py-2.5 transition-all duration-200 shadow-[0_8px_24px_-8px_rgba(20,184,166,0.5)]"
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
              <p className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-slate-600 uppercase tracking-[0.15em] pt-1">
                <ShieldCheck className="w-3 h-3" /> Conexão criptografada
              </p>
            </form>
          ) : justCreated ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-8">
              <div className="iabill-seal-pop md:hidden drop-shadow-[0_0_24px_rgba(184,134,43,0.35)]">
                <ApprovalSeal size={120} />
              </div>
              <p className="font-serif text-lg text-white">Conta criada com sucesso</p>
              <p className="flex items-center gap-2 text-xs text-slate-400 font-mono">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#14B8A6]" /> Redirecionando para o painel...
              </p>
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
                              ? "bg-[#14B8A6] text-[#0A0D16]"
                              : isCurrent
                                ? "border-2 border-[#14B8A6] text-[#14B8A6] shadow-[0_0_12px_rgba(20,184,166,0.35)]"
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
                            className={`absolute inset-y-0 left-0 bg-[#14B8A6] transition-all duration-500 ease-out ${
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
                            className={INPUT_WITH_ICON + " font-mono"}
                          />
                          {cnpjLookupLoading && (
                            <Loader2 className="w-4 h-4 text-[#14B8A6] animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
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
                                ? " ring-2 ring-[#14B8A6]/50 border-[#14B8A6]/70 bg-[#14B8A6]/6"
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
                            className={INPUT_WITH_ICON + " font-mono"}
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
                                    ? "bg-[#14B8A6]/15 border-[#14B8A6] text-[#14B8A6] shadow-[0_0_16px_-4px_rgba(20,184,166,0.4)]"
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
                              <option key={c.code} value={c.name} className="bg-[#161310]">
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
                            className={INPUT_WITH_ICON + " font-mono"}
                          />
                          {cepLookupLoading && (
                            <Loader2 className="w-4 h-4 text-[#14B8A6] animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
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
                              <option value="" className="bg-[#161310]">Selecione</option>
                              {BRAZILIAN_STATES.map((s) => (
                                <option key={s} value={s} className="bg-[#161310]">
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
                      className="iabill-sheen flex-1 flex items-center justify-center gap-1.5 bg-[#14B8A6] hover:bg-[#10a595] active:scale-[0.985] text-[#0A0D16] text-sm font-semibold rounded-lg py-2.5 transition-all duration-200 shadow-[0_8px_24px_-8px_rgba(20,184,166,0.5)]"
                    >
                      Continuar <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={signupLoading}
                      className="iabill-sheen flex-1 flex items-center justify-center gap-2 bg-[#B8862B] hover:bg-[#A9791F] active:scale-[0.985] disabled:opacity-60 disabled:pointer-events-none text-[#0A0D16] text-sm font-semibold rounded-lg py-2.5 transition-all duration-200 shadow-[0_8px_24px_-8px_rgba(184,134,43,0.5)]"
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