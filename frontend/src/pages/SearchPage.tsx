import { useState, type FormEvent } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Search, FileSearch } from 'lucide-react'
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
      <h1 className="text-xl font-serif text-[#1B2233] mb-1">Busca Semântica</h1>
      <p className="text-sm text-[#1B2233]/55 mb-6">
        Busque por significado nos documentos deste workspace, não só por palavra-chave.
      </p>

      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ex: por quanto tempo os dados ficam guardados?"
          className="flex-1 rounded-lg bg-white text-[#1B2233] px-4 py-2.5 border border-[#1B2233]/10 focus:outline-none focus:ring-2 focus:ring-[#14B8A6]/30 focus:border-[#14B8A6] placeholder:text-[#1B2233]/40"
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          className="bg-[#14B8A6] hover:bg-[#10a595] disabled:opacity-50 text-[#0A0D16] font-semibold rounded-lg px-4 py-2.5 transition-colors flex items-center gap-2"
        >
          <Search className="w-4 h-4" />
          Buscar
        </button>
      </form>

      {isLoading && <LoadingSpinner label="Buscando..." />}
      {error && <Alert type="error" message={error} />}

      {!isLoading && hasSearched && results.length === 0 && (
        <div className="bg-white rounded-xl border border-[#1B2233]/10 p-10 text-center">
          <FileSearch className="w-8 h-8 text-[#1B2233]/25 mx-auto mb-3" />
          <p className="text-[#1B2233]/55 text-sm">Nenhum resultado encontrado para essa busca.</p>
        </div>
      )}

      {!isLoading && results.length > 0 && (
        <div className="space-y-3">
          {results.map((result, i) => (
            <Link
              key={`${result.documentId}-${result.chunkIndex}-${i}`}
              to={`/documents/${result.documentId}`}
              className="block bg-white rounded-xl p-4 border border-[#1B2233]/10 hover:border-[#14B8A6]/50 hover:shadow-md transition-all"
            >
              <p className="text-sm font-medium text-[#0d7a6d] mb-1">{result.documentTitle}</p>
              <p className="text-sm text-[#1B2233]/70 line-clamp-3">{result.content}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}