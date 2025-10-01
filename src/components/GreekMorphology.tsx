
import { useState, useEffect, useRef } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { fetchGreekMorphology, type EntryResult } from '../services/morphology'

const InflectionForm = ({ stem, suff }: { stem?: string; suff?: string }) => {
  if (!stem && !suff) return null
  return (
    <div className="font-serif text-lg font-bold text-slate-900 mb-1">
      {stem} <strong className="text-indigo-600 font-extrabold">{suff}</strong>
    </div>
  )
}

const MetadataText = ({ label, value }: { label: string; value: string }) => (
  <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full">
    {label}: {value}
  </span>
)

export default function GreekMorphology() {
  const [query, setQuery] = useState('')
  const [entries, setEntries] = useState<EntryResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const handleFetch = async (word: string) => {
    try {
      setLoading(true)
      setError(null)
      const data = await fetchGreekMorphology(word)
      setEntries(data)
      setOpenIndex(data.length > 0 ? 0 : null)
    } catch (err: any) {
      setError(err.message || 'Unknown error')
      setEntries([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      if (query.trim()) handleFetch(query)
      else setEntries([])
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const toggleInflections = (index: number) =>
    setOpenIndex(openIndex === index ? null : index)

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Search */}
      <div className="sticky top-[78px] z-20 mb-8">
        <div className="relative bg-white/95 backdrop-blur-md rounded-xl shadow-lg ring-1 ring-slate-200">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Analyze Ancient Greek word (e.g., λόγος, ἀνήρ)..."
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

      {/* Results */}
      <div className="space-y-6">
        {loading && <p className="text-center py-8">Analyzing...</p>}
        {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg">{error}</div>}

        {entries.map((entry, idx) => (
          <div key={idx} className="bg-white/70 rounded-2xl border shadow-xl">
            {/* Header */}
            <div className="p-6 border-b">
              <h3 className="text-4xl font-extrabold text-slate-900 font-serif mb-4">{entry.headword}</h3>
              <div className="flex flex-wrap gap-2">
                {entry.partOfSpeech && <MetadataText label="POS" value={entry.partOfSpeech} />}
                {entry.declension && <MetadataText label="Declension" value={entry.declension} />}
                {entry.gender && <MetadataText label="Gender" value={entry.gender} />}
              </div>
            </div>

            {/* Inflections */}
            <div>
              <button
                onClick={() => toggleInflections(idx)}
                className="flex justify-between items-center w-full p-6 text-left hover:bg-slate-50"
              >
                <h4 className="text-lg font-bold">Morphological Analysis ({entry.inflections.length})</h4>
                {openIndex === idx ? <ChevronUp /> : <ChevronDown />}
              </button>

              {openIndex === idx && (
                <ul className="grid md:grid-cols-2 gap-4 p-6 pt-0">
                  {entry.inflections.map((inf, i) => (
                    <li key={i} className="bg-white rounded-xl p-4 border shadow-sm">
                      <InflectionForm stem={inf.stem} suff={inf.suff} />
                      <div className="mt-2 flex flex-wrap gap-2">
                        {inf.case && <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-md">Case: <strong>{inf.case}</strong></span>}
                        {inf.num && <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-md">Number: <strong>{inf.num}</strong></span>}
                        {inf.gend && <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-md">Gender: <strong>{inf.gend}</strong></span>}
                        {inf.mood && <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-md">Mood: <strong>{inf.mood}</strong></span>}
                        {inf.tense && <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-md">Tense: <strong>{inf.tense}</strong></span>}
                        {inf.voice && <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-md">Voice: <strong>{inf.voice}</strong></span>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
