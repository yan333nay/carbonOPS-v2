#!/usr/bin/env node
require('dotenv').config({ path: __dirname + '/.env' });

const { search } = require('./src/searcher');
const { scrapeWebsite, createBrowser } = require('./src/scraper');
const { writeToSheets, saveToCSV, hasCredentials } = require('./src/sheets');
const { load: loadDB, save: saveDB, isDuplicate } = require('./src/dedup');
const { log, logError } = require('./src/logger');

const TARGET = parseInt(process.env.TARGET_LEADS_PER_DAY) || 25;
const MAX_TRIES = 60;
const DRY_RUN = process.argv.includes('--dry-run');

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

async function run() {
  log(`========================================`);
  log(`Leads Agent — Carbon Films${DRY_RUN ? ' [DRY RUN]' : ''}`);
  log(`========================================`);

  if (!hasCredentials()) {
    log('AVISO: google-credentials.json não encontrado.');
    log('Os leads serão salvos em data/leads-backup.csv');
    log('Siga SETUP.md para configurar o Google Sheets.');
  }

  const db = loadDB();
  const today = todayStr();
  const todayCount = db.leads.filter(l => (l.foundAt || '').startsWith(today)).length;
  const needed = TARGET - todayCount;

  if (needed <= 0) {
    log(`Meta diária já atingida: ${todayCount}/${TARGET} leads encontrados hoje.`);
    return;
  }

  log(`Meta: ${TARGET} leads/dia | Hoje: ${todayCount} | Faltam: ${needed}`);

  // Monta set de hosts já conhecidos para evitar buscas duplicadas
  const knownHosts = db.leads.map(l => {
    try { return new URL(l.siteUrl).hostname.replace(/^www\./, ''); } catch { return ''; }
  }).filter(Boolean);

  const urls = await search(needed + 20, knownHosts);
  log(`${urls.length} URLs candidatas encontradas`);

  const newLeads = [];
  let tried = 0;

  // Abre um único browser para todos os scrapes (muito mais rápido)
  const browser = await createBrowser();
  try {
    for (const url of urls) {
      if (newLeads.length >= needed || tried >= MAX_TRIES) break;
      tried++;

      if (isDuplicate(url, db)) {
        log(`Pulando (já existe): ${url}`);
        continue;
      }

      log(`[${tried}] Raspando: ${url}`);
      try {
        const lead = await scrapeWebsite(url, browser);
        if (lead && (lead.email || lead.telefone)) {
          log(`  OK: ${lead.nome} | ${lead.email} | ${lead.telefone}`);
          newLeads.push({ ...lead, foundAt: new Date().toISOString() });
        } else {
          log(`  Sem contato encontrado — pulando`);
        }
      } catch (err) {
        logError(`Falha ao raspar ${url}: ${err.message}`);
      }
    }
  } finally {
    await browser.close();
  }

  log(`\nLeads válidos encontrados: ${newLeads.length}`);

  if (newLeads.length === 0) {
    log('Nenhum lead novo nesta execução.');
    return;
  }

  if (!DRY_RUN) {
    // Salva na planilha Google Sheets
    try {
      await writeToSheets(newLeads);
    } catch (err) {
      logError(`Google Sheets: ${err.message}`);
      log('Salvando em CSV local como fallback...');
      saveToCSV(newLeads);
    }

    // Atualiza banco local
    db.leads.push(...newLeads);
    saveDB(db);
  } else {
    log('\n--- Leads que seriam salvos ---');
    newLeads.forEach(l => {
      log(`  ${l.nome} | ${l.email} | ${l.telefone} | ${l.siteUrl}`);
      log(`  Serviços: ${l.servicos}`);
    });
  }

  log(`\n=== Concluído: ${newLeads.length} leads adicionados ===`);
}

run().catch(err => {
  console.error('ERRO FATAL:', err);
  process.exit(1);
});
