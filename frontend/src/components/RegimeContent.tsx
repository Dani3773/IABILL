import type { ReactNode } from 'react'
import { useLegalRegime } from '../hooks/useLegalRegime'
import { tr } from '../i18n/tr'

// Texto que muda com a lei da unidade. Numa unidade sujeita às duas leis,
// mostra as duas versões, cada uma com o nome da lei na frente.
export function RegimeText({ lgpd, rgpd }: { lgpd: ReactNode; rgpd: ReactNode }) {
  const { mode } = useLegalRegime()
  if (mode === 'LGPD') return <>{lgpd}</>
  if (mode === 'RGPD') return <>{rgpd}</>
  return (
    <>
      <span className="block">
        <span className="font-medium">{tr('LGPD')}:</span> {lgpd}
      </span>
      <span className="block mt-2">
        <span className="font-medium">{tr('RGPD')}:</span> {rgpd}
      </span>
    </>
  )
}

// Lista que muda com a lei da unidade (princípios, bases legais...). Numa
// unidade sujeita às duas leis, mostra a lista de cada uma com um título.
export function RegimeSections<T>({
  lgpd,
  rgpd,
  render,
}: {
  lgpd: T[]
  rgpd: T[]
  render: (items: T[]) => ReactNode
}) {
  const { mode } = useLegalRegime()
  if (mode === 'LGPD') return <>{render(lgpd)}</>
  if (mode === 'RGPD') return <>{render(rgpd)}</>
  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-sm font-semibold text-[#15803D] uppercase tracking-wide mb-3">{tr('LGPD (Brasil)')}</h2>
        {render(lgpd)}
      </section>
      <section>
        <h2 className="text-sm font-semibold text-[#1E3A8A] uppercase tracking-wide mb-3">{tr('RGPD (União Europeia)')}</h2>
        {render(rgpd)}
      </section>
    </div>
  )
}
