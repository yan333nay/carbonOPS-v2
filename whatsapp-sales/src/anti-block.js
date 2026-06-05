/**
 * Proteções anti-bloqueio do WhatsApp.
 *
 * Lições do bloqueio de 26/05/2026:
 *   - 76 msgs em um dia (20/21 mai) com pico de 40 msgs/hora causou o ban
 *   - Limites no .env estavam corretos mas o processo antigo usava defaults maiores
 *   - Falta de limite por hora permitia rajadas concentradas
 *
 * Novos limites conservadores:
 *   DAILY_NEW_CONTACTS  — novos contatos (step 1) por dia        [padrão: 15]
 *   DAILY_TOTAL_LIMIT   — total de mensagens no dia               [padrão: 35]
 *   HOURLY_LIMIT        — máximo de mensagens por hora            [padrão: 8]
 *   HOURLY_NEW_LIMIT    — máximo de novos contatos por hora       [padrão: 5]
 *
 * Delays muito mais humanizados:
 *   Entre mensagens: 3min–8min (aleatório)
 *   Após rajada de 3 msgs seguidas: pausa extra de 5–10min
 *
 * Janela horária restrita: 9h–11h30 e 16h–19h BRT (reduzida)
 * Só seg–sex.
 */

const DAILY_NEW_CONTACTS = parseInt(process.env.DAILY_NEW_CONTACTS) || 15;
const DAILY_TOTAL_LIMIT  = parseInt(process.env.DAILY_TOTAL_LIMIT)  || 35;
const HOURLY_LIMIT       = parseInt(process.env.HOURLY_LIMIT)       || 8;
const HOURLY_NEW_LIMIT   = parseInt(process.env.HOURLY_NEW_LIMIT)   || 5;

// Delay base entre mensagens: 3min–8min
const DELAY_MIN_MS = 3 * 60 * 1000;
const DELAY_MAX_MS = 8 * 60 * 1000;

// Pausa extra após 3 envios consecutivos: 5min–10min
const BURST_THRESHOLD  = 3;
const BURST_PAUSE_MIN  = 5 * 60 * 1000;
const BURST_PAUSE_MAX  = 10 * 60 * 1000;

// Janelas BRT reduzidas — evita concentração de horário
const PEAK_WINDOWS = [
  { start: 9,  end: 11 },   // manhã: 9h–11h BRT
  { start: 16, end: 19 },   // tarde: 16h–19h BRT
];

function randomDelay() {
  return DELAY_MIN_MS + Math.floor(Math.random() * (DELAY_MAX_MS - DELAY_MIN_MS));
}

// Pausa extra quando envia muitas mensagens seguidas
function burstPause() {
  return BURST_PAUSE_MIN + Math.floor(Math.random() * (BURST_PAUSE_MAX - BURST_PAUSE_MIN));
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function brtHour() {
  return (new Date().getUTCHours() - 3 + 24) % 24;
}

function isBusinessHour() {
  const now   = new Date();
  const hour  = brtHour();
  const day   = now.getUTCDay(); // 0=Dom, 6=Sab
  if (day === 0 || day === 6) return false;
  return PEAK_WINDOWS.some(w => hour >= w.start && hour < w.end);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function currentHourStr() {
  // "2026-05-26T12" — prefixo para filtrar sentLog por hora
  return new Date().toISOString().slice(0, 13);
}

function countSentToday(db, stepFilter) {
  const today = todayStr();
  const log = (db.sentLog || []).filter(e => e.sentAt.startsWith(today));
  if (stepFilter !== undefined) return log.filter(e => e.step === stepFilter).length;
  return log.length;
}

function countSentThisHour(db, stepFilter) {
  const hour = currentHourStr();
  const log = (db.sentLog || []).filter(e => e.sentAt.startsWith(hour));
  if (stepFilter !== undefined) return log.filter(e => e.step === stepFilter).length;
  return log.length;
}

function canSend(db, isNewContact = false) {
  if (!isBusinessHour()) {
    const h = brtHour();
    return { ok: false, reason: `fora da janela de envio (${h}h BRT — janelas: 9h-11h e 16h-19h, seg-sex)` };
  }

  // Limite diário total
  const totalToday = countSentToday(db);
  if (totalToday >= DAILY_TOTAL_LIMIT) {
    return { ok: false, reason: `limite diário total atingido (${totalToday}/${DAILY_TOTAL_LIMIT})` };
  }

  // Limite por hora
  const totalHour = countSentThisHour(db);
  if (totalHour >= HOURLY_LIMIT) {
    return { ok: false, reason: `limite por hora atingido (${totalHour}/${HOURLY_LIMIT} nesta hora)` };
  }

  if (isNewContact) {
    // Limite diário de novos
    const newToday = countSentToday(db, 1);
    if (newToday >= DAILY_NEW_CONTACTS) {
      return { ok: false, reason: `limite diário de novos atingido (${newToday}/${DAILY_NEW_CONTACTS})` };
    }
    // Limite por hora de novos
    const newHour = countSentThisHour(db, 1);
    if (newHour >= HOURLY_NEW_LIMIT) {
      return { ok: false, reason: `limite por hora de novos atingido (${newHour}/${HOURLY_NEW_LIMIT} nesta hora)` };
    }
  }

  return { ok: true };
}

module.exports = {
  randomDelay,
  burstPause,
  sleep,
  isBusinessHour,
  canSend,
  countSentToday,
  countSentThisHour,
  DAILY_NEW_CONTACTS,
  DAILY_TOTAL_LIMIT,
  HOURLY_LIMIT,
  HOURLY_NEW_LIMIT,
  BURST_THRESHOLD,
};
