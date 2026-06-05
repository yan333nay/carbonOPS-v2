/**
 * Orquestrador da campanha de follow-up.
 * Gerencia campaign-db.json: adiciona contatos, agenda follow-ups,
 * respeita limites separados para novos contatos e total diário.
 */
const fs   = require('fs');
const path = require('path');
const { buildMessage, buildFragments, getDelayDays, TOTAL_STEPS } = require('./sequences');
const { randomDelay, burstPause, sleep, canSend, countSentToday, countSentThisHour, BURST_THRESHOLD } = require('./anti-block');
const { updateLeadStatus } = require('./crm-update');
const { hasYellowLabel } = require('./evolution');

const DB_PATH = path.join(__dirname, '..', 'data', 'campaign-db.json');

function loadDB() {
  if (!fs.existsSync(DB_PATH)) return { contacts: [], sentLog: [] };
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function saveDB(db) {
  // Lê a versão mais recente em disco antes de salvar para preservar campos
  // adicionados por outros processos (webhook: lid, lid-mapeamentos, closed_bot etc.)
  let current = { contacts: [], sentLog: [] };
  try { current = JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch { /* primeiro save */ }

  // Preserva campos extras de cada contato que estejam no disco mas não no objeto em memória
  const preserved = ['lid', 'closed_bot', 'botDetectedAt', 'meetingDate', 'meetLink', 'meetingScheduledAt', 'negotiationStage', 'emailNotified', 'turnCount'];
  for (const c of db.contacts) {
    // Prefere match por LID (contato exato) antes de match por telefone
    const disk = (c.lid && current.contacts.find(d => d.lid === c.lid))
              || current.contacts.find(d => d.whatsapp === c.whatsapp && (!c.lid || !d.lid || d.lid === c.lid));
    if (disk) {
      for (const field of preserved) {
        if (disk[field] !== undefined && c[field] === undefined) {
          c[field] = disk[field];
        }
      }
      // Preserva status de fechamento apenas para o mesmo contato exato (mesmo LID ou sem LID)
      const PRESERVE_STATUSES = new Set([
        'closed_bot', 'closed_won', 'closed_lost', 'closed_email', 'closed_menu',
        'closed_decisor', 'closed_sem_resposta', 'meeting_scheduled', 'material_sent', 'completed',
      ]);
      const sameLid = !c.lid || !disk.lid || c.lid === disk.lid;
      if (sameLid && PRESERVE_STATUSES.has(disk.status)) {
        c.status          = disk.status;
        c.nextStep        = disk.nextStep || 999;
        c.responded       = disk.responded;
        c.negotiationStage = disk.negotiationStage;
      }
    }
  }

  // Acumula sentLog sem duplicar
  const existingKeys = new Set((current.sentLog || []).map(e => e.whatsapp + e.sentAt));
  for (const entry of (db.sentLog || [])) {
    const key = entry.whatsapp + entry.sentAt;
    if (!existingKeys.has(key)) {
      current.sentLog = current.sentLog || [];
      current.sentLog.push(entry);
      existingKeys.add(key);
    }
  }
  db.sentLog = current.sentLog;

  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function syncContacts(db, crmContacts) {
  const known = new Set(db.contacts.map(c => c.whatsapp));
  let added = 0;
  for (const c of crmContacts) {
    if (!known.has(c.whatsapp)) {
      db.contacts.push({
        whatsapp:           c.whatsapp,
        nome:               c.nome,
        siteUrl:            c.siteUrl || '',
        nicho:              c.nicho   || 'imobiliarias',
        status:             'pending',
        nextStep:           1,
        nextSendAt:         new Date().toISOString(),
        responded:          false,
        negotiationStage:   null,
        conversationHistory: [],
        addedAt:            new Date().toISOString(),
        messagesLog:        [],
      });
      added++;
    }
  }
  if (added > 0) {
    saveDB(db);
    console.log(`[campaign] ${added} novos contatos adicionados à campanha`);
  }
  return db;
}

// Chamado quando o lead responde — pausa a sequência automática e entra em negociação
function markResponded(whatsapp) {
  const db = loadDB();
  const c = db.contacts.find(c => c.whatsapp === whatsapp);
  if (c && !c.responded) {
    c.responded          = true;
    c.status             = 'negotiating';
    c.negotiationStage   = 'initial_reply';
    c.respondedAt        = new Date().toISOString();
    saveDB(db);
    console.log(`[campaign] ${whatsapp} respondeu — iniciando negociação`);
    return true; // sinaliza que é uma nova resposta
  }
  return false; // já estava em negociação
}

const CLOSED_STATUSES = new Set(['completed', 'closed_bot', 'closed_won', 'closed_lost', 'closed_menu', 'menu_bot', 'closed_email', 'closed_decisor', 'closed_sem_resposta', 'material_sent', 'meeting_scheduled']);

function getDueContacts(db) {
  const now = new Date();
  const due = db.contacts.filter(c =>
    !c.responded &&
    !CLOSED_STATUSES.has(c.status) &&
    c.nextStep <= TOTAL_STEPS &&
    new Date(c.nextSendAt) <= now
  );

  // Round-robin entre nichos para garantir distribuição justa
  const byNicho = {};
  for (const c of due) {
    const n = c.nicho || 'imobiliarias';
    if (!byNicho[n]) byNicho[n] = [];
    byNicho[n].push(c);
  }

  const result = [];
  const nichos = Object.keys(byNicho);
  let i = 0;
  while (result.length < due.length) {
    const nicho = nichos[i % nichos.length];
    if (byNicho[nicho] && byNicho[nicho].length > 0) {
      result.push(byNicho[nicho].shift());
    } else {
      nichos.splice(i % nichos.length, 1);
      if (nichos.length === 0) break;
      continue;
    }
    i++;
  }
  return result;
}

// Envia mensagens de sequência (pré-resposta), respeitando ambos os limites diários
async function runCycle(client, db) {
  const check = canSend(db);
  if (!check.ok) {
    console.log(`[campaign] Pausado: ${check.reason}`);
    return 0;
  }

  const due = getDueContacts(db);
  if (due.length === 0) {
    console.log(`[campaign] Nenhuma mensagem de sequência pendente`);
    return 0;
  }

  console.log(`[campaign] ${due.length} contato(s) na fila | Hoje: ${countSentToday(db)} msgs / ${countSentToday(db, 1)} novos | Hora: ${countSentThisHour(db)}`);

  let sent = 0;
  let sentThisCycle = 0;
  for (const contact of due) {
    const isNew = contact.nextStep === 1;
    const check2 = canSend(db, isNew);
    if (!check2.ok) {
      console.log(`[campaign] Limite: ${check2.reason}`);
      break;
    }

    const fragments = buildFragments(contact.nextStep, contact.nome, contact.nicho, contact.whatsapp, db);
    if (!fragments.length) continue;

    // Etiqueta amarela = lead pausado, pular e não contar como enviado
    const yellowLabel = await hasYellowLabel(contact.whatsapp).catch(() => false);
    if (yellowLabel) {
      console.log(`[campaign] ${contact.nome} — etiqueta amarela, pulando`);
      continue;
    }

    const chatId = `${contact.whatsapp}@c.us`;

    try {
      let lastResult = null;
      for (let fi = 0; fi < fragments.length; fi++) {
        if (fi > 0) {
          // Delay entre fragmentos: simula digitação (1,5s–4s)
          const delay = 1500 + Math.min(fragments[fi].length * 35, 3000) + Math.random() * 800;
          await new Promise(r => setTimeout(r, delay));
        }
        lastResult = await client.sendMessage(chatId, fragments[fi]);
        // Falha explícita se a API não confirmou entrega
        if (!lastResult || !lastResult.key) {
          throw new Error(`API não confirmou fragmento ${fi + 1}/${fragments.length}: ${JSON.stringify(lastResult)}`);
        }
      }
      // Armazena o remoteJid real retornado pelo WhatsApp
      if (lastResult?.key?.remoteJid) {
        contact.remoteJid = lastResult.key.remoteJid;
      }

      // Só registra log e atualiza status APÓS confirmação de todos os fragmentos
      console.log(`[campaign] Step ${contact.nextStep} → ${contact.nome} (${contact.whatsapp}) — ${fragments.length} fragmentos`);
      sent++;
      sentThisCycle++;
      if (contact.nextStep === 1) {
        updateLeadStatus(contact.whatsapp, 'CONTATADO', 'step 1').catch(() => {});
      }

      const text = fragments.join('\n');
      const entry = { step: contact.nextStep, sentAt: new Date().toISOString(), text };
      contact.messagesLog.push(entry);
      db.sentLog = db.sentLog || [];
      db.sentLog.push({ whatsapp: contact.whatsapp, step: contact.nextStep, sentAt: entry.sentAt });

      // Agenda próximo passo
      contact.nextStep++;
      if (contact.nextStep > TOTAL_STEPS) {
        // Sem resposta após initial + follow-up único → encerra
        contact.status  = 'closed_sem_resposta';
        contact.closedAt = new Date().toISOString();
        contact.closedReason = 'sem resposta após follow-up único';
        console.log(`[campaign] Sem resposta após sequência: ${contact.nome} → closed_sem_resposta`);
      } else {
        const delayDays = getDelayDays(contact.nextStep);
        const next = new Date();
        next.setDate(next.getDate() + delayDays);
        next.setUTCHours(12, 0, 0, 0); // 9h BRT
        contact.nextSendAt = next.toISOString();
        contact.status = `step_${contact.nextStep - 1}_sent`;
      }

      saveDB(db);
    } catch (err) {
      console.error(`[campaign] Erro ao enviar para ${contact.whatsapp}:`, err.message);
    }

    // Pausa extra após BURST_THRESHOLD envios consecutivos — evita rajada
    if (sentThisCycle > 0 && sentThisCycle % BURST_THRESHOLD === 0) {
      const pause = burstPause();
      console.log(`[campaign] Pausa anti-rajada ${Math.round(pause / 60000)}min após ${sentThisCycle} envios...`);
      await sleep(pause);
    } else {
      const delay = randomDelay();
      console.log(`[campaign] Delay ${Math.round(delay / 1000)}s...`);
      await sleep(delay);
    }
  }

  return sent;
}

module.exports = { loadDB, saveDB, syncContacts, markResponded, runCycle, getDueContacts };
