#!/usr/bin/env node
'use strict';

/**
 * Rhythm — Instagram Post via Meta Graph API
 * Suporta: post simples, carrossel, stories
 *
 * Requer no .env:
 *   META_ACCESS_TOKEN
 *   INSTAGRAM_BUSINESS_ACCOUNT_ID
 *
 * Uso:
 *   node instagram-post.js --carousel --images url1,url2,url3 --caption "texto"
 *   node instagram-post.js --single --image url --caption "texto"
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const ENV_PATH = path.join(__dirname, '../.env');
const POST_HISTORY_PATH = path.join(__dirname, '../data/post-history.json');

function savePostHistory(entry) {
  let history = [];
  try { history = JSON.parse(fs.readFileSync(POST_HISTORY_PATH, 'utf8')); } catch { /* primeiro post */ }
  history.unshift(entry);
  fs.writeFileSync(POST_HISTORY_PATH, JSON.stringify(history, null, 2));
}

function loadEnv() {
  return fs.readFileSync(ENV_PATH, 'utf8')
    .split('\n')
    .filter(l => l && !l.startsWith('#'))
    .reduce((a, l) => {
      const [k, ...v] = l.split('=');
      if (k) a[k.trim()] = v.join('=').trim();
      return a;
    }, {});
}

function graphApi(path, params, method = 'POST') {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams(params).toString();

    const req = https.request({
      hostname: 'graph.facebook.com',
      path: `/v19.0${path}`,
      method,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
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
    req.write(body);
    req.end();
  });
}

// ---------------------------------------------------------------
// Post simples (1 imagem)
// ---------------------------------------------------------------
async function postSingleImage({ imageUrl, caption, accessToken, igUserId }) {
  console.log('Criando container de imagem...');

  const containerRes = await graphApi(`/${igUserId}/media`, {
    image_url: imageUrl,
    caption,
    access_token: accessToken,
  });

  if (containerRes.body.error) {
    throw new Error(`Container creation failed: ${containerRes.body.error.message}`);
  }

  const containerId = containerRes.body.id;
  console.log(`  Container ID: ${containerId}`);

  // Aguardar processamento
  await new Promise(r => setTimeout(r, 3000));

  // Publicar
  console.log('Publicando...');
  const publishRes = await graphApi(`/${igUserId}/media_publish`, {
    creation_id: containerId,
    access_token: accessToken,
  });

  if (publishRes.body.error) {
    throw new Error(`Publish failed: ${publishRes.body.error.message}`);
  }

  return publishRes.body;
}

// ---------------------------------------------------------------
// Carrossel (multiplas imagens)
// ---------------------------------------------------------------
async function postCarousel({ imageUrls, caption, accessToken, igUserId }) {
  console.log(`Criando ${imageUrls.length} containers de slides...`);

  const childIds = [];

  for (let i = 0; i < imageUrls.length; i++) {
    process.stdout.write(`  Slide ${i + 1}/${imageUrls.length}: `);

    const res = await graphApi(`/${igUserId}/media`, {
      image_url: imageUrls[i],
      is_carousel_item: 'true',
      access_token: accessToken,
    });

    if (res.body.error) {
      throw new Error(`Slide ${i + 1} container failed: ${res.body.error.message}`);
    }

    childIds.push(res.body.id);
    console.log(`OK — ID: ${res.body.id}`);

    // Delay entre uploads para evitar rate limit
    if (i < imageUrls.length - 1) await new Promise(r => setTimeout(r, 1000));
  }

  // Criar container do carrossel
  console.log('Criando container carousel...');
  const carouselRes = await graphApi(`/${igUserId}/media`, {
    media_type: 'CAROUSEL',
    children: childIds.join(','),
    caption,
    access_token: accessToken,
  });

  if (carouselRes.body.error) {
    throw new Error(`Carousel container failed: ${carouselRes.body.error.message}`);
  }

  const carouselId = carouselRes.body.id;
  console.log(`  Carousel ID: ${carouselId}`);

  // Aguardar processamento do carousel
  console.log('Aguardando processamento...');
  await new Promise(r => setTimeout(r, 5000));

  // Publicar
  console.log('Publicando carousel...');
  const publishRes = await graphApi(`/${igUserId}/media_publish`, {
    creation_id: carouselId,
    access_token: accessToken,
  });

  if (publishRes.body.error) {
    throw new Error(`Carousel publish failed: ${publishRes.body.error.message}`);
  }

  return publishRes.body;
}

