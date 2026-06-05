#!/usr/bin/env node
require('dotenv').config({ path: __dirname + '/.env' });

const { search, NICHE_TEMPLATES } = require('./src/searcher');
const { scrapeWebsite, createBrowser } = require('./src/scraper');
const { enrichLeads } = require('./src/enricher');
const { writeToSheets, saveToCSV, hasCredentials } = require('./src/sheets');
const { load: loadDB, save: saveDB, isDuplicate } = require('./src/dedup');
const { log, logError } = require('./src/logger');

// 50 leads por nicho por dia
const TARGET_PER_NICHE = parseInt(process.env.TARGET_LEADS_PER_DAY) || 50;
const MAX_TRIES_PER_NICHE = 100;
const DRY_RUN = process.argv.includes('--dry-run');

// Nicho específico via argumento (ex: node index.js --nicho restaurantes)
const nichoArg = (() => {
  const i = process.argv.indexOf('--nicho');
  return i !== -1 ? process.argv[i + 1] : null;
})();

const ALL_NICHES = Object.keys(NICHE_TEMPLATES);
const NICHES_TO_RUN = nichoArg ? [nichoArg] : ALL_NICHES;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

async function runNiche(nicho, db) {
  log(`\n========================================`);
  log(`Nicho: ${nicho.toUpperCase()}${DRY_RUN ? ' [DRY RUN]' : ''}`);
  log(`========================================`);

  const today = todayStr();
  const todayCount = db.leads
    .filter(l => l.nicho === nicho && (l.foundAt || '').startsWith(today))
    .length;
  const needed = TARGET_PER_NICHE - todayCount;

  if (needed <= 0) {
    log(`Meta diária já atingida: ${todayCount}/${TARGET_PER_NICHE} leads de "${nicho}" encontrados hoje.`);
    return;
  }

  log(`Meta: ${TARGET_PER_NICHE} leads/dia | Hoje: ${todayCount} | Faltam: ${needed}`);

  const knownHosts = db.leads
    .filter(l => l.nicho === nicho)
    .map(l => {
      try { return new URL(l.siteUrl).hostname.replace(/^www\./, ''); } catch { return ''; }
    }).filter(Boolean);

  const urls = await search(needed + 20, knownHosts, nicho);
  log(`${urls.length} URLs candidatas encontradas para "${nicho}"`);

  const newLeads = [];
  let tried = 0;

  const browser = await createBrowser();
  try {
    for (const url of urls) {
      if (newLeads.length >= needed || tried >= MAX_TRIES_PER_NICHE) break;
      tried++;

      if (isDuplicate(url, db)) {
        log(`Pulando (já existe): ${url}`);
        continue;
      }

      log(`[${tried}] Raspando: ${url}`);
      try {
        const lead = await scrapeWebsite(url, browser, nicho);
        if (lead) {
          log(`  OK: ${lead.nome} | ${lead.email || '-'} | ${lead.telefone || '-'}${lead.socialLinks?.length ? ` | social:${lead.socialLinks.length}` : ''}`);
          newLeads.push({ ...lead, nicho, foundAt: new Date().toISOString() });
        } else {
          log(`  Sem dados suficientes — pulando`);
        }
      } catch (err) {
        logError(`Falha ao raspar ${url}: ${err.message}`);
      }
    }
  } finally {
    await browser.close();
  }

  if (newLeads.length === 0) {
    log('Nenhum lead novo nesta execução.');
    return;
  }

  // Enriquecimento: busca telefone para leads sem contato direto
  const enrichBrowser = await createBrowser();
  let enrichedLeads;
  try {
    enrichedLeads = await enrichLeads(newLeads, enrichBrowser);
  } finally {
    await enrichBrowser.close();
  }

  // Só salva leads com ao menos email ou telefone após enriquecimento
  const validLeads = enrichedLeads.filter(l => l.email || l.telefone || l.whatsapp);
  const dropped = enrichedLeads.length - validLeads.length;
  if (dropped > 0) log(`[enricher] ${dropped} lead(s) descartado(s) (sem contato mesmo após busca)`);

  log(`\nLeads válidos: ${validLeads.length} (nicho: ${nicho})`);

  if (validLeads.length === 0) {
    log('Nenhum lead com contato válido nesta execução.');
    return;
  }

  if (!DRY_RUN) {
    try {
      await writeToSheets(validLeads, nicho);
    } catch (err) {
      logError(`Google Sheets [${nicho}]: ${err.message}`);
      log('Salvando em CSV local como fallback...');
      saveToCSV(validLeads);
    }
    db.leads.push(...validLeads);
    saveDB(db);
  } else {
    log('\n--- Leads que seriam salvos ---');
    validLeads.forEach(l => {
      log(`  [${l.nicho}] ${l.nome} | ${l.email} | ${l.telefone} | ${l.siteUrl}`);
    });
  }
}

async function run() {
  log(`\n========================================`);
  log(`Leads Agent — Carbon Films`);
  log(`Nichos: ${NICHES_TO_RUN.join(', ')}`);
  log(`========================================`);

  if (!hasCredentials()) {
    log('AVISO: google-credentials.json não encontrado.');
    log('Os leads serão salvos em data/leads-backup.csv');
  }

  const db = loadDB();

  for (const nicho of NICHES_TO_RUN) {
    try {
      await runNiche(nicho, db);
    } catch (err) {
      logError(`Erro no nicho "${nicho}": ${err.message}`);
    }
  }

  log(`\n=== Leads Agent concluído ===`);
}

run().catch(err => {
  console.error('ERRO FATAL:', err);
  process.exit(1);
});
