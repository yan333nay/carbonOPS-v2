/**
 * Script one-time: adiciona Flávio Suhre (JDL Imóveis) ao DB e envia resposta.
 * Ele entrou em contato hoje como inbound mas não foi respondido por falta de mapeamento de LID.
 */
require('dotenv').config({ path: __dirname + '/../.env' });
const { loadDB, saveDB } = require('../src/campaign');
const { sendText, lookupPhoneFromLid } = require('../src/evolution');
const { generateReply } = require('../src/negotiation');

const FLAVIO_LID = '253411710750838@lid';
const FLAVIO_MSG = 'Boa tarde Yan da Carbon Films! Eu sou Flávio Suhre, da JDL Imóveis. Vi que você entrou em contato conosco e fiquei curioso sobre o que a Carbon Films faz.';

async function run() {
  const db = loadDB();

  const jaExiste = db.contacts.find(c => c.lid === FLAVIO_LID || c.nome === 'Flávio Suhre (JDL Imóveis)');
  if (jaExiste) {
    console.log('Flávio já no DB:', jaExiste.nome, jaExiste.status);
    return;
  }

  const phone = await lookupPhoneFromLid(FLAVIO_LID).catch(() => null);
  const whatsapp = phone || FLAVIO_LID;
  console.log(`Flávio phone: ${phone || 'não resolvido, usando LID'}`);

  const contact = {
    whatsapp,
    nome: 'Flávio Suhre (JDL Imóveis)',
    siteUrl: 'https://jdlimoveis.com.br/',
    status: 'negotiating',
    nextStep: 999,
    responded: true,
    negotiationStage: 'initial_reply',
    respondedAt: new Date().toISOString(),
    conversationHistory: [],
    addedAt: new Date().toISOString(),
    messagesLog: [],
    lid: FLAVIO_LID,
    source: 'inbound',
  };

  db.contacts.push(contact);
  saveDB(db);
  console.log('Contato criado:', contact.nome);

  const result = await generateReply(contact, FLAVIO_MSG, db);
  if (!result) { console.error('generateReply retornou null'); return; }

  console.log('Fragmentos:', result.fragments);

  for (let i = 0; i < result.fragments.length; i++) {
    if (i > 0) await new Promise(r => setTimeout(r, 2000 + Math.random() * 1500));
    const res = await sendText(whatsapp, result.fragments[i]);
    console.log(`[${i+1}/${result.fragments.length}] → "${result.fragments[i].substring(0, 70)}"`, res?.key?.id ? 'OK' : res);
  }

  console.log('Resposta enviada para Flávio Suhre.');
}

run().catch(console.error);
