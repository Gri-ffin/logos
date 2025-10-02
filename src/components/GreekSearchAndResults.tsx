import { useState, useEffect, useRef } from 'react'
import GreekDictionary from './GreekDictionary'

export default function GreekSearchAndResults() {
  const [query, setQuery] = useState('')
  const [lemma, setLemma] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const handleLookup = async (word: string) => {
    try {
      setLoading(true)
      setError(null)
      setLemma(null)

      const cleanWord = word.trim();

      setLemma(cleanWord);

    } catch (err: any) {
      setError(err.message || 'Error processing lookup.')
      setLemma(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(() => {
      if (query.trim()) handleLookup(query)
      else setLemma(null)
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])


  return (
    <div className="w-full">
      <div className="sticky top-[78px] z-20 mb-8 mx-auto max-w-4xl px-6 sm:px-0">
        <div className="relative bg-white/95 backdrop-blur-md rounded-xl shadow-lg ring-1 ring-slate-200">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search Greek word (e.g., λόγος, ἀνήρ)..."
            className="w-full px-6 py-4 text-xl rounded-xl border-2 border-transparent focus:border-slate-400 font-serif placeholder-slate-400 bg-transparent"
          />
          <svg
            className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="space-y-6 w-full px-6">
        {loading && query.trim() && <p className="text-center py-4 text-lg text-slate-600">Processing lookup...</p>}

        {error && <div className="bg-red-100 text-red-700 p-4 rounded-xl mx-auto max-w-4xl">{error}</div>}

        {lemma && (
          <div className="p-6 bg-white/70 rounded-2xl border shadow-xl">
            <GreekDictionary lemma={lemma} />

            <div className="mt-4 pt-4 border-t border-slate-200 text-left">
              <p className="text-sm text-slate-500">
                Form entered: <strong className="text-slate-800">{query}</strong>
                <span className="mx-2">|</span>
                <a
                  href={`https://en.wiktionary.org/wiki/${lemma}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-800 font-semibold underline"
                >
                  View Full Wiktionary Entry for {lemma}
                </a>
              </p>
            </div>
          </div>
        )}
        {!lemma && query.trim() && !loading && !error && (
          <p className="text-center py-4 text-lg text-slate-600">Enter a word to begin the search.</p>
        )}
      </div>
    </div>
  )
}
