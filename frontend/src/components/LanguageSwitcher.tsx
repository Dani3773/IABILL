import { useTranslation } from 'react-i18next'
import { LANGUAGES, selectLanguage } from '../i18n'

interface LanguageSwitcherProps {
  className?: string
  languages?: { code: string; name: string }[]
  label?: string
  value?: string
}

export function LanguageSwitcher({ className, languages = LANGUAGES, label, value }: LanguageSwitcherProps) {
  const { t, i18n } = useTranslation()

  return (
    <select
      className={className}
      aria-label={label ?? t('nav.language')}
      value={value ?? i18n.resolvedLanguage ?? i18n.language}
      onChange={(event) => selectLanguage(event.target.value)}
    >
      {languages.map((language) => (
        <option key={language.code} value={language.code}>
          {language.name}
        </option>
      ))}
    </select>
  )
}