// ---------------------------------------------------------------
// Main
// ---------------------------------------------------------------
async function main() {
  const env = loadEnv();

  const META_TOKEN = env.META_ACCESS_TOKEN;
  const IG_USER_ID = env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  if (!META_TOKEN || !IG_USER_ID) {
    console.error('\nCredenciais ausentes no .env:');
    if (!META_TOKEN) console.error('  META_ACCESS_TOKEN nao encontrado');
    if (!IG_USER_ID) console.error('  INSTAGRAM_BUSINESS_ACCOUNT_ID nao encontrado');
    console.error('\nAdicione as credenciais Meta Graph API ao .env e tente novamente.');
    process.exit(1);
  }

  const args = process.argv.slice(2);

  const isCarousel = args.includes('--carousel');
  const isSingle = args.includes('--single');

  const captionIdx = args.indexOf('--caption');
  const caption = captionIdx !== -1 ? args[captionIdx + 1] : '';

  if (isCarousel) {
    const imagesIdx = args.indexOf('--images');
    if (imagesIdx === -1) {
      console.error('Uso: node instagram-post.js --carousel --images url1,url2,url3 --caption "texto"');
      process.exit(1);
    }

    const imageUrls = args[imagesIdx + 1].split(',');

    console.log('\nRhythm — Postando Carousel no Instagram');
    console.log(`Slides: ${imageUrls.length}`);
    console.log(`Caption: ${caption.substring(0, 80)}...`);
    console.log('-'.repeat(50));

    const result = await postCarousel({ imageUrls, caption, accessToken: META_TOKEN, igUserId: IG_USER_ID });

    console.log('\nCarousel publicado com sucesso!');
    console.log(`Post ID: ${result.id}`);
    console.log(`URL: https://www.instagram.com/p/${result.id}/`);

    savePostHistory({
      post_id: result.id,
      type: 'carousel',
      topic: caption.split('\n')[0].substring(0, 80),
      caption_preview: caption.substring(0, 120),
      slides_count: imageUrls.length,
      posted_at: new Date().toISOString(),
      url: `https://www.instagram.com/p/${result.id}/`,
    });

    return result;
  }

  if (isSingle) {
    const imageIdx = args.indexOf('--image');
    if (imageIdx === -1) {
      console.error('Uso: node instagram-post.js --single --image url --caption "texto"');
      process.exit(1);
    }

    const imageUrl = args[imageIdx + 1];

    console.log('\nRhythm — Postando Imagem no Instagram');
    console.log(`Imagem: ${imageUrl}`);
    console.log(`Caption: ${caption.substring(0, 80)}...`);
    console.log('-'.repeat(50));

    const result = await postSingleImage({ imageUrl, caption, accessToken: META_TOKEN, igUserId: IG_USER_ID });

    console.log('\nPost publicado com sucesso!');
    console.log(`Post ID: ${result.id}`);

    savePostHistory({
      post_id: result.id,
      type: 'single',
      topic: caption.split('\n')[0].substring(0, 80),
      caption_preview: caption.substring(0, 120),
      slides_count: 1,
      posted_at: new Date().toISOString(),
      url: `https://www.instagram.com/p/${result.id}/`,
    });

    return result;
  }

  console.error('Use --carousel ou --single');
  process.exit(1);
}

if (require.main === module) {
  main().catch(err => {
    console.error('\nErro:', err.message);
    process.exit(1);
  });
}

module.exports = { postSingleImage, postCarousel };
