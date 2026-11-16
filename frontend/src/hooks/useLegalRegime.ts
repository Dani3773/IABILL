import { useWorkspaces } from '../contexts/WorkspaceContext'
import { tr } from '../i18n/tr'

export type RegimeMode = 'LGPD' | 'RGPD' | 'AMBOS'

// Lei da unidade atual. O regime é definido por unidade: uma filial em Portugal
// segue o RGPD mesmo que a matriz siga a LGPD. Sem regime marcado, vale a LGPD.
export function regimeModeOf(regimes: ('LGPD' | 'RGPD')[] | undefined): RegimeMode {
  const lgpd = !regimes || regimes.length === 0 || regimes.includes('LGPD')
  const rgpd = !!regimes && regimes.includes('RGPD')
  if (lgpd && rgpd) return 'AMBOS'
  return rgpd ? 'RGPD' : 'LGPD'
}

export function useLegalRegime() {
  const { currentWorkspace } = useWorkspaces()
  const mode = regimeModeOf(currentWorkspace?.legalRegimes)

  // Escolhe o texto pela lei da unidade. Sem texto próprio para as duas leis,
  // junta as duas versões (serve para referências curtas, como artigos).
  function lr(lgpd: string, rgpd: string, ambos?: string): string {
    if (mode === 'LGPD') return lgpd
    if (mode === 'RGPD') return rgpd
    return ambos ?? `${lgpd} · ${rgpd}`
  }

  return {
    mode,
    isRgpd: mode === 'RGPD',
    hasRgpd: mode !== 'LGPD',
    hasLgpd: mode !== 'RGPD',
    // Nome curto da lei, para títulos como "Guia LGPD" / "Guia RGPD".
    lawName: tr(mode === 'AMBOS' ? 'LGPD/RGPD' : mode),
    authority: lr(tr('ANPD'), tr('autoridade de controlo (CNPD em Portugal)'), tr('ANPD / autoridade de controlo')),
    lr,
  }
}
