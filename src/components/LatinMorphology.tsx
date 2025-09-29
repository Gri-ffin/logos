import { useState, useEffect, useRef } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

// --- Interfaces ---
interface Inflection {
  case?: string
  num?: string
  gend?: string
  mood?: string
  tense?: string
  voice?: string
  stem?: string
  suff?: string
  [key: string]: any
}

interface EntryResult {
  headword: string
  partOfSpeech?: string
  declension?: string
  gender?: string
  inflections: Inflection[]
}

// Helper to render the combined inflection form with stem/suffix
const InflectionForm = ({ stem, suff }: { stem?: string; suff?: string }) => {
  if (!stem && !suff) return null

  return (
    <div className='font-serif text-lg font-bold text-slate-900 mb-1'>
      {stem} <strong className='text-indigo-600 font-extrabold'>{suff}</strong>
    </div>
  )
}

// Metadata badge
const MetadataText = ({ label, value }: { label: string; value: string }) => (
  <span className='px-3 py-1 bg-slate-100 text-slate-700 text-xs font-medium rounded-full'>
    {label}: {value}
  </span>
)

export default function LatinMorphology() {
  const [query, setQuery] = useState('')
  const [entries, setEntries] = useState<EntryResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  const fetchEntry = async (word: string) => {
    const trimmedWord = word.trim()
    if (!trimmedWord) {
      setEntries([])
      setError(null)
      setOpenIndex(null)
      return
    }

    setLoading(true)
    setEntries([])
    setError(null)

    try {
      const url = `https://services.perseids.org/bsp/morphologyservice/analysis/word?lang=lat&engine=morpheuslat&word=${encodeURIComponent(
        trimmedWord
      )}`
      const resp = await fetch(url)
      if (!resp.ok) throw new Error('API returned error ' + resp.status)

      const json = await resp.json()
      const annotations = json.RDF?.Annotation
      if (!annotations) throw new Error('No Annotation structure found.')

      const bodies = annotations.Body
        ? Array.isArray(annotations.Body)
          ? annotations.Body
          : [annotations.Body]
        : []
      if (!bodies.length) throw new Error('No morphological data found.')

      const parsed: EntryResult[] = bodies
        .map((body: any) => {
          const entry = body.rest?.entry
          if (!entry) return null
          const dict = entry.dict
          const inflsRaw = entry.infl || []
          const inflsArray = Array.isArray(inflsRaw) ? inflsRaw : [inflsRaw]

          const inflections: Inflection[] = inflsArray.map((inf: any) => ({
            case: inf.case?.$,
            num: inf.num?.$,
            gend: inf.gend?.$,
            mood: inf.mood?.$,
            tense: inf.tense?.$,
            voice: inf.voice?.$,
            stem: inf.term?.stem?.$ || '',
            suff: inf.term?.suff?.$ || ''
          }))

          return {
            headword: dict?.hdwd?.$ || trimmedWord,
            partOfSpeech: dict?.pofs?.$,
            declension: dict?.decl?.$,
            gender: dict?.gend?.$,
            inflections
          }
        })
        .filter(Boolean) as EntryResult[]

      if (!parsed.length) throw new Error('No results found.')
      setEntries(parsed)
      setOpenIndex(0)
    } catch (err: any) {
      console.error(err)
      setError(err.message || 'Unknown error')
      setOpenIndex(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      fetchEntry(query)
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  const toggleInflections = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <div className='w-full max-w-4xl mx-auto'>
      {/* Search input */}
      <div className='sticky top-[78px] z-20 mb-8'>
        <div className='relative bg-white/95 backdrop-blur-md rounded-xl shadow-lg transition-all duration-300 ring-1 ring-slate-200'>
          <input
            type='text'
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder='Analyze Latin word (e.g., veritas, dicere)...'
            className='w-full px-6 py-4 text-xl rounded-xl border-2 border-transparent focus:border-slate-400 focus:outline-none font-serif placeholder-slate-400 transition-colors bg-transparent'
          />
          <svg
            className='absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 pointer-events-none'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
            />
          </svg>
        </div>
      </div>

      {/* Results */}
      <div className='space-y-6'>
        {loading && (
          <div className='text-center py-8 text-slate-600 font-sans text-lg'>
            <div className='inline-block animate-spin rounded-full h-8 w-8 border-4 border-slate-200 border-t-slate-600 mb-2'></div>
            <p>Analyzing...</p>
          </div>
        )}

        {error && (
          <div className='bg-red-50/70 border border-red-200 text-red-800 p-4 rounded-xl font-sans backdrop-blur'>
            <span className='font-bold'>Error:</span> {error}
          </div>
        )}

        {entries.length === 0 && !loading && !error && query && (
          <div className='text-center py-8 text-slate-500 italic font-sans'>
            No morphological analysis found for "{query}".
          </div>
        )}

        {entries.map((entry, idx) => (
          <div
            key={idx}
            className='bg-white/70 backdrop-blur-xl rounded-2xl border border-slate-200 shadow-xl transition-all duration-200'
          >
            {/* Entry Header */}
            <div className='p-6 sm:p-8 border-b border-slate-200'>
              <h3 className='text-4xl font-extrabold text-slate-900 font-serif mb-4 leading-tight'>
                {entry.headword}
              </h3>
              <h4 className='font-semibold text-slate-700 mb-2 font-sans'>
                Metadata
              </h4>
              <div className='flex flex-wrap gap-2'>
                {entry.partOfSpeech && (
                  <MetadataText label='POS' value={entry.partOfSpeech} />
                )}
                {entry.declension && (
                  <MetadataText label='Declension' value={entry.declension} />
                )}
                {entry.gender && (
                  <MetadataText label='Gender' value={entry.gender} />
                )}
              </div>
            </div>

            {/* Inflections */}
            <div>
              <button
                onClick={() => toggleInflections(idx)}
                className='flex justify-between items-center w-full p-6 sm:px-8 sm:py-4 text-left text-slate-700 hover:bg-slate-50/70 transition-colors'
              >
                <h4 className='text-lg font-bold font-sans'>
                  Morphological Analysis ({entry.inflections.length})
                </h4>
                {openIndex === idx ? (
                  <ChevronUp className='w-5 h-5 text-slate-600' />
                ) : (
                  <ChevronDown className='w-5 h-5 text-slate-400' />
                )}
              </button>

              {openIndex === idx && (
                <div className='p-6 pt-0 sm:px-8 animate-in fade-in slide-in-from-top-1'>
                  <h5 className='text-sm font-semibold text-slate-600 mb-3 border-l-4 border-indigo-400 pl-3'>
                    Derived Forms and Attributes
                  </h5>
                  <ul className='grid md:grid-cols-2 gap-4 text-sm text-slate-700 pt-2'>
                    {entry.inflections.map((inf, i) => (
                      <li
                        key={i}
                        className='bg-white rounded-xl p-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow'
                      >
                        {/* Morphological Form */}
                        <InflectionForm stem={inf.stem} suff={inf.suff} />

                        {/* Attributes as badges */}
                        <div className='mt-2 flex flex-wrap gap-2'>
                          {inf.case && (
                            <span className='bg-indigo-100 text-indigo-800 text-xs font-semibold px-2 py-1 rounded-md'>
                              Case: <strong>{inf.case}</strong>
                            </span>
                          )}
                          {inf.num && (
                            <span className='bg-indigo-100 text-indigo-800 text-xs font-semibold px-2 py-1 rounded-md'>
                              Number: <strong>{inf.num}</strong>
                            </span>
                          )}
                          {inf.gend && (
                            <span className='bg-indigo-100 text-indigo-800 text-xs font-semibold px-2 py-1 rounded-md'>
                              Gender: <strong>{inf.gend}</strong>
                            </span>
                          )}
                          {inf.mood && (
                            <span className='bg-indigo-100 text-indigo-800 text-xs font-semibold px-2 py-1 rounded-md'>
                              Mood: <strong>{inf.mood}</strong>
                            </span>
                          )}
                          {inf.tense && (
                            <span className='bg-indigo-100 text-indigo-800 text-xs font-semibold px-2 py-1 rounded-md'>
                              Tense: <strong>{inf.tense}</strong>
                            </span>
                          )}
                          {inf.voice && (
                            <span className='bg-indigo-100 text-indigo-800 text-xs font-semibold px-2 py-1 rounded-md'>
                              Voice: <strong>{inf.voice}</strong>
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
