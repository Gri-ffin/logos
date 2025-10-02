import { useState, useEffect, useRef } from 'react'
import { fetchGreekMorphology } from '../services/morphology'
import GreekDictionary from './GreekDictionary'

interface MorphologyEntry {
  headword: string;
}

const isGreek = (text: string): boolean => {
  const greekRegex = /[\u0370-\u03FF\u1F00-\u1FFF]/;
  return greekRegex.test(text.trim());
};

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

      if (!isGreek(cleanWord)) {
        setLemma(cleanWord);

      } else {
        const data: MorphologyEntry[] = await fetchGreekMorphology(cleanWord);

        if (data.length > 0) {
          setLemma(data[0].headword)
        } else {
          setError(`No morphological entry found for "${cleanWord}".`);
        }
      }
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
    <div className="w-full mx-auto">
      {/* Search Bar (Sticky at the top) */}
      <div className="sticky top-[78px] z-20 mb-8">
        <div className="relative bg-white/95 backdrop-blur-md rounded-xl shadow-lg ring-1 ring-slate-200">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search Greek word (e.g. ἀνδρός, or ἐποίησεν)..."
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

      {/* Results and Loading/Error Status */}
      <div className="space-y-6">
        {loading && query.trim() && <p className="text-center py-4 text-lg text-slate-600">Processing lookup...</p>}

        {error && <div className="bg-red-100 text-red-700 p-4 rounded-xl">{error}</div>}

        {/* Dictionary Component: Only renders if a lemma (headword) is found */}
        {lemma && (
          <div className="p-6 bg-white/70 rounded-2xl border shadow-xl">
            {/* GreekDictionary handles the dictionary lookup */}
            <GreekDictionary lemma={lemma} />

            <div className="mt-4 pt-4 border-t border-slate-200 text-left">
              <p className="text-sm text-slate-500">
                Form entered: <strong className="text-slate-800">{query}</strong>
                <span className="mx-2">|</span>
                Lookup mode: <strong className="text-indigo-600">{isGreek(query) ? 'Morphology (Greek)' : 'Direct (Latin)'}</strong>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
