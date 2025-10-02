import type { APIRoute } from 'astro';
import * as cheerio from 'cheerio';

export const prerender = false;
const WIKTIONARY_BASE_URL = 'https://en.wiktionary.org/wiki/';

export const GET: APIRoute = async ({ params }) => {
  const lemma = params.lemma;
  if (!lemma) {
    return new Response(JSON.stringify({ error: 'Lemma parameter is required.' }), { status: 400 });
  }

  const url = `${WIKTIONARY_BASE_URL}${encodeURIComponent(lemma)}#Ancient_Greek`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Astro Wiktionary Scraper (Academic Use)',
      },
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: `Wiktionary server returned status ${response.status}` }), { status: 503 });
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const $startHeader = $('#Ancient_Greek');

    if ($startHeader.length === 0) {
      return new Response(JSON.stringify({ error: `Wiktionary entry for Ancient Greek not found for ${lemma}.` }), { status: 404 });
    }

    // 1. ISOLATE THE ANCIENT GREEK SECTION HTML (Initial Cheerio Crop)
    const $start = $startHeader.parent();
    const $end = $('#Greek').parent();
    let $content;
    if ($end.length > 0) {
      $content = $start.nextUntil($end);
    } else {
      $content = $start.nextAll();
    }

    // Convert the isolated section back to a string for guaranteed text cropping
    let isolatedHtml = $content.toArray().map(el => $.html(el)).join('');


    // 2. ABSOLUTE HARD TEXT CROP: Truncate at the first unwanted section
    const cutoffKeywords = ['Derived terms', 'Descendants', 'References', 'Further reading'];
    let minCutoffIndex = -1;

    for (const keyword of cutoffKeywords) {
      let keywordIndex = isolatedHtml.indexOf(keyword);

      if (keywordIndex !== -1) {
        let hTagStart = isolatedHtml.lastIndexOf('<h', keywordIndex);
        const finalCutIndex = (hTagStart !== -1) ? hTagStart : keywordIndex;

        if (minCutoffIndex === -1 || finalCutIndex < minCutoffIndex) {
          minCutoffIndex = finalCutIndex;
        }
      }
    }

    if (minCutoffIndex !== -1) {
      isolatedHtml = isolatedHtml.substring(0, minCutoffIndex);
    }


    // 3. FINAL CLEANUP (Cheerio on the cropped, safe content)
    const $contentWrapper = cheerio.load(isolatedHtml, null, false);

    // Remove the official Wiktionary edit link containers and the text '[edit]'
    $contentWrapper('.mw-editsection').remove();
    $contentWrapper('span').filter((i, el) => {
      return $contentWrapper(el).text().trim() === '[edit]';
    }).remove();

    // Remove the table of contents and any reference section links
    $contentWrapper('.toc, .mw-references-columns, sup.reference').remove();

    // --- STYLING (Headers and Alignment) ---
    // Apply clean, left-aligned styling to h3 (Noun, Etymology, Declension)
    $contentWrapper('h3').addClass('text-xl font-bold text-indigo-700 mt-6 mb-2 pb-1 border-b border-indigo-200 text-left');
    // Apply styling to h4 (Sub-headings)
    $contentWrapper('h4').addClass('text-lg font-semibold text-slate-700 mt-4 mb-1 text-left');


    // Remove all Wikimedia-specific classes and styles
    $contentWrapper('[class]').each((i, el) => {
      // Preserve custom header and table classes
      if (!$contentWrapper(el).is('table, th, td, h3, h4')) {
        $contentWrapper(el).removeAttr('class');
      }
    });
    $contentWrapper('[style]').removeAttr('style');

    // Remove internal links by replacing the <a> tag with its inner content
    $contentWrapper('a').each((i, el) => {
      $contentWrapper(el).replaceWith($contentWrapper(el).html() || $contentWrapper(el).text());
    });

    // 4. Apply Tailwind Styling to tables (Full Width)
    // Ensure all table content is explicitly left-aligned
    $contentWrapper('table').addClass('w-full border border-gray-300 rounded-lg overflow-hidden my-4 text-sm shadow-md text-left');
    $contentWrapper('th, td').addClass('p-3 border-b border-gray-200 text-left');
    $contentWrapper('th').addClass('bg-indigo-50 font-semibold text-indigo-800 text-left');

    // Get the final cleaned inner HTML
    const cleanedHtml = $contentWrapper.html() || '';

    return new Response(JSON.stringify({
      lemma: params.lemma,
      definition_html: cleanedHtml
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Scraping Error:', error);
    return new Response(JSON.stringify({ error: 'Server scraping failed.' }), { status: 500 });
  }
};
