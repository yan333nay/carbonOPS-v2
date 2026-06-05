/**
 * checkup-vacuum.js — Reengaja leads "negotiating" que pararam de responder.
 *
 * Critérios:
 * - status === 'negotiating'
 * - conversationHistory.length > 0
 * - última atividade há mais de 24 horas
 * - NÃO reengaja: closed_*, meeting_scheduled, leadTemperature === 'cold'
 *
 * Máximo 5 leads por execução, delay 45–90s entre envios.
 * Log em /root/whatsapp-sales/logs/vacuum.log
 */
require('dotenv').config({ path: __dirname + '/../.env' });
const fs   = require('fs');
const path = require('path');
const { generateReply } = require('../src/negotiation');
const { sendText } = require('../src/evolution');

const DB_PATH  = path.join(__dirname, '..', 'data', 'campaign-db.json');
const LOG_PATH = path.join(__dirname, '..', 'logs', 'vacuum.log');

const MAX_LEADS    = 5;
const DELAY_MIN_MS = 45_000;
const DELAY_MAX_MS = 90_000;
const INACTIVITY_HOURS = 24;

// Statuses que impedem reengajamento
const SKIP_STATUSES = new Set([
  'closed_bot', 'closed_won', 'closed_lost', 'closed_menu',
  'closed_email', 'closed_decisor', 'closed_sem_resposta',
  'meeting_scheduled', 'completed',
]);

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  fs.appendFileSync(LOG_PATH, line + '\n');
}

function loadDB() {
  if (!fs.existsSync(DB_PATH)) return { contacts: [], sentLog: [] };
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function saveDB(db) {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function randomDelay() {
  return DELAY_MIN_MS + Math.random() * (DELAY_MAX_MS - DELAY_MIN_MS);
}

/**
 * Retorna o timestamp da última atividade do lead
 * (última mensagem do histórico ou respondedAt).
 */
function lastActivityAt(contact) {
  const history = contact.conversationHistory || [];
  if (history.length > 0) {
    // O histórico não guarda timestamp explícito — usamos respondedAt ou addedAt como base
    // Se tiver messagesLog, usamos o último sentAt
    const lastLog = (contact.messagesLog || []).slice(-1)[0];
    if (lastLog?.sentAt) return new Date(lastLog.sentAt);
  }
  if (contact.respondedAt) return new Date(contact.respondedAt);
  if (contact.addedAt) return new Date(contact.addedAt);
  return new Date(0);
}

/**
 * Gera a mensagem de reengajamento adaptada ao estágio da conversa.
 * Usa generateReply com uma instrução interna que não aparece para o lead.
 */
function buildReengajamentoPrompt(contact) {
  const stage = contact.negotiationStage || 'rapport';
  if (stage === 'meeting_proposed' || stage === 'closing' || stage === 'direct_sale_attempted') {
    return 'REENGAJAMENTO: o lead parou de responder enquanto discutíamos a reunião ou fechamento. Gere uma mensagem de follow-up natural e direta para retomar exatamente de onde paramos, sem repetir o que já foi dito. Seja breve e encaminhe para um sim ou não.';
  }
  if (stage === 'qualifying') {
    return 'REENGAJAMENTO: o lead parou de responder durante a qualificação. Gere uma mensagem de follow-up com uma abordagem ligeiramente diferente para retomar a conversa. Use uma pergunta nova ou um ângulo diferente da dor dele.';
  }
  if (stage === 'pitch') {
    return 'REENGAJAMENTO: o lead parou de responder após o pitch. Gere uma mensagem de follow-up com um case study diferente ou uma nova perspectiva do problema dele para reacender o interesse. Não repita o mesmo pitch.';
  }
  // rapport / initial_reply / fallback
  return 'REENGAJAMENTO: lead parou de responder. Gere uma mensagem de follow-up natural para retomar a conversa, como se fosse uma continuação natural do que foi falado. Seja breve e direto.';
}

async function main() {
  log('=== checkup-vacuum iniciado ===');
  const db = loadDB();

  const now = new Date();
  const cutoff = new Date(now.getTime() - INACTIVITY_HOURS * 60 * 60 * 1000);

  // Filtra candidatos ao reengajamento
  const candidates = db.contacts.filter(c => {
    if (c.status !== 'negotiating') return false;
    if (SKIP_STATUSES.has(c.status)) return false;
    if (c.leadTemperature === 'cold') return false;
    const history = c.conversationHistory || [];
    if (history.length === 0) return false;
    const lastActivity = lastActivityAt(c);
    return lastActivity <= cutoff;
  });

  if (candidates.length === 0) {
    log('Nenhum lead elegível para reengajamento.');
    return;
  }

  log(`${candidates.length} lead(s) elegíveis. Processando até ${MAX_LEADS}.`);

  // Ordena por última atividade (mais antigos primeiro)
  candidates.sort((a, b) => lastActivityAt(a) - lastActivityAt(b));

  let processed = 0;
  for (const contact of candidates) {
    if (processed >= MAX_LEADS) break;

    const lastActivity = lastActivityAt(contact);
    const hoursAgo = Math.round((now - lastActivity) / 3600000);
    log(`Processando: ${contact.nome} (${contact.whatsapp}) | nicho: ${contact.nicho} | stage: ${contact.negotiationStage} | inativo há ${hoursAgo}h`);

    const prompt = buildReengajamentoPrompt(contact);

    try {
      const result = await generateReply(contact, prompt, db);
      if (!result || !result.fragments || result.fragments.length === 0) {
        log(`  [SKIP] IA não gerou resposta para ${contact.whatsapp}`);
        continue;
      }

      // Envia os fragmentos — sendText lança erro se API não confirmar
      for (let fi = 0; fi < result.fragments.length; fi++) {
        if (fi > 0) {
          const typingDelay = 1500 + Math.min(result.fragments[fi].length * 35, 3000) + Math.random() * 800;
          await sleep(typingDelay);
        }
        await sendText(contact.whatsapp, result.fragments[fi]);
      }

      // Registra no messagesLog só após todos os fragmentos confirmados
      const text = result.fragments.join('\n');
      contact.messagesLog = contact.messagesLog || [];
      contact.messagesLog.push({
        step: 'vacuum',
        sentAt: new Date().toISOString(),
        text,
      });
      saveDB(db);

      log(`  [OK] Mensagem enviada para ${contact.nome} | ${result.fragments.length} fragmento(s) | temperatura: ${result.temperature}`);
      processed++;

      // Delay entre envios
      if (processed < Math.min(candidates.length, MAX_LEADS)) {
        const delay = randomDelay();
        log(`  Aguardando ${Math.round(delay / 1000)}s antes do próximo...`);
        await sleep(delay);
      }
    } catch (err) {
      log(`  [ERRO] ${contact.whatsapp}: ${err.message}`);
    }
  }

  log(`=== checkup-vacuum concluído: ${processed} lead(s) reengajados ===`);
}

main().catch(err => {
  log(`[FATAL] ${err.message}`);
  process.exit(1);
});
