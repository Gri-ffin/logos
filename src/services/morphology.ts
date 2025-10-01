export interface Inflection {
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

export interface EntryResult {
  headword: string
  partOfSpeech?: string
  declension?: string
  gender?: string
  inflections: Inflection[]
}

/**
 * Fetch Greek morphological analysis for a given word
 */
export async function fetchGreekMorphology(word: string): Promise<EntryResult[]> {
  const trimmedWord = word.trim()
  if (!trimmedWord) return []

  const url = `https://services.perseids.org/bsp/morphologyservice/analysis/word?lang=grc&engine=morpheusgrc&word=${encodeURIComponent(trimmedWord)}`
  const resp = await fetch(url)

  if (!resp.ok) throw new Error(`API returned error ${resp.status}`)

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

  return parsed
}
