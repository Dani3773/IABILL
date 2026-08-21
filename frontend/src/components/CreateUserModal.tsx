import { useState, type FormEvent } from "react";
import { UserPlus, X, AlertTriangle } from "lucide-react";
import { createUser } from "../api/userService";
import { useAuth } from "../contexts/AuthContext";
import type { User, UserRole } from "../types/user";
import { getErrorMessage } from "../api/errorUtils";

interface Props {
  onClose: () => void;
  onCreated: (user: User) => void;
}

const DPO_CONFLICT_KEYWORDS = [
  "ti",
  "tecnologia",
  "marketing",
  "rh",
  "recursos humanos",
  "financeiro",
  "finanças",
];

function hasDpoConflict(jobTitle: string): boolean {
  const normalized = jobTitle.toLowerCase();
  return DPO_CONFLICT_KEYWORDS.some((keyword) => normalized.includes(keyword));
}

export function CreateUserModal({ onClose, onCreated }: Props) {
  const { tenantId } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<UserRole>("USER");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [jobTitle, setJobTitle] = useState("");
  const [committeeRole, setCommitteeRole] = useState("");
  const [dpoSubstitute, setDpoSubstitute] = useState(false);

  const showDpoConflictWarning =
    role === "DPO" && jobTitle.trim().length > 0 && hasDpoConflict(jobTitle);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!tenantId) return;
    setError(null);
    setIsLoading(true);
    try {
      const user = await createUser({
        tenantId,
        username,
        email,
        role,
        jobTitle: jobTitle || undefined,
        committeeRole: committeeRole || undefined,
        dpoSubstitute: role === "DPO" ? dpoSubstitute : undefined,
      });
      onCreated(user);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err, "Não foi possível criar o usuário."));
    } finally {
      setIsLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg bg-[#F5F2EA] text-[#1B2233] text-sm px-3 py-2 border border-[#1B2233]/10 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6] placeholder:text-[#1B2233]/40";
  const labelClass = "block text-xs font-medium text-[#1B2233]/60 mb-1.5";

  return (
    <div className="fixed inset-0 bg-[#1B2233]/40 backdrop-blur-sm flex items-center justify-center px-4 z-50 py-8 overflow-y-auto">
      <div className="w-full max-w-md bg-white rounded-xl p-6 shadow-2xl border border-[#1B2233]/10 my-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#14B8A6]/10 flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-[#14B8A6]" />
            </div>
            <h2 className="text-lg font-serif text-[#1B2233]">Novo Usuário</h2>
          </div>
          <button onClick={onClose} className="text-[#1B2233]/40 hover:text-[#1B2233] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={labelClass}>Nome de usuário</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Papel</label>
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)} className={inputClass}>
              <option value="USER">Usuário</option>
              <option value="DPO">Encarregado de Dados (DPO)</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>
              Cargo na empresa <span className="text-[#1B2233]/40">(opcional)</span>
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Ex: Analista de RH"
              className={inputClass}
            />
          </div>

          {showDpoConflictWarning && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-amber-800 font-medium mb-1">Possível conflito de interesse</p>
                <p className="text-xs text-amber-700/90 leading-relaxed">
                  Segundo a ANPD, o Encarregado (DPO) não deveria acumular cargos de chefia/gerência em áreas
                  como TI, Marketing, RH ou Financeiro, responsáveis pela decisão sobre como os dados são
                  tratados, isso pode comprometer a independência exigida do papel. Considere indicar outra
                  pessoa, ou avaliar um DPO terceirizado.
                </p>
              </div>
            </div>
          )}
          {role === "DPO" && (
            <label className="flex items-center gap-2 text-sm text-[#1B2233]/70 cursor-pointer">
              <input
                type="checkbox"
                checked={dpoSubstitute}
                onChange={(e) => setDpoSubstitute(e.target.checked)}
                className="rounded border-[#1B2233]/20 text-[#14B8A6] focus:ring-[#14B8A6]/30"
              />
              É substituto do Encarregado (DPO), não o titular principal
            </label>
          )}
          <div>
            <label className={labelClass}>
              Cargo no comitê de LGPD <span className="text-[#1B2233]/40">(opcional)</span>
            </label>
            <input
              type="text"
              value={committeeRole}
              onChange={(e) => setCommitteeRole(e.target.value)}
              placeholder="Ex: Membro titular"
              className={inputClass}
            />
          </div>

          <p className="text-xs text-[#1B2233]/45">
            O usuário receberá um e-mail de convite para definir sua própria senha e ativar o acesso.
          </p>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-[#14B8A6] hover:bg-[#10a595] disabled:opacity-50 text-[#0A0D16] text-sm font-semibold rounded-lg py-2.5 transition-colors"
            >
              {isLoading ? "Enviando convite..." : "Convidar"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-[#1B2233]/5 hover:bg-[#1B2233]/10 text-[#1B2233] text-sm font-medium rounded-lg py-2.5 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}