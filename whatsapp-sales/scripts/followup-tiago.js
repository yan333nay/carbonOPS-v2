#!/usr/bin/env node
require('dotenv').config({ path: __dirname + '/../.env' });
const { sendText } = require('../src/evolution');
const { loadDB, saveDB } = require('../src/campaign');

(async () => {
  const db = loadDB();
  const tiago = db.contacts.find(c => c.whatsapp === '554899841983');
  if (!tiago) { console.log('[followup-tiago] Contato não encontrado'); process.exit(0); }

  if (tiago.status === 'meeting_scheduled' || tiago.status === 'closed_won') {
    console.log('[followup-tiago] Tiago já converteu — lembrete ignorado');
    process.exit(0);
  }

  const msg = 'Oi Tiago, tudo bem? Passando pra lembrar que ficamos de conversar essa semana. Quando tiver um tempinho me chama que estou disponivel. Abraco!';
  await sendText('554899841983', msg);
  console.log('[followup-tiago] Lembrete enviado');

  tiago.conversationHistory.push({ role: 'assistant', content: msg });
  saveDB(db);
})().catch(err => {
  console.error('[followup-tiago] Erro:', err.message);
  process.exit(1);
});
