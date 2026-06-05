#!/usr/bin/env node
/**
 * Servidor de webhook da Evolution API.
 * - Debounce: agrupa mensagens enviadas em até 4s em uma única resposta
 * - Áudio: transcreve via OpenAI Whisper antes de processar
 * - Fragmentação: envia resposta em 2-3 blocos com delay de digitação
 * Porta: 3001
 */
require('dotenv').config({ path: __dirname + '/.env' });

const express = require('express');
const { loadDB, markResponded, saveDB, syncContacts } = require('./src/campaign');
const { generateReply }                 = require('./src/negotiation');
const { sendText, sendDocument, extractNumber, phoneVariants, lookupPhoneFromLid, hasYellowLabel } = require('./src/evolution');
const { createMeetingEvent, parseAgendarSignal } = require('./src/calendar');
const { transcribeAudio, isAudioMessage }        = require('./src/transcribe');
const { updateLeadStatus }                       = require('./src/crm-update');
const { extractNewPhones }                       = require('./src/phone-extractor');
const { buildFragments }                         = require('./src/sequences');

const OWNER        = process.env.OWNER_WHATSAPP || '';
const DEBOUNCE_MS  = 6000; // aguarda 6s por mais mensagens do mesmo contato

const app  = express();
const PORT = 3001;

process.on('uncaughtException', (err) => {
  console.error(`[webhook] ERRO FATAL — reiniciando em 3s:`, err.message);
  setTimeout(() => process.exit(1), 3000);
});
process.on('unhandledRejection', (reason) => {
  console.error(`[webhook] Promise rejeitada:`, reason);
});

app.use(express.json({ limit: '10mb' }));

// ─── Fila de debounce por contato ────────────────────────────────────────────
// messageQueues[jid] = { timer, parts: ["texto1", "texto2", ...], msgData }
const messageQueues = {};

// Delay humanizado entre fragmentos de mensagem
function typingDelay(text) {
  const len = (text || '').length;
  const base = len <= 60  ? 2500 :
               len <= 150 ? 4500 :
               len <= 300 ? 8000 : 14000;
  const jitter = Math.random() * 2000;
  return base + jitter;
}

/**
 * Estratégia de resolução automática: para cada contato sem LID que foi
 * contactado recentemente, consulta o endpoint whatsappNumbers com o número
 * e compara o JID canônico retornado com o LID recebido.
 * Funciona porque o Evolution guarda internamente o JID verdadeiro do contato.
 */
async function resolveByCanonicalJid(db, incomingLid) {
  const BASE = process.env.EVOLUTION_URL;
  const KEY  = process.env.EVOLUTION_API_KEY;
  const INST = process.env.EVOLUTION_INSTANCE;

  // Candidatos: leads contactados mas ainda sem LID
  const candidatos = db.contacts.filter(c => !c.lid && c.messagesLog?.length > 0);
  if (candidatos.length === 0) return null;

  // Consulta em lote para eficiência (até 20 por vez)
  const lote = candidatos.slice(0, 20).map(c => c.whatsapp);
  try {
    const r = await fetch(`${BASE}/chat/whatsappNumbers/${INST}`, {
      method: 'POST',
      headers: { apikey: KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ numbers: lote }),
    });
    const dados = await r.json();
    if (!Array.isArray(dados)) return null;

    for (const item of dados) {
      if (!item.exists) continue;
      // O JID retornado pode ser phone@s.whatsapp.net OU lid@lid
      const jidRetornado = item.jid || '';
      if (jidRetornado === incomingLid) {
        // Match direto pelo JID
        return candidatos.find(c => c.whatsapp === item.number);
      }
      // Guarda o JID retornado para futuras comparações (pré-mapeamento)
      const c = candidatos.find(c => c.whatsapp === item.number);
      if (c && jidRetornado && jidRetornado !== `${item.number}@s.whatsapp.net`) {
        c.canonicalJid = jidRetornado; // pode ser o LID
        if (jidRetornado === incomingLid) return c;
      }
    }
  } catch (err) {
    console.error('[resolveByCanonicalJid] Erro:', err.message);
  }
  return null;
}

