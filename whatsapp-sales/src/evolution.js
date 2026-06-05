/**
 * Cliente REST para a Evolution API v2.
 * Substitui completamente o whatsapp-web.js.
 */
require('dotenv').config({ path: __dirname + '/../.env' });
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.EVOLUTION_URL  || 'http://localhost:8081';
const API_KEY  = process.env.EVOLUTION_API_KEY;
const INSTANCE = process.env.EVOLUTION_INSTANCE || 'carbonfilms';

// Lança erro explícito se a API retornar HTTP != 2xx, evitando falhas silenciosas
async function request(method, endpoint, body) {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: {
      'apikey': API_KEY,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // Endpoints de consulta (GET sem envio) — falha silenciosa OK
  const isSend = endpoint.includes('/message/send');
  if (!res.ok && isSend) {
    const errText = await res.text().catch(() => res.status);
    throw new Error(`Evolution API ${res.status} em ${endpoint}: ${errText}`);
  }

  return res.json().catch(() => null);
}

// Retorna o código bruto do QR (string para renderizar no terminal)
async function getQRCode() {
  const data = await request('GET', `/instance/connect/${INSTANCE}`);
  return data?.code || null;
}

// Status da conexão: 'open' = conectado
async function getStatus() {
  const data = await request('GET', `/instance/connectionState/${INSTANCE}`);
  return data?.instance?.state || 'unknown';
}

// Envia texto para um número (formato: 5547XXXXXXXXX)
// Lança erro se a API não confirmar entrega (campo key ausente)
async function sendText(number, text) {
  const res = await request('POST', `/message/sendText/${INSTANCE}`, {
    number,
    text,
    delay: 1200,
  });
  if (!res || !res.key) {
    throw new Error(`sendText falhou para ${number}: ${JSON.stringify(res)}`);
  }
  return res;
}

// Extrai número limpo de qualquer formato de JID do WhatsApp
// "5547984989657@s.whatsapp.net" → "5547984989657"
// "231881123573811@lid"          → "231881123573811@lid" (mantém @lid para lookup)
// "554784989657@s.whatsapp.net"  → "554784989657"
function extractNumber(jid) {
  if (!jid) return null;
  if (jid.endsWith('@lid')) return jid; // retorna com @lid para lookup por LID
  return jid.replace(/@s\.whatsapp\.net$/, '').replace(/@c\.us$/, '');
}

// Normaliza número BR: tenta variações com/sem 9 dígito para matching flexível
// Ex: "5547984989657" → ["5547984989657", "554784989657"]
function phoneVariants(num) {
  const digits = num.replace(/\D/g, '');
  const variants = new Set([digits]);
  // Brasil: DDI55 + DDD(2) + 9(opcional) + número(8)
  if (digits.startsWith('55') && digits.length === 13) {
    variants.add('55' + digits.slice(2, 4) + digits.slice(5));
  } else if (digits.startsWith('55') && digits.length === 12) {
    variants.add('55' + digits.slice(2, 4) + '9' + digits.slice(4));
  }
  return [...variants];
}

// Envia vídeo do portfólio (arquivo local) com legenda
async function sendVideo(number, filePath, caption) {
  const buffer = fs.readFileSync(filePath);
  const base64 = buffer.toString('base64');
  const fileName = path.basename(filePath);

  const res = await request('POST', `/message/sendMedia/${INSTANCE}`, {
    number,
    mediatype: 'video',
    mimetype: 'video/mp4',
    caption,
    media: base64,
    fileName,
  });
  if (!res || !res.key) {
    throw new Error(`sendVideo falhou para ${number}: ${JSON.stringify(res)}`);
  }
  return res;
}

// Envia documento (arquivo local)
async function sendDocument(number, filePath, mimetype) {
  const buffer   = fs.readFileSync(filePath);
  const base64   = buffer.toString('base64');
  const fileName = path.basename(filePath);
  const res = await request('POST', `/message/sendMedia/${INSTANCE}`, {
    number,
    mediatype: 'document',
    mimetype,
    media: base64,
    fileName,
    caption: '',
  });
  if (!res || !res.key) {
    throw new Error(`sendDocument falhou para ${number}: ${JSON.stringify(res)}`);
  }
  return res;
}

// Configura webhook para receber mensagens
async function setWebhook(webhookUrl) {
  return request('POST', `/webhook/set/${INSTANCE}`, {
    webhook: {
      enabled: true,
      url: webhookUrl,
      webhookByEvents: false,
      events: ['MESSAGES_UPSERT', 'CONTACTS_UPSERT', 'CONNECTION_UPDATE'],
    },
  });
}

// Cache em memória: LID → número de telefone
const lidCache = {};

/**
 * Tenta resolver um LID para número de telefone via Evolution API.
 * Usa /chat/findChats e /contacts/fetchContacts como fallback.
 * Retorna o número limpo (ex: "554832391900") ou null.
 */
async function lookupPhoneFromLid(lid) {
  if (lidCache[lid]) return lidCache[lid];

  try {
    const chats = await request('GET', `/chat/findChats/${INSTANCE}`);
    if (Array.isArray(chats)) {
      const match = chats.find(c => c.id === lid || c.lid === lid);
      if (match?.id && !match.id.endsWith('@lid')) {
        const phone = match.id.replace(/@s\.whatsapp\.net$/, '').replace(/@c\.us$/, '');
        lidCache[lid] = phone;
        return phone;
      }
      if (match?.jid && !match.jid.endsWith('@lid')) {
        const phone = match.jid.replace(/@s\.whatsapp\.net$/, '').replace(/@c\.us$/, '');
        lidCache[lid] = phone;
        return phone;
      }
    }
  } catch { /* ignora erros de rede */ }

  try {
    const contacts = await request('GET', `/contacts/fetchContacts/${INSTANCE}`);
    if (Array.isArray(contacts)) {
      const match = contacts.find(c => c.lid === lid || c.id === lid);
      if (match) {
        const phone = (match.id || match.number || '').replace(/@s\.whatsapp\.net$/, '').replace(/@c\.us$/, '');
        if (phone && !phone.endsWith('@lid')) {
          lidCache[lid] = phone;
          return phone;
        }
      }
    }
  } catch { /* ignora */ }

  return null;
}

// Cache de etiquetas: número → { isYellow, cachedAt }
const labelCache = {};
const LABEL_CACHE_TTL = 5 * 60 * 1000;

/**
 * Verifica se um contato possui etiqueta amarela no WhatsApp Business.
 * Retorna true se etiqueta amarela detectada (parar de contactar).
 */
async function hasYellowLabel(number) {
  const now = Date.now();
  const cached = labelCache[number];
  if (cached && (now - cached.cachedAt) < LABEL_CACHE_TTL) {
    return cached.isYellow;
  }

  const YELLOW_NAMES = ['amarelo', 'amarela', 'yellow', 'aguardando', 'em espera', 'pausado'];

  try {
    const res = await request('GET', `/label/findLabelsByNumber/${INSTANCE}?number=${number}`);
    if (Array.isArray(res)) {
      const isYellow = res.some(l => {
        const name = (l.name || l.label || '').toLowerCase();
        const color = (l.color || '').toLowerCase();
        return color === 'yellow' || color === '#ffff00' || YELLOW_NAMES.some(y => name.includes(y));
      });
      labelCache[number] = { isYellow, cachedAt: now };
      return isYellow;
    }
  } catch { /* endpoint não disponível nesta versão */ }

  try {
    const chats = await request('GET', `/chat/findChats/${INSTANCE}`);
    if (Array.isArray(chats)) {
      const variants = phoneVariants(number);
      const chat = chats.find(c => variants.some(v => (c.id || '').includes(v)));
      if (chat?.labels && Array.isArray(chat.labels)) {
        const isYellow = chat.labels.some(l => {
          const name = (l.name || l.label || '').toLowerCase();
          const color = (l.color || '').toLowerCase();
          return color === 'yellow' || color === '#ffff00' || YELLOW_NAMES.some(y => name.includes(y));
        });
        labelCache[number] = { isYellow, cachedAt: now };
        return isYellow;
      }
    }
  } catch { /* ignora */ }

  labelCache[number] = { isYellow: false, cachedAt: now };
  return false;
}

module.exports = { getQRCode, getStatus, sendText, sendVideo, sendDocument, setWebhook, INSTANCE, extractNumber, phoneVariants, lookupPhoneFromLid, hasYellowLabel };
