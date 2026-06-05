/**
 * Atualiza o CRM (Google Sheets) quando o bot entra em contato com um lead.
 * Colunas escritas de volta: STATUS, DATA_CONTATO, PROXIMO_FOLLOWUP, ETAPA, SCORE, SERVICO, AB_VARIANT
 * Suporta todos os nichos — cada nicho tem sua(s) aba(s) mapeada(s).
 */
require('dotenv').config({ path: __dirname + '/../.env' });
const fs = require('fs');
const { google } = require('googleapis');

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const CREDS_PATH     = process.env.GOOGLE_CREDENTIALS_PATH;

// Mapeamento nicho → nomes possíveis de aba (tenta na ordem)
const NICHO_SHEETS = {
  imobiliarias: ['Site para imobiliárias.', 'Imobiliárias'],
  restaurantes:  ['Restaurantes'],
  academias:     ['Academias'],
  clinicas:      ['Clínicas'],
  saloes:        ['Salões de Beleza'],
  escritorios:   ['Escritórios'],
};

// Colunas que o bot gerencia (adiciona se não existirem)
const BOT_COLS = ['STATUS', 'DATA_CONTATO', 'PROXIMO_FOLLOWUP', 'ETAPA', 'SCORE', 'SERVICO', 'AB_VARIANT'];

// Mapeamento de variante de serviço para nome do serviço
const SERVICO_MAP = {
  0: 'Landing page',
  1: 'Chatbot com IA',
  2: 'Tráfego pago com IA',
};

async function getSheets() {
  const credentials = JSON.parse(fs.readFileSync(CREDS_PATH));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

// Garante que as colunas do bot existem em uma aba específica
async function ensureColumns(sheets, sheetName) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetName}'!1:1`,
  });
  const headers = (res.data.values?.[0] || []).map(h => h.trim().toUpperCase());

  const missing = BOT_COLS.filter(c => !headers.includes(c));
  if (missing.length === 0) return headers;

  // Adiciona cabeçalhos faltantes no final
  const nextCol = headers.length;
  const updates = missing.map((col, i) => ({
    range: `'${sheetName}'!${colLetter(nextCol + i)}1`,
    values: [[col]],
  }));

  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'RAW',
      data: updates,
    },
  });

  return [...headers, ...missing];
}

// Encontra a linha do lead pelo número de WhatsApp em uma aba específica
async function findLeadRow(sheets, whatsapp, sheetName) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetName}'!A:G`,
  });
  const rows = res.data.values || [];
  // Normaliza número para comparação flexível
  const normalized = whatsapp.replace(/\D/g, '');
  for (let i = 1; i < rows.length; i++) {
    const rowStr = rows[i].join(' ').replace(/\D/g, '');
    if (rowStr.includes(normalized.slice(-8))) return i + 1; // 1-indexed
  }
  return null;
}

// Letra da coluna a partir do índice 0: 0→A, 25→Z, 26→AA
function colLetter(idx) {
  let s = '';
  idx++;
  while (idx > 0) {
    const rem = (idx - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    idx = Math.floor((idx - 1) / 26);
  }
  return s;
}

function dataBR(date) {
  return (date || new Date()).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
}

function addDias(dias) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return dataBR(d);
}

/**
 * Calcula SCORE (0-5) baseado no status e temperatura do lead.
 * 0 = sem resposta / cold
 * 1 = respondeu mas sem interesse (cold)
 * 2 = respondeu, está conversando (warm)
 * 3 = avançado na qualificação (warm, perguntando sobre serviço)
 * 4 = reunião agendada
 * 5 = fechado
 */
function calcScore(status, extra) {
  if (extra && extra.score !== undefined && extra.score !== null) return extra.score;
  if (!status) return 0;
  const s = status.toUpperCase();
  if (s === 'FECHADO' || s === 'CLOSED_WON') return 5;
  if (s === 'REUNIÃO' || s === 'REUNIAO' || s === 'MEETING_SCHEDULED') return 4;
  if (s === 'QUALIFICANDO' || s === 'QUALIFYING') return 3;
  if (s === 'RESPONDEU' || s === 'NEGOTIATING') return 2;
  if (s === 'SEM_INTERESSE' || s === 'COLD' || s === 'CLOSED_LOST') return 1;
  return 0;
}

/**
 * Determina o serviço baseado na variante e abStyle do lead.
 * Variante 0 = Landing page, 1 = Chatbot com IA, 2 = Tráfego pago com IA.
 * Se mencionou automação/IA sem ser chatbot → Automações com IA.
 */
function resolveServico(extra) {
  if (!extra) return null;
  if (extra.servico) return extra.servico;
  // Tenta mapear pela variante numérica
  const variantNum = extra.variantIdx !== undefined ? extra.variantIdx : null;
  if (variantNum !== null && SERVICO_MAP[variantNum]) return SERVICO_MAP[variantNum];
  return null;
}

/**
 * Tenta encontrar o lead em qualquer aba do nicho especificado.
 * Retorna { sheetName, rowIdx, headers } ou null.
 */
