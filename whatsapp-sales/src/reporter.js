/**
 * Gera relatório diário da campanha.
 * Salva em data/reports/YYYY-MM-DD.json e envia resumo ao dono via WhatsApp.
 */
const fs   = require('fs');
const path = require('path');

const REPORTS_DIR   = path.join(__dirname, '..', 'data', 'reports');
const OWNER_WHATSAPP = process.env.OWNER_WHATSAPP || '';

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function buildStats(db) {
  const today = todayStr();
  const sentToday   = (db.sentLog || []).filter(e => e.sentAt.startsWith(today));
  const newToday    = sentToday.filter(e => e.step === 1);
  const followToday = sentToday.filter(e => e.step > 1 && e.step !== 'negotiation');
  const replySent   = sentToday.filter(e => e.step === 'negotiation');

  const total      = db.contacts.length;
  const responded  = db.contacts.filter(c => c.responded).length;
  // Conta apenas leads com status=negotiating explícito (não inclui step_X_sent que ainda não responderam)
  const negotiatingContacts = db.contacts.filter(c => c.status === 'negotiating');
  const negotiating = negotiatingContacts.length;
  const meetings   = db.contacts.filter(c => c.status === 'meeting_scheduled').length;
  const closedWon  = db.contacts.filter(c => c.negotiationStage === 'closed_won').length;
  const completed  = db.contacts.filter(c => c.status === 'completed').length;

  // meetingsToday: reuniões MARCADAS hoje (data em que o lead aceitou), não a data da reunião
  const meetingsToday = db.contacts.filter(c =>
    c.meetingScheduledAt && c.meetingScheduledAt.startsWith(today)
  ).length;

  const respondedToday = db.contacts.filter(c =>
    c.respondedAt && c.respondedAt.startsWith(today)
  ).length;

  // Nomes dos leads em negociação para o relatório
  const negotiatingNames = negotiatingContacts.map(c => c.nome || c.whatsapp);

  return {
    date:              today,
    generatedAt:       new Date().toISOString(),
    sentToday:         sentToday.length,
    newContactsToday:  newToday.length,
    followUpsToday:    followToday.length,
    repliesSentToday:  replySent.length,
    respondedToday:    respondedToday,
    meetingsToday:     meetingsToday,
    totalContacts:     total,
    responded:         responded,
    negotiating:       negotiating,
    negotiatingNames,
    meetingsTotal:     meetings,
    closedWon:         closedWon,
    sequenceCompleted: completed,
  };
}

function formatWhatsAppMessage(stats) {
  const nomes = (stats.negotiatingNames || [])
    .map((n, i) => `${i + 1}. ${n}`)
    .join('\n');

  const lines = [
    `Relatorio Carbon Films ${stats.date}`,
    ``,
    `Disparos hoje: ${stats.sentToday} (${stats.newContactsToday} novos + ${stats.followUpsToday} follow-ups)`,
    `Respostas recebidas hoje: ${stats.respondedToday}`,
    `Reunioes agendadas hoje: ${stats.meetingsToday}`,
    ``,
    `Acumulado total:`,
    `Em negociacao: ${stats.negotiating}`,
    `Reunioes marcadas: ${stats.meetingsTotal}`,
    `Fechamentos: ${stats.closedWon}`,
    `Total na campanha: ${stats.totalContacts}`,
    `Sequencia completa (30d): ${stats.sequenceCompleted}`,
    ``,
    `Leads em negociacao:`,
    nomes || `Nenhum`,
  ];
  return lines.join('\n');
}

function alreadySentToday() {
  const reportPath = path.join(REPORTS_DIR, `${todayStr()}.json`);
  if (!fs.existsSync(reportPath)) return false;
  try {
    const data = JSON.parse(fs.readFileSync(reportPath));
    return !!data.sentViaWhatsAppAt;
  } catch { return false; }
}

async function generateReport(db, evolutionSendText, { force = false } = {}) {
  const stats = buildStats(db);

  if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const reportPath = path.join(REPORTS_DIR, `${stats.date}.json`);

  // Guarda: só envia uma vez por dia via WhatsApp
  if (!force && alreadySentToday()) {
    console.log('[reporter] Relatório já enviado hoje — ignorando.');
    return stats;
  }

  let existing = {};
  if (fs.existsSync(reportPath)) {
    try { existing = JSON.parse(fs.readFileSync(reportPath)); } catch { /* ignore */ }
  }

  console.log('\n' + '='.repeat(50));
  console.log(`RELATORIO ${stats.date}`);
  console.log(`Disparos hoje    : ${stats.sentToday} (${stats.newContactsToday} novos / ${stats.followUpsToday} follow-ups)`);
  console.log(`Respostas hoje   : ${stats.respondedToday}`);
  console.log(`Reunioes hoje    : ${stats.meetingsToday}`);
  console.log(`Em negociacao    : ${stats.negotiating}`);
  console.log(`Reunioes total   : ${stats.meetingsTotal}`);
  console.log(`Fechamentos      : ${stats.closedWon}`);
  console.log(`Total campanha   : ${stats.totalContacts}`);
  console.log('='.repeat(50) + '\n');

  if (evolutionSendText && OWNER_WHATSAPP) {
    // Grava o marcador ANTES de enviar — previne duplo disparo mesmo se o processo reiniciar
    stats.sentViaWhatsAppAt = new Date().toISOString();
    fs.writeFileSync(reportPath, JSON.stringify({ ...existing, ...stats }, null, 2));
    try {
      await evolutionSendText(OWNER_WHATSAPP, formatWhatsAppMessage(stats));
      console.log('[reporter] Relatorio enviado para', OWNER_WHATSAPP);
    } catch (err) {
      console.error('[reporter] Erro ao enviar relatorio:', err.message);
    }
    return stats;
  }

  fs.writeFileSync(reportPath, JSON.stringify({ ...existing, ...stats }, null, 2));
  return stats;
}

module.exports = { generateReport, buildStats };
