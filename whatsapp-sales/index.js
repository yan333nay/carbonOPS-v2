#!/usr/bin/env node
/**
 * WhatsApp Sales — Carbon Films
 * Orquestrador de campanha: lê CRM, sincroniza contatos, dispara sequência.
 * A negociação pós-resposta é tratada pelo webhook-server.js.
 *
 * Uso:
 *   node index.js           — inicia ciclo de disparos
 *   node index.js --status  — mostra status da campanha
 *   node index.js --qr      — imprime QR code para conectar o WhatsApp
 */
require('dotenv').config({ path: __dirname + '/.env' });

const qrcode    = require('qrcode-terminal');
const { getContacts }             = require('./src/crm');
const { syncContacts, runCycle,
        loadDB, getDueContacts }  = require('./src/campaign');
const { generateReport }          = require('./src/reporter');
const { getQRCode, getStatus,
        sendText, setWebhook }    = require('./src/evolution');
const { DAILY_NEW_CONTACTS,
        DAILY_TOTAL_LIMIT,
        countSentToday }          = require('./src/anti-block');
const { TOTAL_STEPS }             = require('./src/sequences');

const OWNER = process.env.OWNER_WHATSAPP || '';

// ─── --qr: exibe QR para escanear ────────────────────────────────────────────
if (process.argv.includes('--qr')) {
  (async () => {
    const status = await getStatus();
    if (status === 'open') {
      console.log('[whatsapp] Já conectado. Nenhum QR necessário.');
      process.exit(0);
    }
    const base64 = await getQRCode();
    if (!base64) { console.error('Erro ao obter QR code. Evolution API está rodando?'); process.exit(1); }
    console.log('\nEscaneie com o WhatsApp Business da Carbon Films:\n');
    qrcode.generate(base64.replace(/^data:image\/[a-z]+;base64,/, ''), { small: true });
  })();
  return;
}

// ─── --status: mostra estado da campanha ─────────────────────────────────────
if (process.argv.includes('--status')) {
  const db = loadDB();
  console.log('\n=== Status da Campanha Carbon Films ===');
  console.log(`Total na campanha    : ${db.contacts.length}`);
  console.log(`Pendentes (fila)     : ${db.contacts.filter(c => c.status === 'pending').length}`);
  console.log(`Em sequência         : ${db.contacts.filter(c => !c.responded && !['pending','completed'].includes(c.status)).length}`);
  console.log(`Responderam          : ${db.contacts.filter(c => c.responded).length}`);
  console.log(`Em negociação        : ${db.contacts.filter(c => c.status === 'negotiating').length}`);
  console.log(`Fechamentos          : ${db.contacts.filter(c => c.negotiationStage === 'closed_won').length}`);
  console.log(`Sequência completa   : ${db.contacts.filter(c => c.status === 'completed').length}`);
  console.log(`Prontos pra enviar   : ${getDueContacts(db).length}`);
  console.log(`Enviados hoje        : ${countSentToday(db)} total / ${countSentToday(db, 1)} novos`);
  console.log(`Limites diários      : ${DAILY_NEW_CONTACTS} novos / ${DAILY_TOTAL_LIMIT} total`);
  console.log('========================================\n');
  process.exit(0);
}

// ─── Loop principal ───────────────────────────────────────────────────────────
async function runCampaignCycle() {
  console.log(`\n[campaign] Ciclo iniciado — ${new Date().toLocaleString('pt-BR')}`);

  // Verifica conexão WhatsApp
  const status = await getStatus();
  if (status !== 'open') {
    console.log(`[whatsapp] Desconectado (status: ${status}). Rode: node index.js --qr`);
    return scheduleNext();
  }

  try {
    console.log('[campaign] Sincronizando CRM...');
    const crmContacts = await getContacts();
    console.log(`[campaign] ${crmContacts.length} contatos com WhatsApp no CRM`);

    let db = loadDB();
    db = syncContacts(db, crmContacts);

    // Cria cliente fake compatível com runCycle (usa evolution.sendText internamente)
    const evolutionClient = {
      sendMessage: async (chatId, text) => {
        const number = chatId.replace('@c.us', '');
        return sendText(number, text);
      },
    };

    await runCycle(evolutionClient, db);
  } catch (err) {
    console.error('[campaign] Erro:', err.message);
  }

  scheduleNext();
}

function scheduleNext() {
  console.log('[campaign] Próxima verificação em 30 minutos...');
  setTimeout(runCampaignCycle, 30 * 60 * 1000);
}

// Configura webhook antes do primeiro ciclo
async function start() {
  try {
    // 172.19.0.1 = gateway do Docker (host visto de dentro do container Evolution API)
    await setWebhook('http://172.19.0.1:3001/webhook');
    console.log('[evolution] Webhook configurado → localhost:3001/webhook');
  } catch (err) {
    console.error('[evolution] Aviso: não foi possível configurar webhook:', err.message);
  }
  await runCampaignCycle();
}

start();
