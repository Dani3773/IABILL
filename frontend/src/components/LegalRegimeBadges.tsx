import { tr } from '../i18n/tr'

// Regimes legais de uma empresa ou unidade (LGPD, RGPD ou os dois).
export function LegalRegimeBadges({ regimes }: { regimes: ('LGPD' | 'RGPD')[] }) {
  if (regimes.length === 0) {
    return <span className="text-xs text-[#0A0A0A]/40">{tr('Não definido')}</span>
  }
  return (
    <span className="inline-flex gap-1.5">
      {regimes.map((regime) => (
        <span
          key={regime}
          className={`px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap ${
            regime === 'RGPD' ? 'bg-[#1E3A8A]/10 text-[#1E3A8A]' : 'bg-[#15803D]/10 text-[#15803D]'
          }`}
        >
          {tr(regime)}
        </span>
      ))}
    </span>
  )
}
