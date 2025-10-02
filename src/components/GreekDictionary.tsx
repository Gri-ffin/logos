// src/components/GreekDictionary.tsx

import { useState, useEffect } from 'react';

interface GreekDictionaryProps {
  lemma: string;
}

const cleanLemmaForApi = (text: string): string => {
  return text.trim();
};

export default function GreekDictionary({ lemma }: GreekDictionaryProps) {
  const [definitionHtml, setDefinitionHtml] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lemma) {
      setDefinitionHtml(null);
      return;
    }

    const fetchDefinition = async () => {
      setLoading(true);
      setError(null);
      setDefinitionHtml(null);

      const cleanLemma = cleanLemmaForApi(lemma);
      const apiPath = `/api/wiktionary/${encodeURIComponent(cleanLemma)}`;

      try {
        const response = await fetch(apiPath);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown server error.' }));
          throw new Error(errorData.error || `Server Status ${response.status}`);
        }

        const data: { definition_html: string } = await response.json();

        setDefinitionHtml(data.definition_html || 'No definition found in Ancient Greek section.');
      } catch (err: any) {
        setError(`Lookup Error: ${err.message || 'An unknown error occurred.'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchDefinition();

  }, [lemma]);

  if (!lemma) {
    return null;
  }

  return (
    <div className="my-10 w-full font-sans">

      {/* Styling: Main title header */}
      <h3 className="text-3xl font-extrabold text-slate-900 border-b-4 border-indigo-500 pb-3 mb-6">
        Wiktionary Entry for <strong className="text-indigo-600 font-serif italic text-4xl">{lemma}</strong>
      </h3>

      {loading && <p className="text-slate-600">Fetching Wiktionary definition...</p>}

      {error && <div className="bg-red-100 text-red-700 p-4 rounded-lg text-base border border-red-300">{error}</div>}

      {/* Rendering the cleaned HTML */}
      {definitionHtml && !loading && (
        <div
          // Explicitly set text-left to override any unwanted centered alignment
          className="text-base text-slate-700 leading-relaxed space-y-4 p-4 bg-white rounded-xl text-left"
          dangerouslySetInnerHTML={{ __html: definitionHtml }}
        />
      )}
    </div>
  );
}
