'use strict';

/**
 * fetch-unsplash.js
 * Busca imagens no Unsplash para injetar nos slides do carrossel.
 *
 * Uso standalone:
 *   node fetch-unsplash.js --query "marketing digital" --count 3
 */

const https = require('https');

function searchUnsplash(query, count, accessKey) {
  return new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      query: query.slice(0, 100),
      per_page: Math.min(count || 1, 10),
      orientation: 'landscape',
      content_filter: 'high',
    });

    const options = {
      hostname: 'api.unsplash.com',
      path: `/search/photos?${params}`,
      method: 'GET',
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        'Accept-Version': 'v1',
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          if (json.errors) return reject(new Error(json.errors[0]));
          const urls = (json.results || [])
            .map(r => r.urls?.regular || r.urls?.full)
            .filter(Boolean);
          resolve(urls);
        } catch (e) {
          reject(new Error(`Unsplash parse error: ${data.slice(0, 80)}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error('Unsplash timeout'));
    });
    req.end();
  });
}

// Termos de busca por tipo de slide
const SLIDE_QUERIES = {
  capa:  (topic) => `${topic} professional`,
  corpo: (topic) => `${topic} business`,
  cta:   ()      => 'marketing agency office professional',
};

async function fetchSlidesImages(slides, topicTitle, accessKey) {
  const results = [];

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const isLast = i === slides.length - 1;
    const slideType = isLast ? 'cta' : (i === 0 ? 'capa' : 'corpo');

    const queryFn = SLIDE_QUERIES[slideType] || SLIDE_QUERIES.corpo;
    const hookWords = (slide.hook || '').replace(/[^a-zA-Z0-9 ]/g, '').split(' ').slice(0, 4).join(' ');
    const rawQuery = slideType === 'cta'
      ? queryFn()
      : queryFn(`${topicTitle} ${hookWords}`.trim());

    process.stdout.write(`  [${i + 1}/${slides.length}] "${rawQuery.slice(0, 50)}"... `);

    try {
      const urls = await searchUnsplash(rawQuery, 1, accessKey);
      const url = urls[0] || null;
      results.push(url);
      console.log(url ? 'OK' : 'sem resultado');
    } catch (e) {
      console.log(`erro: ${e.message.slice(0, 50)}`);
      results.push(null);
    }
  }

  return results;
}

module.exports = { searchUnsplash, fetchSlidesImages };

if (require.main === module) {
  const args = process.argv.slice(2);
  const get = f => { const i = args.indexOf(f); return i !== -1 ? args[i + 1] : null; };

  const query = get('--query') || 'marketing digital';
  const count = parseInt(get('--count') || '3', 10);

  const envPath = require('path').join(__dirname, '../.env');
  let accessKey = '';
  try {
    const lines = require('fs').readFileSync(envPath, 'utf8').split('\n');
    const line = lines.find(l => l.startsWith('UNSPLASH_ACCESS_KEY='));
    if (line) accessKey = line.split('=')[1].trim();
  } catch {}

  if (!accessKey) {
    console.error('UNSPLASH_ACCESS_KEY nao encontrado no .env');
    process.exit(1);
  }

  searchUnsplash(query, count, accessKey)
    .then(urls => {
      console.log(`\n${urls.length} imagem(ns) encontrada(s):`);
      urls.forEach((u, i) => console.log(`  ${i + 1}. ${u}`));
    })
    .catch(e => { console.error(e.message); process.exit(1); });
}
