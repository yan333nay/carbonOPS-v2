/**
 * Integração com Google Sheets via Service Account.
 * Fallback automático para CSV local se as credenciais não estiverem configuradas.
 */
const fs = require('fs');
const path = require('path');
const { log, logError } = require('./logger');

const SPREADSHEET_ID = process.env.SPREADSHEET_ID || '1bl5vWhAvYrRwu2Rufjw9uXEykXNCQCw-rsHLOKK-EFE';
const CREDS_PATH = process.env.GOOGLE_CREDENTIALS_PATH || path.join(__dirname, '..', 'google-credentials.json');
const CSV_PATH = path.join(__dirname, '..', 'data', 'leads-backup.csv');

const HEADERS = ['NOME', 'E-MAIL', 'TELEFONE', 'URL DO SITE', 'SERVIÇOS', 'DATA', 'WHATSAPP'];

function hasCredentials() {
  return fs.existsSync(CREDS_PATH);
}

async function getSheets() {
  const { google } = require('googleapis');
  const credentials = JSON.parse(fs.readFileSync(CREDS_PATH));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return google.sheets({ version: 'v4', auth });
}

// Mapa de nichos para nome de aba na planilha
const NICHE_SHEET_NAMES = {
  imobiliarias: 'Imobiliárias',
  restaurantes:  'Restaurantes',
  academias:     'Academias',
  clinicas:      'Clínicas',
  saloes:        'Salões de Beleza',
  escritorios:   'Escritórios',
};

async function ensureSheet(sheets, sheetName) {
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const exists = meta.data.sheets.some(s => s.properties.title === sheetName);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: sheetName } } }],
      },
    });
    log(`Aba "${sheetName}" criada na planilha`);
  }
}

async function ensureHeaders(sheets, sheetName) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetName}'!A1:G1`,
  }).catch(() => ({ data: { values: [] } }));

  const firstRow = (res.data.values || [])[0] || [];
  if (firstRow[0] !== 'NOME') {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${sheetName}'!A1:G1`,
      valueInputOption: 'RAW',
      requestBody: { values: [HEADERS] },
    });
    log(`Cabeçalhos criados na aba "${sheetName}"`);
  } else if (!firstRow.includes('WHATSAPP')) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${sheetName}'!G1`,
      valueInputOption: 'RAW',
      requestBody: { values: [['WHATSAPP']] },
    });
    log(`Coluna WHATSAPP adicionada à aba "${sheetName}"`);
  }
}

async function writeToSheets(leads, nicho = 'imobiliarias') {
  if (!hasCredentials()) {
    throw new Error(`google-credentials.json não encontrado em ${CREDS_PATH}`);
  }

  const sheets   = await getSheets();
  const sheetName = NICHE_SHEET_NAMES[nicho] || nicho;
  await ensureSheet(sheets, sheetName);
  await ensureHeaders(sheets, sheetName);

  const today = new Date().toLocaleDateString('pt-BR');
  const rows = leads.map(l => [
    l.nome || '',
    l.email || '',
    l.telefone || '',
    l.siteUrl || '',
    l.servicos || '',
    today,
    l.whatsapp || '',
  ]);

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetName}'!A:G`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: rows },
  });

  log(`${leads.length} linhas adicionadas na aba "${sheetName}"`);
}

function saveToCSV(leads) {
  const today = new Date().toLocaleDateString('pt-BR');
  let content = '';

  if (!fs.existsSync(CSV_PATH)) {
    content = HEADERS.join(',') + '\n';
  }

  for (const l of leads) {
    const cols = [l.nome, l.email, l.telefone, l.siteUrl, l.servicos, today, l.whatsapp]
      .map(v => `"${(v || '').replace(/"/g, '""')}"`)
      .join(',');
    content += cols + '\n';
  }

  fs.appendFileSync(CSV_PATH, content);
  log(`Backup CSV salvo em: ${CSV_PATH}`);
}

module.exports = { writeToSheets, saveToCSV, hasCredentials };
