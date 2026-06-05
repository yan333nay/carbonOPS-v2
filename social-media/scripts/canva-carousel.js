#!/usr/bin/env node
'use strict';

/**
 * Pixel — Carousel Creation Pipeline
 * Carbon Films Social Media Squad
 *
 * Pipeline completo:
 *   1. Busca fotos no Unsplash (dark/cinematic/premium)
 *   2. Upload das fotos para Canva Assets
 *   3. Cria design carousel nas dimensoes corretas
 *   4. Gera briefing slide-by-slide com brandbook Carbon Films
 *   5. Retorna URL do editor + briefing completo
 *
 * Uso:
 *   node canva-carousel.js                          # demo: 3 erros de marketing
 *   node canva-carousel.js --input briefing.json    # briefing customizado
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const client = require('./canva-client');
const ENV_PATH = path.join(__dirname, '../.env');

// ---------------------------------------------------------------
// Unsplash API (free, sem auth para search basico)
// ---------------------------------------------------------------
const UNSPLASH_ACCESS_KEY = (() => {
  try {
    const env = fs.readFileSync(ENV_PATH, 'utf8')
      .split('\n').filter(l => l && !l.startsWith('#'))
      .reduce((a, l) => { const [k, ...v] = l.split('='); if (k) a[k.trim()] = v.join('=').trim(); return a; }, {});
    return env.UNSPLASH_ACCESS_KEY || null;
  } catch { return null; }
})();

function unsplashSearch(query, count = 1, orientation = 'squarish') {
  return new Promise((resolve, reject) => {
    if (!UNSPLASH_ACCESS_KEY) {
      // Fallback: usar fotos curadas Carbon Films style (dark/cinematic)
      resolve(FALLBACK_PHOTOS.slice(0, count));
      return;
    }

    const qs = new URLSearchParams({
      query, per_page: count, orientation,
      content_filter: 'high',
    });

    const req = https.request({
      hostname: 'api.unsplash.com',
      path: `/search/photos?${qs}`,
      headers: { 'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}` },
    }, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve((json.results || []).map(p => ({
            id: p.id,
            url: p.urls.regular,
            download_url: p.links.download_location,
            description: p.alt_description || query,
            photographer: p.user.name,
          })));
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// Fotos curadas Unsplash — estetica dark/cinematic/premium (Carbon Films style)
const FALLBACK_PHOTOS = [
  {
    id: 'cover',
    url: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1080&q=80',
    description: 'Dark premium workspace with laptop — capa do carrossel',
    photographer: 'Unsplash',
  },
  {
    id: 'slide-2',
    url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1080&q=80',
    description: 'Analytics dashboard dark — erros de marketing',
    photographer: 'Unsplash',
  },
  {
    id: 'slide-3',
    url: 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=1080&q=80',
    description: 'Strategy meeting dark office — planejamento',
    photographer: 'Unsplash',
  },
  {
    id: 'slide-4',
    url: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=1080&q=80',
    description: 'Results growth chart — resultados',
    photographer: 'Unsplash',
  },
  {
    id: 'slide-5',
    url: 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=1080&q=80',
    description: 'Social media content creation — producao de conteudo',
    photographer: 'Unsplash',
  },
  {
    id: 'cta',
    url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1080&q=80',
    description: 'Dark premium office building — CTA slide',
    photographer: 'Unsplash',
  },
];

// ---------------------------------------------------------------
// Canva Asset Upload via URL
// ---------------------------------------------------------------
// Baixa imagem de URL e retorna buffer
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : require('http');
    mod.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return resolve(downloadImage(res.headers.location));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({
        buffer: Buffer.concat(chunks),
        contentType: res.headers['content-type'] || 'image/jpeg',
      }));
    }).on('error', reject);
  });
}

async function uploadAssetFromUrl(photoUrl, name) {
  const token = await client.getValidToken();

  // Step 1: Download da imagem
  const { buffer } = await downloadImage(photoUrl);

  // Step 2: Upload direto como octet-stream — metadata no header
  // Ref: https://www.canva.dev/docs/connect/api-reference/assets/create-asset-upload-job/
  // Asset-Upload-Metadata = JSON string (NAO base64) com name_base64 = base64(filename)
  const metadata = JSON.stringify({ name_base64: Buffer.from(name + '.jpg').toString('base64') });

  const uploadRes = await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.canva.com',
      path: '/rest/v1/asset-uploads',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
        'Content-Length': buffer.length,
        'Asset-Upload-Metadata': metadata,
      },
    }, (r) => {
      let data = '';
      r.on('data', c => { data += c; });
      r.on('end', () => {
        try { resolve({ status: r.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: r.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.write(buffer);
    req.end();
  });

  if (uploadRes.status !== 200) {
    throw new Error(`Asset upload failed (${uploadRes.status}): ${JSON.stringify(uploadRes.body)}`);
  }

  const jobId = uploadRes.body.job?.id;
  if (!jobId) throw new Error(`No job ID returned: ${JSON.stringify(uploadRes.body)}`);

  // Step 3: Poll job status
  for (let i = 0; i < 20; i++) {
    await new Promise(r => setTimeout(r, 1500));

    const poll = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.canva.com',
        path: `/rest/v1/asset-uploads/${jobId}`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      }, (r) => {
        let data = '';
        r.on('data', c => { data += c; });
        r.on('end', () => resolve({ status: r.statusCode, body: JSON.parse(data) }));
      });
      req.on('error', reject);
      req.end();
    });

    const pollJob = poll.body.job;
    if (pollJob?.status === 'success') return pollJob.asset;
    if (pollJob?.status === 'failed') throw new Error(`Asset upload job failed: ${JSON.stringify(pollJob)}`);
  }

  throw new Error('Asset upload timed out');
}

// ---------------------------------------------------------------
// Brandbook Carbon Films — constantes
// ---------------------------------------------------------------
const BRANDBOOK = {
  bg: '#050505',
  surface: '#111111',
  gold: '#C9A84C',
  gold_light: '#E8C97A',
  white: '#FFFFFF',
  gray_400: '#A0A0A0',
  gray_600: '#6B6B6B',
  font_display: 'Anton',
  font_body: 'Montserrat',
  font_mono: 'JetBrains Mono',
  handle: '@carbonfilms.sc',
  brand: 'CARBON FILMS',
  gradient_overlay: 'linear-gradient(to top, rgba(5,5,5,0.92) 0%, rgba(5,5,5,0.4) 50%, transparent 100%)',
  gold_line: '32px wide · 1px height · #C9A84C',
};

// ---------------------------------------------------------------
// Gerar briefing de slides (Carbon Films brandbook)
// ---------------------------------------------------------------
function generateSlideBriefings(topic, slides, assets) {
  return slides.map((slide, i) => {
    const asset = assets[i] || assets[assets.length - 1];
    const isFirst = i === 0;
    const isLast = i === slides.length - 1;

    return {
      slide_number: i + 1,
      type: isFirst ? 'capa' : isLast ? 'cta' : 'corpo',
      dimensions: '1080x1080px',
      asset_id: asset?.id || null,
      asset_url: asset?.url || null,

      layout: isFirst ? {
        background: `Foto como bg com overlay: ${BRANDBOOK.gradient_overlay}`,
        top_bar: `${BRANDBOOK.brand} (Anton 14px, gold) | ${topic.category_label} (JetBrains Mono 9px, gray-400) — alinhados horizontalmente`,
        center: 'vazio',
        bottom: [
          `Hook: "${slide.hook}" — Anton, UPPERCASE, 28-32px, branco, bold`,
          `Linha gold: ${BRANDBOOK.gold_line}`,
          `Label: "${slide.label || 'SLIDE 1 DE ' + slides.length}" — JetBrains Mono, 9px, gray-400, uppercase`,
        ],
      } : isLast ? {
        background: `Foto como bg com overlay forte: rgba(5,5,5,0.85)`,
        top_bar: `${BRANDBOOK.brand} (Anton 14px, gold)`,
        center: [
          `Headline: "${slide.hook}" — Anton, UPPERCASE, 28px, branco`,
          `Linha gold: ${BRANDBOOK.gold_line}`,
          `CTA: "${slide.body}" — Montserrat 700, 11px, uppercase, padding 12px 28px, bg branco, cor #111`,
        ],
        bottom: `${BRANDBOOK.handle} — JetBrains Mono, 9px, gray-600`,
      } : {
        background: `Foto como bg com overlay: ${BRANDBOOK.gradient_overlay}`,
        top_bar: `${BRANDBOOK.brand} (Anton 12px, gold) | Slide ${i + 1}/${slides.length} (mono 9px gray)`,
        hook: `"${slide.hook}" — Anton UPPERCASE, 24-28px, branco`,
        gold_line: BRANDBOOK.gold_line,
        body: `"${slide.body}" — Montserrat 400, 13px, gray-400, max 3 linhas`,
        bottom: `${BRANDBOOK.handle} — JetBrains Mono 9px gray-600`,
      },

      brandbook_checks: [
        `Background: ${BRANDBOOK.bg} ou foto com overlay escuro`,
        `Accent: ${BRANDBOOK.gold} apenas em linha separadora e label`,
        `Font headline: ${BRANDBOOK.font_display} UPPERCASE`,
        `Font corpo: ${BRANDBOOK.font_body}`,
        `SEM emojis`,
        `Safe zone: 80px em todos os lados`,
      ],
    };
  });
}

// ---------------------------------------------------------------
// Pipeline principal
// ---------------------------------------------------------------
async function run(input) {
  const { topic, slides } = input;

  console.log('\nPixel — Pipeline de Carrossel Carbon Films');
  console.log('='.repeat(50));
  console.log(`Topico:   ${topic.title}`);
  console.log(`Slides:   ${slides.length}`);
  console.log(`Formato:  1080x1080 (1:1)`);
  console.log('='.repeat(50));

  // 1. Buscar fotos
  console.log('\n[1/4] Buscando fotos Unsplash...');
  let photos;
  if (UNSPLASH_ACCESS_KEY) {
    photos = await unsplashSearch(topic.photo_query, slides.length, 'squarish');
    if (photos.length < slides.length) {
      photos = [...photos, ...FALLBACK_PHOTOS].slice(0, slides.length);
    }
  } else {
    photos = FALLBACK_PHOTOS.slice(0, slides.length);
    console.log('  (sem UNSPLASH_ACCESS_KEY — usando fotos curadas do acervo)');
  }
  photos.forEach((p, i) => console.log(`  [${i + 1}] ${p.description} — ${p.url}`));

  // 2. Upload para Canva
  console.log('\n[2/4] Fazendo upload das fotos para Canva Assets...');
  const assets = [];
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    process.stdout.write(`  Foto ${i + 1}/${photos.length}: `);
    try {
      const asset = await uploadAssetFromUrl(photo.url, `carbon-films-slide-${i + 1}`);
      assets.push({ ...asset, url: photo.url });
      console.log(`OK — Asset ID: ${asset.id}`);
    } catch (err) {
      console.log(`WARN: ${err.message} — usando URL direta`);
      assets.push({ id: null, url: photo.url });
    }
  }

  // 3. Criar design no Canva
  console.log('\n[3/4] Criando carousel no Canva...');
  const designTitle = `Carbon Films — ${topic.title} — ${new Date().toLocaleDateString('pt-BR')}`;
  const design = await client.createDesign('carrossel-edu', designTitle);
  const editorUrl = client.getEditorUrl(design.id);
  console.log(`  Design ID: ${design.id}`);
  console.log(`  Editor:    ${editorUrl}`);

  // 4. Gerar briefing completo
  console.log('\n[4/4] Gerando briefing slide-by-slide...');
  const slideBriefings = generateSlideBriefings(topic, slides, assets);

  const output = {
    created_at: new Date().toISOString(),
    design: {
      id: design.id,
      title: designTitle,
      format: 'carousel',
      dimensions: '1080x1080',
      slides_count: slides.length,
      editor_url: editorUrl,
      status: 'editing',
    },
    brandbook_snapshot: BRANDBOOK,
    assets: assets.map((a, i) => ({
      slide: i + 1,
      canva_asset_id: a.id,
      photo_url: a.url,
      description: photos[i]?.description,
    })),
    slides: slideBriefings,
    copy: slides.map((s, i) => ({
      slide: i + 1,
      hook: s.hook,
      body: s.body || null,
      label: s.label || null,
    })),
  };

  // Salvar output
  const outputFile = path.join(__dirname, '../data/carousel-latest.json');
  fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));

  // Atualizar designs-queue
  const queueFile = path.join(__dirname, '../data/designs-queue.json');
  let queue = [];
  try { queue = JSON.parse(fs.readFileSync(queueFile, 'utf8')); } catch {}
  queue.push({
    id: design.id,
    command: 'carrossel-edu',
    title: designTitle,
    dimensions: '1080x1080',
    created_at: new Date().toISOString(),
    status: 'editing',
    editor_url: editorUrl,
  });
  fs.writeFileSync(queueFile, JSON.stringify(queue, null, 2));

  // Print resultado
  console.log('\n' + '='.repeat(50));
  console.log('CARROSSEL CRIADO COM SUCESSO');
  console.log('='.repeat(50));
  console.log(`\nEditor Canva: ${editorUrl}\n`);
  console.log('BRIEFING DOS SLIDES:');
  console.log('-'.repeat(50));

  slideBriefings.forEach(s => {
    console.log(`\nSlide ${s.slide_number} [${s.type.toUpperCase()}]`);
    if (s.type === 'capa') {
      console.log(`  Foto bg:  ${s.asset_url}`);
      const l = s.layout;
      console.log(`  Top:      ${l.top_bar}`);
      l.bottom.forEach(b => console.log(`  Bottom:   ${b}`));
    } else if (s.type === 'cta') {
      const l = s.layout;
      console.log(`  Foto bg:  ${s.asset_url}`);
      l.center.forEach(c => console.log(`  Center:   ${c}`));
      console.log(`  Bottom:   ${l.bottom}`);
    } else {
      const l = s.layout;
      console.log(`  Foto bg:  ${s.asset_url}`);
      console.log(`  Hook:     ${l.hook}`);
      console.log(`  Body:     ${l.body}`);
    }
  });

  console.log('\n' + '-'.repeat(50));
  console.log(`Briefing completo salvo: data/carousel-latest.json`);
  console.log(`Design na fila:         data/designs-queue.json`);

  return output;
}

// ---------------------------------------------------------------
// Demo input: "3 Erros que Matam seu Tráfego" (Carbon Films)
// ---------------------------------------------------------------
const DEMO_INPUT = {
  topic: {
    title: '3 Erros que Matam seu Tráfego',
    category_label: 'CF_001 / MARKETING',
    photo_query: 'dark cinematic marketing analytics professional',
    caption: '3 erros que destroem qualquer estratégia de tráfego.\n\n(O erro 2 é o mais comum — e o mais caro)\n\nSalva para não cometer nenhum.\n\n#carbonfilms #marketingdigital #trafegopagosc',
    hashtags: ['#carbonfilms', '#marketingdigital', '#trafegopagosc', '#marketingsc'],
  },
  slides: [
    {
      hook: '3 ERROS QUE MATAM SEU TRÁFEGO',
      body: null,
      label: 'CF_001 / MARKETING',
    },
    {
      hook: 'ERRO 01: SEM OBJETIVO CLARO',
      body: 'Impulsionar sem saber o que você quer gerar é jogar dinheiro fora. Defina: awareness, lead ou venda.',
      label: null,
    },
    {
      hook: 'ERRO 02: PÚBLICO MUITO AMPLO',
      body: 'Quanto mais aberto o público, menos relevante o seu anúncio. Nicho correto = custo por resultado menor.',
      label: null,
    },
    {
      hook: 'ERRO 03: CRIATIVO SEM HOOK',
      body: 'Os primeiros 3 segundos decidem tudo. Sem hook forte, o algoritmo descarta seu anúncio.',
      label: null,
    },
    {
      hook: 'RESULTADO: +300% DE ROI',
      body: 'Corrija esses 3 pontos e seus resultados mudam em menos de 30 dias.',
      label: null,
    },
    {
      hook: 'QUER ESSES RESULTADOS?',
      body: 'FALAR COM A CARBON',
      label: null,
    },
  ],
};

// Main
const args = process.argv.slice(2);
let input = DEMO_INPUT;

if (args.includes('--input')) {
  const inputFile = args[args.indexOf('--input') + 1];
  input = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
}

run(input).catch(err => {
  console.error('\nErro:', err.message);
  process.exit(1);
});
