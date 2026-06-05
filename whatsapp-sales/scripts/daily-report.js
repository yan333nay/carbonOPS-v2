#!/usr/bin/env node
/**
 * Relatório diário autônomo — executado pelo cron às 19h BRT.
 * Lê campaign-db.json, gera stats e envia resumo ao Yan via WhatsApp.
 */
require('dotenv').config({ path: __dirname + '/../.env' });

const { loadDB }         = require('../src/campaign');
const { generateReport } = require('../src/reporter');
const { sendText }       = require('../src/evolution');

const OWNER = process.env.OWNER_WHATSAPP || '';

(async () => {
  try {
    const db = loadDB();
    await generateReport(db, OWNER ? sendText : null);
    process.exit(0);
  } catch (err) {
    console.error('[daily-report] Erro:', err.message);
    process.exit(1);
  }
})();
