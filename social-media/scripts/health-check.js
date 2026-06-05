#!/usr/bin/env node
'use strict';

/**
 * Social Media Squad — Health Check
 * Verifica todas as credenciais e dependencias necessarias.
 * Uso: node health-check.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const SQUAD_DIR = path.join(__dirname, '..');
const ENV_PATH = path.join(SQUAD_DIR, '.env');
const ROOT_ENV_PATH = path.join(__dirname, '../../..', '.env');

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

function loadEnv() {
  const result = {};
  for (const envFile of [ROOT_ENV_PATH, ENV_PATH]) {
    try {
      const lines = fs.readFileSync(envFile, 'utf8').split('\n');
      for (const line of lines) {
        if (!line || line.startsWith('#')) continue;
        const [k, ...v] = line.split('=');
        if (k) result[k.trim()] = v.join('=').trim();
      }
    } catch { /* arquivo nao existe */ }
  }
  return result;
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    }).on('error', reject);
  });
}

const PASS = '\x1b[32m✓\x1b[0m';
const FAIL = '\x1b[31m✗\x1b[0m';
const WARN = '\x1b[33m~\x1b[0m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function check(label, ok, detail = '') {
  const icon = ok === true ? PASS : ok === 'warn' ? WARN : FAIL;
  const detailStr = detail ? `  ${'\x1b[90m'}${detail}${RESET}` : '';
  console.log(`  ${icon}  ${label}${detailStr}`);
  return ok === true;
}

// ---------------------------------------------------------------
// Main
// ---------------------------------------------------------------

