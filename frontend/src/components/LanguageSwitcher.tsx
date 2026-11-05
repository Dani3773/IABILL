import { useTranslation } from 'react-i18next'
import { LANGUAGES, changeLanguage } from '../i18n'

export function LanguageSwitcher({ className }: { className?: string }) {
  const { t, i18n } = useTranslation()

  return (
    <select
      className={className}
      aria-label={t('nav.language')}
      value={i18n.resolvedLanguage ?? i18n.language}
      onChange={(event) => void changeLanguage(event.target.value)}
    >
      {LANGUAGES.map((language) => (
        <option key={language.code} value={language.code}>
          {language.name}
        </option>
      ))}
    </select>
  )
}
