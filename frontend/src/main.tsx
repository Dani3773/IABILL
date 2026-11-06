import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { languageReady } from './i18n'

// O app só é importado depois do dicionário, para que os textos definidos em
// constantes de módulo já saiam no idioma certo.
void languageReady.then(() => import('./App.tsx')).then(({ default: App }) => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
