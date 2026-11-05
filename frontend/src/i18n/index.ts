import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ptBR from './locales/pt-BR.json'

// Português do Brasil, mais os 24 idiomas oficiais da União Europeia.
export const LANGUAGES = [
  { code: 'pt-BR', name: 'Português (Brasil)' },
  { code: 'en', name: 'English' },
  { code: 'bg', name: 'Български' },
  { code: 'cs', name: 'Čeština' },
  { code: 'da', name: 'Dansk' },
  { code: 'de', name: 'Deutsch' },
  { code: 'el', name: 'Ελληνικά' },
  { code: 'es', name: 'Español' },
  { code: 'et', name: 'Eesti' },
  { code: 'fi', name: 'Suomi' },
  { code: 'fr', name: 'Français' },
  { code: 'ga', name: 'Gaeilge' },
  { code: 'hr', name: 'Hrvatski' },
  { code: 'hu', name: 'Magyar' },
  { code: 'it', name: 'Italiano' },
  { code: 'lt', name: 'Lietuvių' },
  { code: 'lv', name: 'Latviešu' },
  { code: 'mt', name: 'Malti' },
  { code: 'nl', name: 'Nederlands' },
  { code: 'pl', name: 'Polski' },
  { code: 'pt-PT', name: 'Português (Portugal)' },
  { code: 'ro', name: 'Română' },
  { code: 'sk', name: 'Slovenčina' },
  { code: 'sl', name: 'Slovenščina' },
  { code: 'sv', name: 'Svenska' },
]

const STORAGE_KEY = 'iabill-language'
const FALLBACK = 'pt-BR'

const loaders = import.meta.glob('./locales/*.json')

function readSavedLanguage(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

function saveLanguage(code: string) {
  try {
    localStorage.setItem(STORAGE_KEY, code)
  } catch {
    // Sem armazenamento disponível, o idioma vale só nesta visita.
  }
}

function detectLanguage(): string {
  const requested = new URLSearchParams(window.location.search).get('lang')
  if (requested && LANGUAGES.some((language) => language.code === requested)) return requested

  const saved = readSavedLanguage()
  if (saved && LANGUAGES.some((language) => language.code === saved)) return saved

  for (const browserLanguage of navigator.languages ?? []) {
    const exact = LANGUAGES.find((language) => language.code.toLowerCase() === browserLanguage.toLowerCase())
    if (exact) return exact.code
    const base = browserLanguage.split('-')[0].toLowerCase()
    if (base === 'pt') return FALLBACK
    const partial = LANGUAGES.find((language) => language.code === base)
    if (partial) return partial.code
  }
  return FALLBACK
}

export async function changeLanguage(code: string, persist = true) {
  if (!i18n.hasResourceBundle(code, 'translation')) {
    const loader = loaders[`./locales/${code}.json`]
    if (!loader) return
    const module = (await loader()) as { default: Record<string, unknown> }
    i18n.addResourceBundle(code, 'translation', module.default)
  }
  await i18n.changeLanguage(code)
  document.documentElement.lang = code
  if (persist) saveLanguage(code)
}

i18n.use(initReactI18next).init({
  resources: { 'pt-BR': { translation: ptBR } },
  lng: FALLBACK,
  fallbackLng: FALLBACK,
  interpolation: { escapeValue: false },
})

const detected = detectLanguage()
if (detected !== FALLBACK) void changeLanguage(detected, false)

export default i18n
