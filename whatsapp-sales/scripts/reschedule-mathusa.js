#!/usr/bin/env node
/**
 * Envia mensagem de remarcação para Mathusa Avanci.
 * A reunião original (13h de 21/05) ficou fora da janela permitida.
 * Este script é executado uma única vez via crontab em 22/05 às 09:30 BRT.
 */
require('dotenv').config({ path: __dirname + '/../.env' });

const { loadDB, saveDB }    = require('../src/campaign');
const { sendText }          = require('../src/evolution');
const { getAvailableSlots } = require('../src/calendar');

const MATHUSA_WHATSAPP = '5547992249187';

async function run() {
  const db      = loadDB();
  const contact = db.contacts.find(c => c.whatsapp === MATHUSA_WHATSAPP);

  if (!contact) {
    console.log('[reschedule] Mathusa não encontrada no DB.');
    process.exit(0);
  }

  // Garante idempotência — não enviar duas vezes
  if (contact.rescheduleSent) {
    console.log('[reschedule] Mensagem de remarcação já enviada. Saindo.');
    process.exit(0);
  }

  let slots = [];
  try {
    slots = await getAvailableSlots(2);
  } catch (err) {
    console.error('[reschedule] Erro ao buscar slots:', err.message);
  }

  const slot1 = slots[0]?.texto || 'hoje às 15:30';
  const slot2 = slots[1]?.texto || 'amanhã às 17:00';

  const fragmentos = [
    `Bom dia Mathusa, tudo bem?`,
    `Me desculpe por ontem. Surgiu um imprevisto de última hora e precisei reorganizar toda a minha agenda. Não pude avisar a tempo.`,
    `Podemos remarcar nossa conversa? Tenho disponibilidade ${slot1} ou ${slot2}. Qual funciona melhor pra você?`,
  ];

  console.log(`[reschedule] Enviando remarcação para Mathusa...`);

  for (let i = 0; i < fragmentos.length; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, 4000 + Math.random() * 3000));
    await sendText(MATHUSA_WHATSAPP, fragmentos[i]);
    console.log(`[reschedule] Fragmento ${i + 1}/${fragmentos.length} enviado.`);
  }

  // Atualiza status para negociando — webhook vai assumir a partir da resposta dela
  contact.status           = 'negotiating';
  contact.responded        = true;
  contact.rescheduleSent   = true;
  contact.negotiationStage = 'meeting_proposed';
  contact.conversationHistory.push({
    role:    'assistant',
    content: fragmentos.join('|||'),
  });
  saveDB(db);

  console.log('[reschedule] Status atualizado para negotiating. Aguardando resposta da Mathusa.');
}

run().catch(err => {
  console.error('[reschedule] Erro fatal:', err.message);
  process.exit(1);
});
