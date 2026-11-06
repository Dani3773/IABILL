import { useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, Circle, Minus } from "lucide-react";
import { confirmAdequacyItem, revokeAdequacyItem } from "../api/adequacyService";
import { getErrorMessage } from "../api/errorUtils";
import { Alert } from "../components/Alert";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { useAuth } from "../contexts/AuthContext";
import { useAdequacyPath } from "../hooks/useAdequacyPath";
import type { PathCheck, PathStage } from "../utils/adequacyPath";

import { getSystemLanguage, tr } from '../i18n/tr'
function StageMarker({ stage, active }: { stage: PathStage; active: boolean }) {
  if (stage.status === "done") {
    return (
      <span className="w-7 h-7 rounded-full bg-emerald-700 text-white flex items-center justify-center shrink-0">
        <Check className="w-4 h-4" />
      </span>
    );
  }
  return (
    <span
      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-[13px] font-semibold ${
        active
          ? "bg-[#D92B21] text-white"
          : stage.status === "progress"
            ? "border-2 border-[#D92B21] text-[#B4201A]"
            : "border border-[#0A0A0A]/25 text-[#0A0A0A]/60"
      }`}
    >
      {stage.number}
    </span>
  );
}

function CheckRow({
  check,
  canConfirm,
  busy,
  onConfirm,
  onRevoke,
}: {
  check: PathCheck;
  canConfirm: boolean;
  busy: boolean;
  onConfirm: () => void;
  onRevoke: () => void;
}) {
  const isManual = Boolean(check.manualItem);
  const pending = check.state === "pending";

  return (
    <li className="flex items-start gap-3 py-4 border-b border-[#0A0A0A]/8 last:border-0">
      {check.state === "done" ? (
        <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
      ) : check.state === "na" ? (
        <Minus className="w-5 h-5 text-[#0A0A0A]/35 shrink-0 mt-0.5" />
      ) : (
        <Circle className="w-5 h-5 text-[#0A0A0A]/35 shrink-0 mt-0.5" />
      )}
      <div className="min-w-0 flex-1">
        <p className={`text-[15px] font-medium ${check.state === "na" ? "text-[#0A0A0A]/55" : "text-[#0A0A0A]"}`}>
          {check.label}
          {check.state === "na" && <span className="font-normal">{' '}{tr('· não se aplica')}</span>}
        </p>
        <p className="text-sm text-[#0A0A0A]/65 mt-0.5">{check.hint}</p>
        {check.confirmation && (
          <p className="text-[13px] text-[#0A0A0A]/60 mt-1">{tr('Registrado por')}{' '}{check.confirmation.confirmedByName}{' '}{tr('em')}{" "}
            {new Date(check.confirmation.confirmedAt).toLocaleDateString(getSystemLanguage())}
            {isManual && canConfirm && (
              <>
                {" · "}
                <button
                  type="button"
                  onClick={onRevoke}
                  disabled={busy}
                  className="text-[#B4201A] hover:underline disabled:opacity-50"
                >{tr('Desfazer')}</button>
              </>
            )}
          </p>
        )}
        {isManual && pending && !canConfirm && (
          <p className="text-[13px] text-[#0A0A0A]/60 mt-1">{tr('Um administrador ou o Encarregado confirma este item.')}</p>
        )}
        {pending && (
          <div className="flex flex-wrap items-center gap-2 mt-2.5">
            {isManual && canConfirm && (
              <button
                type="button"
                onClick={onConfirm}
                disabled={busy}
                className="bg-[#D92B21] hover:bg-[#B4201A] disabled:opacity-50 text-white text-sm font-semibold rounded-lg px-3.5 py-2 transition-colors"
              >
                {check.manualLabel}
              </button>
            )}
            {check.to && (
              <Link
                to={check.to}
                className={
                  isManual
                    ? "text-sm font-medium text-[#0A0A0A] rounded-lg px-3.5 py-2 border border-[#0A0A0A]/20 hover:border-[#0A0A0A]/45 transition-colors"
                    : "inline-flex items-center gap-1.5 bg-[#D92B21] hover:bg-[#B4201A] text-white text-sm font-semibold rounded-lg px-3.5 py-2 transition-colors"
                }
              >
                {check.actionLabel}
                {!isManual && <ArrowRight className="w-4 h-4" />}
              </Link>
            )}
          </div>
        )}
      </div>
      {!pending && check.to && (
        <Link to={check.to} className="text-[13px] text-[#B4201A] hover:underline shrink-0 mt-0.5">
          {check.actionLabel}
        </Link>
      )}
    </li>
  );
}

export function AdequacyPathPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { role } = useAuth();
  const { path, regimes, isLoading, failed, reload } = useAdequacyPath(workspaceId);
  const [searchParams, setSearchParams] = useSearchParams();
  const [busyItem, setBusyItem] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const detailRef = useRef<HTMLElement>(null);

  const canConfirm = role === "ADMIN" || role === "DPO" || role === "SUPER_ADMIN";
  const requested = searchParams.get("etapa");
  const stage =
    path.stages.find((s) => s.id === requested) ?? path.nextStage ?? path.stages[path.stages.length - 1];

  useEffect(() => {
    if (requested && window.matchMedia("(max-width: 1023px)").matches) {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [requested]);

  if (isLoading) return <LoadingSpinner label={tr('Montando o caminho...')} />;

  function openStage(id: string) {
    setSearchParams({ etapa: id }, { replace: true });
  }

  async function toggleManual(check: PathCheck, confirm: boolean) {
    if (!workspaceId || !check.manualItem) return;
    setBusyItem(check.id);
    setError(null);
    try {
      if (confirm) await confirmAdequacyItem(workspaceId, check.manualItem);
      else await revokeAdequacyItem(workspaceId, check.manualItem);
      await reload();
    } catch (err) {
      setError(getErrorMessage(err, tr('Não foi possível salvar este item.')));
    } finally {
      setBusyItem(null);
    }
  }

  const previous = path.stages[stage.number - 2];
  const next = path.stages[stage.number];

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-xl text-[#0A0A0A]">{tr('Caminho de Adequação')}</h1>
        <p className="text-sm text-[#0A0A0A]/60 mt-0.5">{tr('Siga as etapas em ordem. Aplicável a esta unidade:')}{' '}{regimes.join(" e ")}.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-[#0A0A0A]/10 px-5 py-4 mb-5">
        <div className="flex items-baseline justify-between gap-3 mb-2">
          <p className="text-sm font-medium text-[#0A0A0A]">
            {path.nextStage
              ? tr('Próxima etapa: {{a}}. {{b}}', { a: path.nextStage.number, b: path.nextStage.title })
              : tr('Todas as etapas concluídas')}
          </p>
          <p className="text-sm text-[#0A0A0A]/65 shrink-0">
            {path.doneCount}{' '}{tr('de')}{' '}{path.totalCount}{' '}{tr('itens')}
          </p>
        </div>
        <div
          role="progressbar"
          aria-valuenow={path.percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={tr('Progresso do Caminho de Adequação')}
          className="h-2 rounded-full bg-[#0A0A0A]/8 overflow-hidden"
        >
          <div className="h-full bg-[#D92B21] rounded-full transition-all" style={{ width: `${path.percent}%` }} />
        </div>
      </div>

      {!path.nextStage && (
        <div className="mb-5 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-4 text-sm text-emerald-900">{tr('Você cumpriu todas as etapas e tem as evidências registradas no sistema. Mantenha a etapa de Manutenção em dia. Isso não substitui orientação jurídica.')}</div>
      )}

      {failed && (
        <div className="mb-5">
          <Alert type="error" message={tr('Parte das informações não pôde ser carregada, então alguns itens podem aparecer como pendentes. Atualize a página.')} />
        </div>
      )}
      {error && (
        <div className="mb-5">
          <Alert type="error" message={error} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-5 items-start">
        <nav aria-label={tr('Etapas do caminho')} className="bg-white rounded-xl border border-[#0A0A0A]/10 p-2">
          <ol>
            {path.stages.map((item) => {
              const active = item.id === stage.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => openStage(item.id)}
                    aria-current={active ? "step" : undefined}
                    className={`flex items-center gap-3 w-full text-left rounded-lg px-3 py-2.5 transition-colors ${
                      active ? "bg-[#D92B21]/8" : "hover:bg-[#0A0A0A]/4"
                    }`}
                  >
                    <StageMarker stage={item} active={active} />
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-[#0A0A0A]">{item.title}</span>
                      <span className="block text-[13px] text-[#0A0A0A]/60 truncate">{item.summary}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <section ref={detailRef} className="bg-white rounded-xl border border-[#0A0A0A]/10 px-5 py-5 scroll-mt-4">
          <p className="text-[13px] text-[#0A0A0A]/60">{tr('Etapa')}{' '}{stage.number}{' '}{tr('de')}{' '}{path.stages.length}
          </p>
          <h2 className="text-lg text-[#0A0A0A] mt-0.5">{stage.title}</h2>
          <p className="text-[15px] text-[#0A0A0A]/75 mt-2 leading-relaxed">{stage.why}</p>

          <h3 className="text-sm font-medium text-[#0A0A0A] mt-5 mb-2">{tr('O que a lei pede')}</h3>
          <ul className="space-y-1.5">
            {stage.citations.map((citation) => (
              <li key={`${citation.regime}-${citation.reference}`} className="flex items-baseline gap-2 text-sm">
                <span className="text-[11px] font-semibold tracking-wide text-[#B4201A] bg-[#D92B21]/8 rounded px-1.5 py-0.5 shrink-0">
                  {citation.regime}
                </span>
                <span className="text-[#0A0A0A]/75">
                  <span className="font-medium text-[#0A0A0A]">{citation.reference}</span> · {citation.about}
                </span>
              </li>
            ))}
          </ul>
          {stage.guide && (
            <Link
              to={stage.guide.to}
              className="inline-flex items-center gap-1.5 text-[13px] text-[#B4201A] hover:underline mt-3"
            >
              <BookOpen className="w-3.5 h-3.5" />{tr('Entender melhor:')}{' '}{stage.guide.label}
            </Link>
          )}

          <h3 className="text-sm font-medium text-[#0A0A0A] mt-5 mb-1">{tr('O que fazer')}</h3>
          <ul>
            {stage.checks.map((check) => (
              <CheckRow
                key={check.id}
                check={check}
                canConfirm={canConfirm}
                busy={busyItem === check.id}
                onConfirm={() => toggleManual(check, true)}
                onRevoke={() => toggleManual(check, false)}
              />
            ))}
          </ul>

          <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-[#0A0A0A]/8">
            {previous ? (
              <button
                type="button"
                onClick={() => openStage(previous.id)}
                className="flex items-center gap-1.5 text-sm text-[#0A0A0A]/70 hover:text-[#0A0A0A]"
              >
                <ArrowLeft className="w-4 h-4" /> {previous.title}
              </button>
            ) : (
              <span />
            )}
            {next && (
              <button
                type="button"
                onClick={() => openStage(next.id)}
                className="flex items-center gap-1.5 text-sm font-medium text-[#0A0A0A] hover:text-[#B4201A]"
              >
                {next.title} <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </section>
      </div>

      <p className="text-[13px] text-[#0A0A0A]/55 mt-5">{tr('O caminho organiza o que a lei pede e registra o que foi feito. Ele não é um parecer jurídico nem garante conformidade. Consulte um profissional para decisões específicas.')}</p>
    </div>
  );
}