// Resolve contato pelo JID (suporta @lid, variação de 8/9 dígitos, remoteJid)
// Quando o LID é desconhecido, tenta resolver via Evolution API (async).
async function resolveContact(db, jid) {
  const isLid = jid.endsWith('@lid');
  const rawId = jid.replace(/@lid$/, '').replace(/@s\.whatsapp\.net$/, '').replace(/@c\.us$/, '');

  if (isLid) {
    // 1ª: LID já mapeado localmente
    const byLid = db.contacts.find(c => c.lid === jid);
    if (byLid) return byLid;

    // 2ª: canonicalJid pré-salvo
    const byCanonical = db.contacts.find(c => c.canonicalJid === jid);
    if (byCanonical) { byCanonical.lid = jid; return byCanonical; }

    // 3ª: busca via Evolution API (lookupPhoneFromLid)
    const phone = await lookupPhoneFromLid(jid).catch(() => null);
    if (phone) {
      const variants = phoneVariants(phone);
      const byPhone  = db.contacts.find(c => variants.includes(c.whatsapp));
      if (byPhone)  { byPhone.lid = jid; return byPhone; }
      const byRemote = db.contacts.find(c => c.remoteJid && variants.some(v => c.remoteJid.includes(v)));
      if (byRemote) { byRemote.lid = jid; return byRemote; }
    }

    // 4ª: batch lookup — checa se algum número pendente tem esse JID como canônico
    try {
      const { phoneVariants: pv } = require('./src/evolution');
      const candidatos = db.contacts.filter(c => !c.lid && c.whatsapp && !c.whatsapp.endsWith('@lid'));
      const lote = [...new Set(candidatos.flatMap(c => phoneVariants(c.whatsapp)))].slice(0, 50);
      if (lote.length > 0) {
        const BASE = process.env.EVOLUTION_URL;
        const KEY  = process.env.EVOLUTION_API_KEY;
        const INST = process.env.EVOLUTION_INSTANCE;
        const r    = await fetch(`${BASE}/chat/whatsappNumbers/${INST}`, {
          method: 'POST',
          headers: { apikey: KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ numbers: lote }),
        });
        const dados = await r.json();
        if (Array.isArray(dados)) {
          for (const item of dados) {
            if (!item.exists) continue;
            const jidRetornado = item.jid || '';
            const c = candidatos.find(c => phoneVariants(c.whatsapp).includes(item.number));
            if (c) {
              // Salva JID canônico para futuras mensagens
              c.canonicalJid = jidRetornado;
              if (jidRetornado === jid) { c.lid = jid; return c; }
            }
          }
        }
      }
    } catch { /* ignora erros de rede no batch */ }

  } else {
    const variants = phoneVariants(rawId);
    const byPhone  = db.contacts.find(c => variants.includes(c.whatsapp));
    if (byPhone) return byPhone;
    const byRemote = db.contacts.find(c => c.remoteJid && c.remoteJid.includes(rawId));
    if (byRemote) return byRemote;
  }
  return null;
}

