// Tradução das telas do sistema. O texto em português do Brasil é a própria
// chave: em pt-BR nada é procurado, e um texto sem tradução aparece em português
// em vez de quebrar a tela. Os dicionários ficam em locales/app/.
//
// O dicionário é carregado antes do app (ver main.tsx) e trocar de idioma
// recarrega a página. Por isso tr() funciona também em constantes de módulo.

export const SYSTEM_LANGUAGES = [
  { code: 'pt-BR', name: 'Português (Brasil)' },
  { code: 'pt-PT', name: 'Português (Portugal)' },
  { code: 'en', name: 'English' },
]

const SOURCE_LANGUAGE = 'pt-BR'
const FALLBACK_LANGUAGE = 'en'

const dictionaries = import.meta.glob('./locales/app/*.json')

let dictionary: Record<string, string> = {}
let systemLanguage = SOURCE_LANGUAGE

// Quem veio de um idioma que só existe na landing usa o sistema em inglês.
export function resolveSystemLanguage(code: string): string {
  return SYSTEM_LANGUAGES.some((language) => language.code === code) ? code : FALLBACK_LANGUAGE
}

export async function loadSystemLanguage(code: string) {
  systemLanguage = resolveSystemLanguage(code)
  if (systemLanguage === SOURCE_LANGUAGE) return
  const loader = dictionaries[`./locales/app/${systemLanguage}.json`]
  if (!loader) return
  const module = (await loader()) as { default: Record<string, string> }
  dictionary = module.default
}

export function getSystemLanguage() {
  return systemLanguage
}

export function tr(text: string, values?: Record<string, string | number | null | undefined>): string {
  const translated = dictionary[text] ?? text
  if (!values) return translated
  return translated.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    name in values ? String(values[name] ?? '') : match,
  )
}

// Plural: a frase inteira nas duas formas, com {{n}} para a contagem.
export function trn(count: number, one: string, many: string): string {
  return tr(count === 1 ? one : many, { n: count })
}
