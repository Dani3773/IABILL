import { tr } from '../../i18n/tr'
interface Props {
  className?: string
  showWordmark?: boolean
}

// A marca une o "I" de IABill a um visto de aprovação: nada vira oficial sem ele.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" fill="#D92B21" />
      <rect x="7" y="7" width="4" height="18" fill="#FFFFFF" />
      <path d="M14.5 16.5 19 21l8-11" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="square" />
    </svg>
  )
}

export function Logo({ className, showWordmark = true }: Props) {
  return (
    <span className={`iabill-logo ${className ?? ''}`}>
      <LogoMark className="iabill-logo__mark" />
      {showWordmark && <span className="iabill-logo__word">{tr('IABill')}</span>}
    </span>
  )
}
