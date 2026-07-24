import { useState, type FormEvent } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { semanticSearch } from '../api/searchService'
import { LoadingSpinner } from '../components/LoadingSpinner'
import { Alert } from '../components/Alert'
import { getErrorMessage } from '../api/errorUtils'
import type { SemanticSearchResult } from '../types/search'

export function SearchPage() {
  const { workspaceId } = useParams<{ workspaceId: string }>()

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SemanticSearchResult[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!workspaceId || !query.trim()) return

    setIsLoading(true)
    setError(null)
    try {
      const found = await semanticSearch(workspaceId, query)
      setResults(found)
      setHasSearched(true)
    } catch (err) {
      setError(getErrorMessage(err, 'Não foi possível realizar a busca.'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-xl font-semibold text-white mb-1">Busca Semântica</h2>
      <p className="text-sm text-slate-400 mb-6">
        Busque por significado nos documentos deste workspace, não só por palavra-chave.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ex: por quanto tempo os dados ficam guardados?"
          className="flex-1 rounded-lg bg-slate-800 text-white px-4 py-2.5 border border-slate-700 focus:outline-none focus:border-cyan-500"
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg px-4 py-2.5 transition-colors flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          Buscar
        </button>
      </form>

      {isLoading && <LoadingSpinner label="Buscando..." />}
      {error && <Alert type="error" message={error} />}

      {!isLoading && hasSearched && results.length === 0 && (
        <p className="text-slate-400 text-sm">Nenhum resultado encontrado para essa busca.</p>
      )}

      {!isLoading && results.length > 0 && (
        <div className="space-y-3">
          {results.map((result, i) => (
            <Link
              key={`${result.documentId}-${result.chunkIndex}-${i}`}
              to={`/documents/${result.documentId}`}
              className="block bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-cyan-500 transition-colors"
            >
              <p className="text-sm font-medium text-cyan-400 mb-1">{result.documentTitle}</p>
              <p className="text-sm text-slate-300 line-clamp-3">{result.content}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}