async function run() {
  console.log(`\n${BOLD}Social Media Squad — Health Check${RESET}`);
  console.log('='.repeat(50));

  const env = loadEnv();
  const results = { pass: 0, warn: 0, fail: 0 };

  function mark(ok) {
    if (ok === true) results.pass++;
    else if (ok === 'warn') results.warn++;
    else results.fail++;
  }

  // ---------------------------------------------------------------
  // 1. Arquivos essenciais
  // ---------------------------------------------------------------
  console.log(`\n${BOLD}[1] Arquivos do Squad${RESET}`);

  const essentialFiles = [
    ['squad.yaml', 'squads/social-media-squad/squad.yaml'],
    ['workflows/post-creation-workflow.yaml', 'squads/social-media-squad/workflows/post-creation-workflow.yaml'],
    ['data/brandbook-carbon-films.yaml', 'squads/social-media-squad/data/brandbook-carbon-films.yaml'],
    ['data/commands-library.yaml', 'squads/social-media-squad/data/commands-library.yaml'],
    ['data/mind-council-frameworks.yaml', 'squads/social-media-squad/data/mind-council-frameworks.yaml'],
    ['scripts/canva-client.js', 'squads/social-media-squad/scripts/canva-client.js'],
    ['scripts/canva-carousel.js', 'squads/social-media-squad/scripts/canva-carousel.js'],
    ['scripts/instagram-post.js', 'squads/social-media-squad/scripts/instagram-post.js'],
    ['scripts/run-workflow.js', 'squads/social-media-squad/scripts/run-workflow.js'],
  ];

  for (const [label, relPath] of essentialFiles) {
    const fullPath = path.join(__dirname, '../../..', relPath);
    const ok = fs.existsSync(fullPath);
    mark(ok);
    check(label, ok, ok ? '' : 'arquivo nao encontrado');
  }

  // ---------------------------------------------------------------
  // 2. Canva API
  // ---------------------------------------------------------------
  console.log(`\n${BOLD}[2] Canva API${RESET}`);

  const hasClientId = !!env.CANVA_CLIENT_ID;
  const hasClientSecret = !!env.CANVA_CLIENT_SECRET;
  const canvaTokenPath = path.join(SQUAD_DIR, '.canva-token.json') ||
    path.join(__dirname, '../../..', '.canva-token.json');
  const hasCanvaToken = fs.existsSync(canvaTokenPath);

  mark(hasClientId);
  check('CANVA_CLIENT_ID', hasClientId, hasClientId ? env.CANVA_CLIENT_ID.substring(0, 10) + '...' : 'nao encontrado no .env');

  mark(hasClientSecret);
  check('CANVA_CLIENT_SECRET', hasClientSecret, hasClientSecret ? '***' : 'nao encontrado no .env');

  mark(hasCanvaToken ? true : 'warn');
  check('Token OAuth (.canva-token.json)', hasCanvaToken ? true : 'warn',
    hasCanvaToken ? 'token salvo' : 'execute: node scripts/canva-auth.js');

  if (hasCanvaToken) {
    try {
      const token = JSON.parse(fs.readFileSync(canvaTokenPath, 'utf8'));
      const expired = token.expires_at && Date.now() > token.expires_at * 1000;
      mark(expired ? 'warn' : true);
      check('Token valido', expired ? 'warn' : true, expired ? 'expirado — re-execute canva-auth.js' : `expira em ${new Date(token.expires_at * 1000).toLocaleDateString('pt-BR')}`);
    } catch {
      mark(false);
      check('Token valido', false, 'erro ao ler .canva-token.json');
    }
  }

  // ---------------------------------------------------------------
  // 3. Meta / Instagram API
  // ---------------------------------------------------------------
  console.log(`\n${BOLD}[3] Meta Graph API (Instagram)${RESET}`);

  const metaToken = env.META_ACCESS_TOKEN;
  const igUserId = env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  mark(metaToken ? true : false);
  check('META_ACCESS_TOKEN', metaToken ? true : false, metaToken ? metaToken.substring(0, 12) + '...' : 'PENDENTE — aguarda socio');

  mark(igUserId ? true : false);
  check('INSTAGRAM_BUSINESS_ACCOUNT_ID', igUserId ? true : false, igUserId || 'PENDENTE — aguarda socio');

  if (metaToken) {
    try {
      const res = await httpGet(`https://graph.facebook.com/v19.0/me?fields=id,name&access_token=${metaToken}`);
      const valid = res.status === 200 && res.body.id;
      mark(valid ? true : false);
      check('Token Meta valido', valid ? true : false, valid ? `conta: ${res.body.name} (${res.body.id})` : `erro: ${JSON.stringify(res.body.error)}`);
    } catch (err) {
      mark(false);
      check('Token Meta valido', false, `erro de conexao: ${err.message}`);
    }
  }

  // ---------------------------------------------------------------
  // 4. Apify
  // ---------------------------------------------------------------
  console.log(`\n${BOLD}[4] Apify (analise de perfil)${RESET}`);

  const apifyToken = env.APIFY_TOKEN;
  mark(apifyToken ? true : false);
  check('APIFY_TOKEN', apifyToken ? true : false, apifyToken ? apifyToken.substring(0, 10) + '...' : 'PENDENTE — console.apify.com → Settings → Integrations → API token');

  if (apifyToken) {
    try {
      const res = await httpGet(`https://api.apify.com/v2/users/me?token=${apifyToken}`);
      const valid = res.status === 200 && res.body.data;
      mark(valid ? true : false);
      check('Token Apify valido', valid ? true : false, valid ? `usuario: ${res.body.data.username}` : `erro: ${res.status}`);
    } catch (err) {
      mark(false);
      check('Token Apify valido', false, `erro de conexao: ${err.message}`);
    }
  }

  // ---------------------------------------------------------------
  // 5. Dados do brandbook
  // ---------------------------------------------------------------
  console.log(`\n${BOLD}[5] Brandbook Carbon Films${RESET}`);

  const brandbookPath = path.join(SQUAD_DIR, 'data/brandbook-carbon-films.yaml');
  if (fs.existsSync(brandbookPath)) {
    const content = fs.readFileSync(brandbookPath, 'utf8');
    const hasPlaceholders = (content.match(/\[PLACEHOLDER\]/g) || []).length;
    const hasCompetitors = !content.includes('competitors: []') && content.includes('competitors:');
    const hasBaselines = !content.includes('engagement_rate_baseline: null');

    mark(hasPlaceholders === 0 ? true : 'warn');
    check('Sem placeholders', hasPlaceholders === 0 ? true : 'warn', hasPlaceholders > 0 ? `${hasPlaceholders} placeholders pendentes` : 'ok');

    mark(hasCompetitors ? true : 'warn');
    check('Concorrentes configurados', hasCompetitors ? true : 'warn', hasCompetitors ? 'ok' : 'preencher competitors: [] no brandbook');

    mark(hasBaselines ? true : 'warn');
    check('Baselines de engajamento', hasBaselines ? true : 'warn', hasBaselines ? 'ok' : 'preencher performance_baselines com dados do IG Insights');
  }

  // ---------------------------------------------------------------
  // 6. Canva templates
  // ---------------------------------------------------------------
  console.log(`\n${BOLD}[6] Canva Templates (9 esperados)${RESET}`);

  const templates = [
    'feed-impactante-template',
    'stories-simples-template',
    'carrossel-edu-template',
    'reels-trend-template',
    'resultado-cliente-template',
    'bastidores-template',
    'tiktok-viral-template',
    'autoridade-template',
    'edicao-basica-template',
  ];

  const templateMapPath = path.join(SQUAD_DIR, 'data/canva-template-ids.json');
  const templateMap = fs.existsSync(templateMapPath)
    ? JSON.parse(fs.readFileSync(templateMapPath, 'utf8'))
    : {};

  for (const tmpl of templates) {
    const mapped = !!templateMap[tmpl];
    mark(mapped ? true : 'warn');
    check(tmpl, mapped ? true : 'warn', mapped ? `ID: ${templateMap[tmpl]}` : 'criar no Canva e adicionar ID em data/canva-template-ids.json');
  }

  // ---------------------------------------------------------------
  // 7. Mind Council
  // ---------------------------------------------------------------
  console.log(`\n${BOLD}[7] Mind Council${RESET}`);

  const mindCouncilPath = path.join(SQUAD_DIR, 'data/mind-council-frameworks.yaml');
  const mindCouncilOk = fs.existsSync(mindCouncilPath);
  mark(mindCouncilOk ? true : false);
  check('mind-council-frameworks.yaml', mindCouncilOk ? true : false);

  const runWorkflowPath = path.join(SQUAD_DIR, 'scripts/run-workflow.js');
  if (fs.existsSync(runWorkflowPath)) {
    const content = fs.readFileSync(runWorkflowPath, 'utf8');
    const hasCouncil = content.includes('consultMindCouncil') || content.includes('stageMindCouncil') || content.includes('mind_council');
    mark(hasCouncil ? true : 'warn');
    check('Mind Council integrado ao pipeline', hasCouncil ? true : 'warn', hasCouncil ? 'ok' : 'nao integrado ainda no run-workflow.js');
  }

  // ---------------------------------------------------------------
  // Resumo final
  // ---------------------------------------------------------------
  console.log('\n' + '='.repeat(50));
  console.log(`${BOLD}Resultado:${RESET}`);
  console.log(`  ${PASS}  ${results.pass} ok`);
  console.log(`  ${WARN}  ${results.warn} avisos (funciona parcialmente)`);
  console.log(`  ${FAIL}  ${results.fail} falhas (bloqueante)`);

  if (results.fail === 0 && results.warn === 0) {
    console.log(`\n${PASS} Squad 100% configurado. Pronto para producao.\n`);
  } else if (results.fail === 0) {
    console.log(`\n${WARN} Squad funcional com pendencias nao-bloqueantes.\n`);
  } else {
    console.log(`\n${FAIL} ${results.fail} item(s) bloqueantes precisam ser resolvidos.\n`);
  }

  process.exit(results.fail > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Erro no health-check:', err.message);
  process.exit(1);
});
