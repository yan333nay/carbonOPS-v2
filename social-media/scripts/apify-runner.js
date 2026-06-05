'use strict';
/**
 * apify-runner.js
 * Executa Apify Actors via REST API e retorna resultados.
 * Usa polling para aguardar conclusão do run.
 *
 * Uso:
 *   const { runActor } = require('./apify-runner');
 *   const items = await runActor('apify~instagram-profile-scraper', { usernames: ['carbonfilms.sc'] });
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const ENV_PATH = path.join(__dirname, '..', '.env');

function loadEnv() {
  try {
    return fs.readFileSync(ENV_PATH, 'utf8')
      .split('\n').filter(l => l && !l.startsWith('#'))
      .reduce((acc, l) => {
        const [k, ...v] = l.split('=');
        if (k && k.trim()) acc[k.trim()] = v.join('=').trim();
        return acc;
      }, {});
  } catch { return {}; }
}

function apifyRequest(method, urlPath, token, body = null) {
  const sep = urlPath.includes('?') ? '&' : '?';
  const fullPath = `${urlPath}${sep}token=${token}`;

  const headers = { 'Content-Type': 'application/json' };
  const bodyStr = body ? JSON.stringify(body) : null;
  if (bodyStr) headers['Content-Length'] = Buffer.byteLength(bodyStr);

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.apify.com',
      path: fullPath,
      method,
      headers,
    }, (r) => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => {
        try {
          resolve(JSON.parse(d));
        } catch { resolve(d); }
      });
    });
    req.on('error', reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ---------------------------------------------------------------
// Executa um Apify Actor e aguarda os resultados
//
// @param {string} actorId     — ex: 'apify~instagram-profile-scraper'
// @param {object} input       — input para o actor
// @param {object} opts
//   @param {number} [opts.timeoutMs=90000]   — timeout em ms
//   @param {number} [opts.maxItems=20]       — limite de itens retornados
//   @param {boolean} [opts.verbose=false]    — log de progresso
// ---------------------------------------------------------------
async function runActor(actorId, input, { timeoutMs = 90000, maxItems = 20, verbose = false } = {}) {
  const env = loadEnv();
  const token = env.APIFY_TOKEN;

  if (!token) {
    throw new Error('APIFY_TOKEN não configurado em .env');
  }

  // Sanitiza o actorId (aceita 'apify/instagram-...' ou 'apify~instagram-...')
  const sanitized = actorId.replace('/', '~');

  if (verbose) console.log(`  [Apify] Iniciando ${sanitized}...`);

  // Inicia o run
  const runRes = await apifyRequest('POST', `/v2/acts/${sanitized}/runs`, token, input);

  if (!runRes.data?.id) {
    throw new Error(`Apify run falhou: ${JSON.stringify(runRes).slice(0, 300)}`);
  }

  const runId = runRes.data.id;
  if (verbose) console.log(`  [Apify] Run ID: ${runId}`);

  // Polling até SUCCEEDED ou timeout
  const start = Date.now();
  const pollInterval = 4000;
  let status = runRes.data.status;

  while (status === 'READY' || status === 'RUNNING') {
    if (Date.now() - start > timeoutMs) {
      throw new Error(`Apify timeout após ${timeoutMs / 1000}s (runId: ${runId})`);
    }
    await sleep(pollInterval);
    const pollRes = await apifyRequest('GET', `/v2/actor-runs/${runId}`, token);
    status = pollRes.data?.status;
    if (verbose) process.stdout.write(`  [Apify] Status: ${status}...\r`);
  }

  if (status !== 'SUCCEEDED') {
    throw new Error(`Apify run terminou com status: ${status} (runId: ${runId})`);
  }

  if (verbose) console.log(`\n  [Apify] Concluído. Buscando resultados...`);

  // Busca itens do dataset
  const itemsRes = await apifyRequest(
    'GET',
    `/v2/actor-runs/${runId}/dataset/items?limit=${maxItems}&format=json`,
    token
  );

  return Array.isArray(itemsRes) ? itemsRes : (itemsRes.items || []);
}

module.exports = { runActor, loadEnv };