// Retorna saudação correta baseada no horário BRT atual
function saudacaoBRT() {
  const hora = (new Date().getUTCHours() - 3 + 24) % 24;
  if (hora >= 5 && hora < 12) return 'Bom dia';
  if (hora >= 12 && hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

/**
 * Classifica o tipo de resposta recebida:
 * - 'human'           : mensagem de pessoa real — responder normalmente
 * - 'no_interest'     : sem interesse explícito — fechar com resposta simpática
 * - 'has_mkt_team'    : tem time de marketing — fechar com tchau simpático
 * - 'greeting_only'   : só saudação — responder com saudação e aguardar
 * - 'welcome'         : auto-resposta de boas-vindas — aguardar humano
 * - 'menu_bot'        : bot de menu numerado — tentar furar para humano
 * - 'ai_bot'          : bot de IA — encerrar sem responder
 */
function classifyMessage(text) {
  const norm = text.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  // Menu numerado
  if (/mensagem inv[aá]lida|escolha uma das opcoes|digite \d|opcao \d|menu( principal)?/i.test(text)) {
    return 'menu_bot';
  }

  // Auto-resposta de boas-vindas
  if (
    /seja bem.vind[oa]/i.test(text) ||
    /em breve dar(emos|ei) sequencia/i.test(text) ||
    /retornaremos em breve/i.test(text) ||
    /fora do (nosso )?horario/i.test(text) ||
    /horario de atendimento/i.test(text) ||
    /nossa equipe (ira|vai|entrara) entrar em contato/i.test(norm) ||
    /em instantes.{0,30}(especialista|consultor|atendente)/i.test(norm) ||
    /que bom ter voce aqui/i.test(norm)
  ) {
    return 'welcome';
  }

  // Bot redirecionando para decisor — "entre em contato pelo número X / WhatsApp X"
  if (
    /(para conversar|para tratar|para detalhes|para parceria|para negocia).{0,60}(numero|whatsapp|contato)/i.test(norm) ||
    /ideal.{0,30}(entrar em contato|falar).{0,40}(numero|whatsapp)/i.test(norm) ||
    /encaminh.{0,30}(para|ao).{0,30}(setor|departamento|responsavel|gerente|diretor)/i.test(norm) ||
    /fale (com|diretamente).{0,40}(nosso|nossa|o|a).{0,20}(gerente|diretor|responsavel|comercial)/i.test(norm)
  ) {
    return 'decisor_redirect';
  }

  // Bot de IA corporativa
  if (
    (/agradec[eo] muito (o seu|pelo) contato/i.test(norm) && /desejo (muito )?sucesso/i.test(norm)) ||
    /nao (vamos|iremos) avancar com essa pauta/i.test(norm)
  ) {
    return 'ai_bot';
  }

  // Sem interesse explícito — fechar direto
  if (
    /no momento nao (temos|tenho) interesse/i.test(norm) ||
    /nao (temos|tenho) interesse/i.test(norm) ||
    /nao estamos? interessad/i.test(norm) ||
    /nao vamos? precisar/i.test(norm) ||
    /nao ha interesse/i.test(norm) ||
    /dispensad[ao]/i.test(norm) ||
    /nao obrigad[ao]/i.test(norm)
  ) {
    return 'no_interest';
  }

  // Pediu material passivo (PDF, catálogo, apresentação, folder) — lead não quer engajar
  if (
    /(me mand[ae]|pode mandar|envi[ae]|manda[aê]).{0,30}(material|apresenta[cç][aã]o|cat[aá]logo|pdf|folder|brochure|portf[oó]lio)/i.test(text) ||
    /mand[ae].{0,15}(um|o|uma).{0,15}(material|pdf|apresenta[cç][aã]o|cat[aá]logo)/i.test(text)
  ) {
    return 'pediu_material';
  }

  // Time de marketing próprio — fechar direto
  if (
    /time de marketing/i.test(text) ||
    /equipe de marketing/i.test(text) ||
    /departamento de marketing/i.test(text) ||
    /setor de marketing/i.test(text) ||
    /agencia (de marketing|propria)/i.test(norm) ||
    /ja (temos|tenho) (uma )?agencia/i.test(norm) ||
    /nosso (proprio )?marketing/i.test(norm)
  ) {
    return 'has_mkt_team';
  }

  // Só saudação — responder educadamente e aguardar
  if (norm.length <= 60 && /^(ola|oi|bom dia|boa tarde|boa noite|tudo bem|ola tudo bem)[!?.,\s]*$/.test(norm)) {
    return 'greeting_only';
  }

  return 'human';
}

// Palavras genéricas do setor imobiliário que não servem como critério de match
const GENERIC_WORDS = new Set([
  'imoveis', 'imobiliaria', 'imobiliarios', 'imobiliaria', 'investimentos',
  'negocios', 'atendimento', 'locacao', 'vendas', 'sc', 'pr', 'rj', 'sp',
  'joinville', 'blumenau', 'florianopolis', 'curitiba', 'brasil',
]);

/**
 * Verifica se pushName bate com o nome ou domínio do site do contato.
 * Remove palavras genéricas para evitar falsos positivos.
 *
 * @param {boolean} strict - true = modo busca (tPush vazio → false, sem match)
 *                           false = modo validação (tPush vazio → true, sem conflito)
 *
 * Bug I3 Imóveis: "I3 IMÓVEIS" tokeniza para tPush=[] porque "i3" tem 2 chars
 * e "imoveis" é palavra genérica. Com strict=false (validação) retornava true
 * para QUALQUER contato, causando match falso com "Yan - Carbon Films".
 * Com strict=true (busca) retorna false → nenhum match → cria Inbound correto.
 */
function pushNameMatches(pushName, contactName, siteUrl, strict = false) {
  if (!pushName) return true;

  const tokenize = s => s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !GENERIC_WORDS.has(w));

  const tPush = tokenize(pushName);
  // strict=true (busca): pushName genérico não deve bater com ninguém
  // strict=false (validação): pushName genérico não conflita com o contato mapeado
  if (tPush.length === 0) return !strict;

  // Match pelo nome do contato
  const tContact = tokenize(contactName);
  if (tContact.length > 0) {
    const shared = tContact.filter(w => tPush.some(p => p.includes(w) || w.includes(p)));
    if (shared.length > 0) return true;
  }

  // Match pelo domínio do site (ex: "brondaniimoveis.com.br" → "brondani")
  if (siteUrl) {
    try {
      const domain = new URL(siteUrl).hostname.replace(/^www\./, '').split('.')[0];
      const tDomain = tokenize(domain);
      if (tDomain.length > 0) {
        const sharedDomain = tDomain.filter(w => tPush.some(p => p.includes(w) || w.includes(p)));
        if (sharedDomain.length > 0) return true;
      }
    } catch { /* URL inválida */ }
  }

  // Se o contato não tem palavras distintivas nem site, não dá para confirmar — suspeito
  if (tContact.length === 0 && !siteUrl) return false;

  return false;
}

// Processa todas as mensagens acumuladas de um contato
async function processQueue(jid) {
  try {
  const queue = messageQueues[jid];
  if (!queue) return;

  const { parts, msgData, pushName } = queue;
  delete messageQueues[jid];

  // Junta todas as partes em uma mensagem só
  const fullText = parts.join('\n').trim();
  if (!fullText) return;

  console.log(`[webhook] Processando ${parts.length} msg(s) de ${jid}: "${fullText.substring(0, 80)}"`);

  const db      = loadDB();
  const contact = await resolveContact(db, jid);

  if (!contact) {
    // Tenta resolução por JID canônico
    if (jid.endsWith('@lid')) {
      const mappedContact = await resolveByCanonicalJid(db, jid);
      if (mappedContact) {
        mappedContact.lid = jid;
        saveDB(db);
        console.log(`[webhook] Resolvido por JID canônico: ${jid} → ${mappedContact.nome}`);
        return processQueueWithContact(jid, fullText, mappedContact, db, pushName);
      }
      const byCanonical = db.contacts.find(c => c.canonicalJid === jid);
      if (byCanonical) {
        byCanonical.lid = jid;
        saveDB(db);
        console.log(`[webhook] Resolvido por canonicalJid cacheado: ${jid} → ${byCanonical.nome}`);
        return processQueueWithContact(jid, fullText, byCanonical, db, pushName);
      }
    }

    // Tenta match por pushName contra todos os contatos (inclusive os do DB sem LID)
    // strict=true: pushName com tokens todos genéricos (ex: "I3 IMÓVEIS") NÃO bate com ninguém
    if (pushName) {
      const byPushName = db.contacts.find(c => pushNameMatches(pushName, c.nome, c.siteUrl, true));
      if (byPushName) {
        byPushName.lid = jid.endsWith('@lid') ? jid : byPushName.lid;
        saveDB(db);
        console.log(`[webhook] Resolvido por pushName: "${pushName}" → ${byPushName.nome}`);
        return processQueueWithContact(jid, fullText, byPushName, db, pushName);
      }
    }

    // Inbound desconhecido: cria novo contato e responde normalmente
    const nomeInbound = pushName || `Inbound ${jid.slice(0, 12)}`;
    console.log(`[webhook] Novo inbound não mapeado: ${nomeInbound} (${jid}) — criando contato e respondendo`);
    const novoContato = {
      whatsapp:            jid,
      nome:                nomeInbound,
      siteUrl:             '',
      status:              'negotiating',
      nextStep:            999,
      responded:           true,
      negotiationStage:    'initial_reply',
      respondedAt:         new Date().toISOString(),
      conversationHistory: [],
      addedAt:             new Date().toISOString(),
      messagesLog:         [],
      lid:                 jid.endsWith('@lid') ? jid : undefined,
      source:              'inbound',
    };
    db.contacts.push(novoContato);
    saveDB(db);
    return processQueueWithContact(jid, fullText, novoContato, db, pushName);
  }

  // Salva mapeamento LID na primeira vez
  if (jid.endsWith('@lid') && !contact.lid) {
    contact.lid = jid;
    saveDB(db);
    console.log(`[webhook] LID mapeado: ${contact.nome} → ${jid}`);
  }

  return processQueueWithContact(jid, fullText, contact, db, pushName);
  } catch (err) {
    console.error(`[webhook] ERRO ao processar fila de ${jid}:`, err.message);
  }
}

// Núcleo de processamento — separado para reutilização após resolução de LID
// pushNameResolved=true desativa a checagem de pushName (evita recursão infinita)
async function processQueueWithContact(jid, fullText, contact, db, pushName, pushNameResolved = false) {
  // Se pushName não bate com o contato mapeado, trata como novo lead inbound
  if (!pushNameResolved && pushName && !pushNameMatches(pushName, contact.nome, contact.siteUrl)) {
    console.log(`[webhook] pushName "${pushName}" não bate com "${contact.nome}" — tratando como novo inbound`);
    const db2 = loadDB();
    const jaExiste = db2.contacts.find(c =>
      (c.source === 'inbound' && c.nome === pushName) ||
      (c.lid === jid && c.nome === pushName)
    );
    if (!jaExiste) {
      const novoContato = {
        whatsapp:            jid,
        nome:                pushName,
        siteUrl:             '',
        status:              'negotiating',
        nextStep:            999,
        responded:           true,
        negotiationStage:    'initial_reply',
        respondedAt:         new Date().toISOString(),
        conversationHistory: [],
        addedAt:             new Date().toISOString(),
        messagesLog:         [],
        lid:                 jid.endsWith('@lid') ? jid : undefined,
        source:              'inbound',
      };
      db2.contacts.push(novoContato);
      saveDB(db2);
      return processQueueWithContact(jid, fullText, novoContato, db2, pushName, true);
    }
    return processQueueWithContact(jid, fullText, jaExiste, db2, pushName, true);
  }

  // Ignora leads já encerrados (bot detectado, sem interesse, etc.)
  if (['closed_bot', 'closed_lost', 'closed_won', 'closed_email', 'closed_menu', 'closed_decisor', 'closed_sem_resposta', 'completed'].includes(contact.status)) {
    console.log(`[webhook] ${contact.nome} ignorado — status: ${contact.status}`);
    return;
  }

  // Classifica o tipo de mensagem antes de agir
  const msgType = classifyMessage(fullText);
  console.log(`[webhook] ${contact.nome} — tipo: ${msgType}`);

  if (msgType === 'welcome') {
    console.log(`[webhook] ${contact.nome} — auto-resposta de boas-vindas, aguardando humano`);
    return;
  }

  if (msgType === 'menu_bot') {
    const attempts = (contact.menuBotAttempts || 0) + 1;
    const options = ['0', '9'];
    const opcao   = options[attempts - 1];

    if (!opcao) {
      console.log(`[webhook] ${contact.nome} — menu sem saída após ${attempts - 1} tentativas, encerrando`);
      contact.menuBotAttempts = attempts;
      contact.status   = 'closed_menu';
      contact.nextStep = 999;
      saveDB(db);
      updateLeadStatus(contact.whatsapp, 'MENU_SEM_SAÍDA', 'sem acesso a humano').catch(() => {});
      return;
    }

    console.log(`[webhook] ${contact.nome} — menu_bot tentativa ${attempts}: enviando "${opcao}"`);
    try {
      await sendText(contact.whatsapp, opcao);
      // Persiste só após confirmação de envio
      contact.menuBotAttempts = attempts;
      contact.status = 'menu_bot';
      saveDB(db);
    } catch (err) {
      console.error(`[webhook] Erro ao enviar opção de menu para ${contact.nome}:`, err.message);
    }
    return;
  }

  if (msgType === 'decisor_redirect') {
    // Bot redirecionou para um número de decisor — encerra este contato e prospecta o novo número
    console.log(`[webhook] ${contact.nome} — bot redirecionou para decisor, encerrando e extraindo número`);
    contact.status           = 'closed_decisor';
    contact.negotiationStage = 'closed_decisor';
    contact.closedAt         = new Date().toISOString();
    contact.closedReason     = 'bot_redirecionou_decisor';
    contact.nextStep         = 999;
    saveDB(db);
    updateLeadStatus(contact.whatsapp, 'BOT_DECISOR', 'bot redirecionou para decisor').catch(() => {});
    // O phone-extractor vai detectar o número novo na mensagem e enviar step 1 automaticamente
    return;
  }

  if (msgType === 'ai_bot') {
    console.log(`[webhook] ${contact.nome} — bot de IA detectado, encerrando`);
    contact.status           = 'closed_bot';
    contact.negotiationStage = 'closed_bot';
    contact.botDetectedAt    = new Date().toISOString();
    contact.nextStep         = 999;
    saveDB(db);
    updateLeadStatus(contact.whatsapp, 'BOT', 'bot de IA detectado').catch(() => {});
    return;
  }

  if (msgType === 'no_interest') {
    console.log(`[webhook] ${contact.nome} — sem interesse, encerrando`);
    try { await sendText(contact.whatsapp, 'Tudo bem! Se um dia mudar de ideia, é só chamar. Abraço!'); } catch { /* ignora falha de despedida */ }
    contact.status           = 'closed_lost';
    contact.negotiationStage = 'closed_lost';
    contact.closedAt         = new Date().toISOString();
    contact.closedReason     = 'sem_interesse';
    contact.nextStep         = 999;
    saveDB(db);
    updateLeadStatus(contact.whatsapp, 'SEM_INTERESSE', 'encerrado').catch(() => {});
    return;
  }

  if (msgType === 'has_mkt_team') {
    console.log(`[webhook] ${contact.nome} — tem time de marketing, encerrando`);
    try { await sendText(contact.whatsapp, 'Entendido! Ótimo ter uma equipe dedicada. Qualquer coisa que precisarem, é só chamar. Abraço!'); } catch { /* ignora falha de despedida */ }
    contact.status           = 'closed_lost';
    contact.negotiationStage = 'closed_lost';
    contact.closedAt         = new Date().toISOString();
    contact.closedReason     = 'tem_time_marketing';
    contact.nextStep         = 999;
    saveDB(db);
    updateLeadStatus(contact.whatsapp, 'TEM_MARKETING', 'encerrado').catch(() => {});
    return;
  }

  if (msgType === 'greeting_only') {
    console.log(`[webhook] ${contact.nome} — só saudação, respondendo e aguardando`);
    try {
      await sendText(contact.whatsapp, `${saudacaoBRT()}! Tudo bem por aí?`);
    } catch { /* ignora */ }
    return;
  }

  if (msgType === 'pediu_material') {
    if (contact.materialSent) {
      console.log(`[webhook] ${contact.nome} — material já enviado, aguardando resposta.`);
      return;
    }
    console.log(`[webhook] ${contact.nome} — pediu material, enviando apresentação`);
    const PRESENTATION_PATH = '/root/carbon-ops/Apresentação Carbon Films.html';
    try {
      await sendText(contact.whatsapp, 'Claro! Preparei uma apresentação completa sobre o que a Carbon Films faz.');
      await new Promise(r => setTimeout(r, 3000));
      await sendDocument(contact.whatsapp, PRESENTATION_PATH, 'text/html');
      await new Promise(r => setTimeout(r, 3000));
      await sendText(contact.whatsapp, 'Dá uma olhada com calma e me fala o que achou. Qualquer dúvida que surgir, pode me chamar aqui.');
      // Persiste status só após confirmação de todos os envios
      contact.status           = 'material_sent';
      contact.negotiationStage = 'material_sent';
      contact.materialSent     = true;
      contact.responded        = true;
      contact.nextStep         = 999;
      saveDB(db);
      updateLeadStatus(contact.whatsapp, 'MATERIAL_ENVIADO', 'enviou apresentação Carbon Films').catch(() => {});
    } catch (err) {
      console.error(`[webhook] Falha ao enviar material para ${contact.nome}:`, err.message);
    }
    return;
  }

  // msgType === 'human' — continua para negociação normal

  const replyTo = contact.whatsapp;

  // Etiqueta amarela = lead pausado, não responder
  const yellowLabel = await hasYellowLabel(replyTo).catch(() => false);
  if (yellowLabel) {
    console.log(`[webhook] ${contact.nome} — etiqueta amarela detectada, não responder`);
    return;
  }

  // Detecção de email — notifica Yan UMA única vez por lead
  const emailDireto = fullText.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
  const pedindoEmail = /\b(meu e-?mail|pode (me )?mandar (um |o )?e-?mail|entra em contato por e-?mail)\b/i.test(fullText);
  if ((emailDireto || pedindoEmail) && !contact.emailNotified) {
    const email = emailDireto ? emailDireto[0] : '(nao encontrado — ver mensagem abaixo)';
    contact.emailNotified = true;
    saveDB(db);
    console.log(`[webhook] ${contact.nome} — email detectado: ${email}`);
    if (OWNER) {
      sendText(OWNER,
        `Email de lead\n\nLead: ${contact.nome}\nWhatsApp: +${replyTo}\nEmail: ${email}\n\nMensagem completa:\n"${fullText}"`
      ).catch(() => {});
    }
  }

  const isFirst = markResponded(replyTo);
  if (isFirst) {
    console.log(`[webhook] Primeira resposta de ${contact.nome}`);
    // Atualiza planilha: lead respondeu
    updateLeadStatus(replyTo, 'RESPONDEU', 'negociação').catch(() => {});
  }

  const freshDb      = loadDB();
  const freshContact = freshDb.contacts.find(c => c.whatsapp === replyTo);
  if (!freshContact) return;

  console.log(`[negotiation] Gerando resposta para ${freshContact.nome}...`);
  const result = await generateReply(freshContact, fullText, freshDb);
  if (!result) return;

  try {
    for (let i = 0; i < result.fragments.length; i++) {
      const frag = result.fragments[i];
      const delay = typingDelay(frag);
      console.log(`[webhook] Digitando ${Math.round(delay / 1000)}s...`);
      await new Promise(r => setTimeout(r, delay));
      await sendText(replyTo, frag);
      console.log(`[webhook] [${i + 1}/${result.fragments.length}] → ${freshContact.nome}: "${frag.substring(0, 60)}"`);
    }

    // Agendamento → Google Calendar
    if (result.shouldSchedule) {
      const parsed = parseAgendarSignal(result.rawReply);
      if (parsed) {
        console.log(`[calendar] Agendando: ${parsed.nomeLead} — ${parsed.date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
        try {
          const evento = await createMeetingEvent({
            nomeLead:     parsed.nomeLead,
            emailLead:    freshContact.email || null,
            whatsappLead: replyTo,
            startDate:    parsed.date,
          });

          const dataFmt = parsed.date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'America/Sao_Paulo' });
          const horaFmt = parsed.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });

          if (evento.meetLink) {
            await new Promise(r => setTimeout(r, 3000));
            await sendText(replyTo, `Aqui está o link da reunião:\n${evento.meetLink}\n\nTe vejo ${dataFmt} às ${horaFmt}.`);
          } else {
            // Gmail pessoal não gera Meet via API — Yan envia o link manualmente
            await new Promise(r => setTimeout(r, 3000));
            await sendText(replyTo, `Ótimo! Já bloqueei ${dataFmt} às ${horaFmt} na minha agenda. Vou te mandar o link da reunião em instantes.`);
          }

          if (OWNER) {
            const meetInfo = evento.meetLink
              ? `Meet: ${evento.meetLink}`
              : `Crie o Meet e envie para +${replyTo}`;
            await sendText(OWNER,
              `Reunião agendada\n\nLead: ${freshContact.nome}\nWhatsApp: +${replyTo}\n` +
              `Data: ${dataFmt} às ${horaFmt}\n` +
              `${meetInfo}\n` +
              `Agenda: ${evento.htmlLink}`
            );
          }

          freshContact.status             = 'meeting_scheduled';
          freshContact.meetingDate        = parsed.date.toISOString();
          freshContact.meetingScheduledAt = new Date().toISOString();
          freshContact.meetLink           = evento.meetLink || null;
          updateLeadStatus(replyTo, 'REUNIÃO', 'reunião agendada').catch(() => {});
          console.log(`[calendar] Evento criado — ${evento.meetLink || 'sem Meet link'}`);

        } catch (calErr) {
          console.error('[calendar] Erro:', calErr.message);
          if (OWNER) await sendText(OWNER, `Reunião com ${freshContact.nome}: erro no Calendar — ${calErr.message}`);
        }
      }
    }

    // Lead quente → bot tentou venda direta, notifica Yan para enviar dados de pagamento
    if (result.shouldDirectSale) {
      freshContact.status           = 'direct_sale_attempted';
      freshContact.directSaleAt     = new Date().toISOString();
      freshContact.leadTemperature  = result.temperature || 'hot';
      updateLeadStatus(replyTo, 'VENDA DIRETA', 'bot tentou fechar direto').catch(() => {});
      console.log(`[webhook] ${freshContact.nome} — venda direta tentada`);
      if (OWNER) {
        await sendText(OWNER,
          `Venda direta em andamento\n\nLead: ${freshContact.nome}\nWhatsApp: +${replyTo}\nSite: ${freshContact.siteUrl || 'ver no CRM'}\n\nEnvie os dados de pagamento (PIX / link) para fechar.`
        ).catch(() => {});
      }
    }

    // Lead disse explicitamente que não tem interesse
    if (result.rawReply && result.rawReply.includes('[CLOSED_LOST]')) {
      freshContact.status           = 'closed_lost';
      freshContact.negotiationStage = 'closed_lost';
      freshContact.closedAt         = new Date().toISOString();
      freshContact.closedReason     = 'sem interesse declarado pelo lead';
      updateLeadStatus(replyTo, 'SEM INTERESSE', 'lead declarou sem interesse').catch(() => {});
      console.log(`[webhook] ${freshContact.nome} — closed_lost (sem interesse)`);
    }

    // Lead redirecionou para decisor e recusou passar contato + reunião
    if (result.shouldCloseDecisore) {
      freshContact.status       = 'closed_decisor';
      freshContact.closedAt     = new Date().toISOString();
      freshContact.closedReason = 'decisor não acessível — lead recusou passar contato e reunião';
      updateLeadStatus(replyTo, 'DECISOR', 'encerrado — decisor inacessível').catch(() => {});
      console.log(`[webhook] ${freshContact.nome} — closed_decisor`);
    }

    // Lead quer continuar por e-mail → notifica o dono para enviar o e-mail
    if (result.shouldCloseEmail) {
      freshContact.status      = 'closed_email';
      freshContact.closedAt    = new Date().toISOString();
      freshContact.closedReason = `prefers_email: ${result.emailAddress || 'desconhecido'}`;
      updateLeadStatus(replyTo, 'EMAIL', 'prefere contato por e-mail').catch(() => {});
      console.log(`[webhook] ${freshContact.nome} — closed_email: ${result.emailAddress}`);
      if (OWNER) {
        await sendText(OWNER,
          `E-mail para fechar com ${freshContact.nome}\n\nPara: ${result.emailAddress || 'verificar com o lead'}\nSite: ${freshContact.siteUrl || 'ver no CRM'}`
        ).catch(() => {});
      }
    }

    freshDb.sentLog = freshDb.sentLog || [];
    freshDb.sentLog.push({ whatsapp: replyTo, step: 'negotiation', sentAt: new Date().toISOString() });
    saveDB(freshDb);

    // Extrai novos números mencionados na mensagem e prospecta em background
    prospectNewNumbers(fullText, freshContact.nome, freshDb).catch(err =>
      console.error('[prospect] Erro:', err.message)
    );

  } catch (err) {
    console.error('[webhook] Erro ao responder:', err.message);
  }
}

/**
 * Extrai números de telefone novos da mensagem recebida,
 * adiciona ao DB e envia o step 1 imediatamente.
 */
async function prospectNewNumbers(text, origemNome, db) {
  const novos = extractNewPhones(text, db.contacts);
  if (novos.length === 0) return;

  const { isBusinessHour } = require('./src/anti-block');

  for (const numero of novos) {
    console.log(`[prospect] Número novo detectado via ${origemNome}: ${numero}`);

    // Salva no DB imediatamente como 'pending' antes de qualquer delay
    // Assim sobrevive a restarts — o loop da campanha pega na próxima rodada
    const novoContato = {
      whatsapp:            numero,
      nome:                `Indicação via ${origemNome}`,
      siteUrl:             '',
      status:              'pending',
      nextStep:            1,
      nextSendAt:          new Date().toISOString(), // imediato
      responded:           false,
      negotiationStage:    null,
      conversationHistory: [],
      addedAt:             new Date().toISOString(),
      messagesLog:         [],
      source:              `indicado por ${origemNome}`,
    };
    db.contacts.push(novoContato);
    saveDB(db);
    console.log(`[prospect] ${numero} salvo no DB como pending`);

    // Só dispara imediatamente se estiver em horário comercial
    if (!isBusinessHour()) {
      console.log(`[prospect] Fora do horário — ${numero} será enviado no próximo ciclo da campanha`);
      continue;
    }

    // Delay humanizado (45s–90s) antes de enviar
    const delay = 45000 + Math.floor(Math.random() * 45000);
    console.log(`[prospect] Aguardando ${Math.round(delay / 1000)}s antes de contatar ${numero}...`);
    await new Promise(r => setTimeout(r, delay));

    // Busca o contato atualizado do DB (pode ter mudado durante o delay)
    const freshDb      = require('./src/campaign').loadDB();
    const freshContato = freshDb.contacts.find(c => c.whatsapp === numero);
    if (!freshContato || freshContato.status !== 'pending') {
      console.log(`[prospect] ${numero} já foi processado por outro ciclo — pulando`);
      continue;
    }

    const fragmentos = buildFragments(1, freshContato.nome, freshContato.nicho);
    try {
      let lastResult = null;
      for (let i = 0; i < fragmentos.length; i++) {
        if (i > 0) await new Promise(r => setTimeout(r, 2000 + Math.random() * 2000));
        lastResult = await sendText(numero, fragmentos[i]);
        // sendText já lança erro se key ausente — confirma fragmento a fragmento
      }
      if (lastResult?.key?.remoteJid) freshContato.remoteJid = lastResult.key.remoteJid;
      // Só persiste após todos os fragmentos confirmados
      freshContato.status   = 'step_1_sent';
      freshContato.nextStep = 2;
      const nextDate = new Date();
      nextDate.setDate(nextDate.getDate() + 2);
      nextDate.setUTCHours(12, 0, 0, 0);
      freshContato.nextSendAt = nextDate.toISOString();
      freshContato.messagesLog.push({ step: 1, sentAt: new Date().toISOString(), text: fragmentos.join('\n') });
      require('./src/campaign').saveDB(freshDb);
      console.log(`[prospect] Step 1 enviado para ${numero} (via ${origemNome})`);
    } catch (err) {
      console.error(`[prospect] Erro ao contatar ${numero}:`, err.message);
    }
  }
}

// ─── Mapeamento LID via contacts.upsert ──────────────────────────────────────
// O Evolution v2 envia este evento ao sincronizar contatos do WhatsApp.
// Cada item pode conter { id: "phone@s.whatsapp.net", lid: "xxx@lid" }.
// Aproveitamos para pré-mapear LID → telefone antes de qualquer mensagem.
function handleContactsUpsert(items) {
  if (!Array.isArray(items) || items.length === 0) return;
  const db = loadDB();
  let changed = false;

  for (const item of items) {
    const rawId  = item.id  || '';
    const rawLid = item.lid || '';
    if (!rawLid || !rawId) continue;
    if (!rawLid.endsWith('@lid')) continue;
    if (rawId.endsWith('@lid') || rawId.endsWith('@g.us')) continue;

    const phone = rawId.replace(/@s\.whatsapp\.net$/, '').replace(/@c\.us$/, '');
    const variants = phoneVariants(phone);

    const contact = db.contacts.find(c => variants.includes(c.whatsapp));
    if (contact && contact.lid !== rawLid) {
      contact.lid = rawLid;
      changed = true;
      console.log(`[contacts.upsert] LID mapeado: ${contact.nome} (${phone}) → ${rawLid}`);
    }
  }

  if (changed) saveDB(db);
}

// ─── Endpoint principal ───────────────────────────────────────────────────────
app.post('/webhook', async (req, res) => {
  res.sendStatus(200); // responde imediatamente para a Evolution não retentar

  const body = req.body;

  // Mapeamento LID — processa silenciosamente
  if (body?.event === 'contacts.upsert') {
    const items = Array.isArray(body?.data) ? body.data : [body?.data].filter(Boolean);
    handleContactsUpsert(items);
    return;
  }

  if (body?.event !== 'messages.upsert') return;

  const msg = body?.data;
  if (!msg) return;

  const fromMe   = msg?.key?.fromMe;
  const jid      = msg?.key?.remoteJid || '';
  const pushName = msg?.pushName || '';   // nome exibido pelo WhatsApp do remetente
  if (fromMe || jid.endsWith('@g.us')) return;

  // Extrai texto — tenta texto normal, depois transcreve áudio
  let text = msg?.message?.conversation || msg?.message?.extendedTextMessage?.text || '';

  if (!text && isAudioMessage(msg)) {
    console.log(`[webhook] Áudio recebido de ${jid} — transcrevendo...`);
    text = await transcribeAudio(msg) || '';
    if (text) {
      console.log(`[webhook] Transcrição: "${text.substring(0, 80)}"`);
    } else {
      console.log(`[webhook] Transcrição falhou — áudio ignorado`);
      return;
    }
  }

  if (!text) return;

  // ─── Debounce: acumula mensagens por 4 segundos ───────────────────────────
  if (messageQueues[jid]) {
    clearTimeout(messageQueues[jid].timer);
    messageQueues[jid].parts.push(text);
    messageQueues[jid].msgData = msg;
    if (pushName && !messageQueues[jid].pushName) messageQueues[jid].pushName = pushName;
    console.log(`[debounce] +msg de ${jid} (total: ${messageQueues[jid].parts.length})`);
  } else {
    messageQueues[jid] = { parts: [text], msgData: msg, pushName };
    console.log(`[debounce] Nova fila para ${jid}${pushName ? ' (' + pushName + ')' : ''}`);
  }

  messageQueues[jid].timer = setTimeout(() => processQueue(jid), DEBOUNCE_MS);
});

app.get('/health', (_, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`[webhook] Porta ${PORT} — debounce ${DEBOUNCE_MS}ms — transcrição de áudio ativa`);
});
