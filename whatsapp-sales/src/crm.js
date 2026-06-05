/**
 * Lê contatos com WhatsApp de todas as abas da planilha Google Sheets.
 * Cada aba corresponde a um nicho (imobiliárias, restaurantes, academias, etc).
 */
require('dotenv').config({ path: __dirname + '/../.env' });
const fs = require('fs');

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '1bl5vWhAvYrRwu2Rufjw9uXEykXNCQCw-rsHLOKK-EFE';
const CREDS_PATH = process.env.GOOGLE_CREDENTIALS_PATH || '/root/leads-agent/google-credentials.json';

const SHEET_NICHES = [
  { sheet: "Site para imobiliárias.", nicho: 'imobiliarias' },
  { sheet: 'Imobiliárias',           nicho: 'imobiliarias' },
  { sheet: 'Restaurantes',           nicho: 'restaurantes' },
  { sheet: 'Academias',              nicho: 'academias'    },
  { sheet: 'Clínicas',               nicho: 'clinicas'     },
  { sheet: 'Salões de Beleza',       nicho: 'saloes'       },
  { sheet: 'Escritórios',            nicho: 'escritorios'  },
];

async function getSheets() {
  const { google } = require('googleapis');
  const credentials = JSON.parse(fs.readFileSync(CREDS_PATH));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  return google.sheets({ version: 'v4', auth });
}

function toE164(raw) {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  if (digits.startsWith('55') && digits.length >= 12) return digits;
  if (digits.length >= 10) return '55' + digits;
  return null;
}

function parseRows(rows, nicho) {
  if (!rows || rows.length < 2) return [];
  const headers = rows[0].map(h => h.trim().toUpperCase());
  const idx = {
    nome:     headers.indexOf('NOME'),
    email:    headers.indexOf('E-MAIL'),
    telefone: headers.indexOf('TELEFONE'),
    site:     headers.indexOf('URL DO SITE'),
    whatsapp: headers.indexOf('WHATSAPP'),
  };
  return rows.slice(1)
    .map(r => ({
      nome:     (r[idx.nome]     || '').trim(),
      email:    (r[idx.email]    || '').trim(),
      siteUrl:  (r[idx.site]     || '').trim(),
      whatsapp: toE164(r[idx.whatsapp] || r[idx.telefone] || ''),
      nicho,
    }))
    .filter(c => c.whatsapp && c.nome);
}

async function readSheet(sheets, sheetName, nicho) {
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${sheetName}'!A:G`,
    });
    return parseRows(res.data.values, nicho);
  } catch (err) {
    if (err.code === 400 || (err.message || '').includes('Unable to parse range')) {
      return [];
    }
    throw err;
  }
}

async function getContacts() {
  if (!fs.existsSync(CREDS_PATH)) {
    throw new Error(`Google credentials não encontrado: ${CREDS_PATH}`);
  }

  const sheets = await getSheets();

  // Descobre quais abas existem na planilha
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const existingSheets = new Set(meta.data.sheets.map(s => s.properties.title));

  const all = [];
  const seenWhatsapp = new Set();

  for (const { sheet, nicho } of SHEET_NICHES) {
    if (!existingSheets.has(sheet)) continue;
    const contacts = await readSheet(sheets, sheet, nicho);
    for (const c of contacts) {
      if (!seenWhatsapp.has(c.whatsapp)) {
        seenWhatsapp.add(c.whatsapp);
        all.push(c);
      }
    }
  }

  return all;
}

module.exports = { getContacts };