async function findLeadInNicho(sheets, whatsapp, nicho) {
  const sheetsToTry = nicho ? (NICHO_SHEETS[nicho] || []) : [];
  // Se nicho não especificado, tenta todas as abas
  if (sheetsToTry.length === 0) {
    for (const sheets_ of Object.values(NICHO_SHEETS)) {
      sheetsToTry.push(...sheets_);
    }
  }

  for (const sheetName of sheetsToTry) {
    try {
      const headers = await ensureColumns(sheets, sheetName);
      const rowIdx = await findLeadRow(sheets, whatsapp, sheetName);
      if (rowIdx) return { sheetName, rowIdx, headers };
    } catch (err) {
      // Aba pode não existir — continua tentando
      continue;
    }
  }
  return null;
}

/**
 * Atualiza STATUS + DATA_CONTATO + ETAPA + SCORE + SERVICO + AB_VARIANT quando o contato é feito.
 * @param {string} whatsapp - Número do lead (ex: 5547984989657)
 * @param {string} status - Ex: 'CONTATADO', 'RESPONDEU', 'REUNIÃO AGENDADA', 'FECHADO'
 * @param {string} etapa - Step da sequência ou 'negociação'
 * @param {object} extra - Opcional: { nicho, score, servico, abStyle, variantIdx }
 */
async function updateLeadStatus(whatsapp, status, etapa, extra) {
  try {
    const sheets = await getSheets();
    const nicho = extra?.nicho || null;

    const found = await findLeadInNicho(sheets, whatsapp, nicho);
    if (!found) {
      console.log(`[crm-update] Lead ${whatsapp} não encontrado na planilha`);
      return;
    }

    const { sheetName, rowIdx, headers } = found;

    const idxStatus    = headers.indexOf('STATUS');
    const idxData      = headers.indexOf('DATA_CONTATO');
    const idxFollowup  = headers.indexOf('PROXIMO_FOLLOWUP');
    const idxEtapa     = headers.indexOf('ETAPA');
    const idxScore     = headers.indexOf('SCORE');
    const idxServico   = headers.indexOf('SERVICO');
    const idxAbVariant = headers.indexOf('AB_VARIANT');

    // Define próximo follow-up baseado na etapa
    let proximoFollowup = '';
    if (status === 'CONTATADO')         proximoFollowup = addDias(2);
    else if (status === 'RESPONDEU')    proximoFollowup = addDias(7);
    else if (status === 'SEM_RESPOSTA') proximoFollowup = addDias(7);
    else if (status === 'REUNIÃO')      proximoFollowup = addDias(1);
    else if (status === 'FECHADO')      proximoFollowup = '';

    const score   = calcScore(status, extra);
    const servico = resolveServico(extra);
    const abStyle = extra?.abStyle || null;

    const updates = [];
    if (idxStatus >= 0)    updates.push({ range: `'${sheetName}'!${colLetter(idxStatus)}${rowIdx}`,    values: [[status]] });
    if (idxData >= 0)      updates.push({ range: `'${sheetName}'!${colLetter(idxData)}${rowIdx}`,      values: [[dataBR()]] });
    if (idxFollowup >= 0)  updates.push({ range: `'${sheetName}'!${colLetter(idxFollowup)}${rowIdx}`,  values: [[proximoFollowup]] });
    if (idxEtapa >= 0)     updates.push({ range: `'${sheetName}'!${colLetter(idxEtapa)}${rowIdx}`,     values: [[etapa || '']] });
    if (idxScore >= 0)     updates.push({ range: `'${sheetName}'!${colLetter(idxScore)}${rowIdx}`,     values: [[score]] });
    if (idxServico >= 0 && servico)   updates.push({ range: `'${sheetName}'!${colLetter(idxServico)}${rowIdx}`,  values: [[servico]] });
    if (idxAbVariant >= 0 && abStyle) updates.push({ range: `'${sheetName}'!${colLetter(idxAbVariant)}${rowIdx}`, values: [[abStyle]] });

    if (updates.length === 0) return;

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { valueInputOption: 'USER_ENTERED', data: updates },
    });

    console.log(`[crm-update] ${whatsapp} → ${status} | score: ${score} | aba: ${sheetName} | próximo: ${proximoFollowup}`);
  } catch (err) {
    console.error(`[crm-update] Erro ao atualizar planilha:`, err.message);
  }
}

/**
 * Atualiza apenas a coluna SCORE de um lead.
 * @param {string} whatsapp
 * @param {number} score - 0 a 5
 * @param {string} nicho - opcional, acelera busca da aba
 */
async function updateLeadScore(whatsapp, score, nicho) {
  try {
    const sheets = await getSheets();
    const found = await findLeadInNicho(sheets, whatsapp, nicho || null);
    if (!found) {
      console.log(`[crm-update] Lead ${whatsapp} não encontrado para atualizar score`);
      return;
    }
    const { sheetName, rowIdx, headers } = found;
    const idxScore = headers.indexOf('SCORE');
    if (idxScore < 0) {
      console.log(`[crm-update] Coluna SCORE não encontrada na aba ${sheetName}`);
      return;
    }
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${sheetName}'!${colLetter(idxScore)}${rowIdx}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[score]] },
    });
    console.log(`[crm-update] Score ${whatsapp} → ${score}`);
  } catch (err) {
    console.error(`[crm-update] Erro ao atualizar score:`, err.message);
  }
}

module.exports = { updateLeadStatus, updateLeadScore, NICHO_SHEETS };
