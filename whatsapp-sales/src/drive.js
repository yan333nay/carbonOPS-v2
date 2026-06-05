/**
 * Busca links de portfólio na pasta "imobiliárias" do Google Drive.
 * Os links são cacheados em memória para não chamar a API em todo reply.
 */
require('dotenv').config({ path: __dirname + '/../.env' });
const fs   = require('fs');
const path = require('path');

const CREDS_PATH        = process.env.GOOGLE_CREDENTIALS_PATH || '/root/leads-agent/google-credentials.json';
const PORTFOLIO_FOLDER  = process.env.PORTFOLIO_DRIVE_FOLDER_ID || '';

let cachedLinks = null;

async function getDrive() {
  const { google } = require('googleapis');
  const credentials = JSON.parse(fs.readFileSync(CREDS_PATH));
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
  });
  return google.drive({ version: 'v3', auth });
}

// Retorna array de { name, link } para os vídeos da pasta de portfólio
async function getPortfolioLinks() {
  if (cachedLinks) return cachedLinks;

  if (!PORTFOLIO_FOLDER) {
    return [{ name: 'Portfólio Carbon Films', link: 'https://drive.google.com/drive/folders/SEU_FOLDER_ID' }];
  }

  try {
    const drive = await getDrive();
    const res = await drive.files.list({
      q: `'${PORTFOLIO_FOLDER}' in parents and trashed = false`,
      fields: 'files(id, name, mimeType, webViewLink)',
      pageSize: 20,
    });

    const files = res.data.files || [];
    cachedLinks = files.map(f => ({
      name: f.name,
      link: f.webViewLink || `https://drive.google.com/file/d/${f.id}/view`,
    }));

    if (cachedLinks.length === 0) {
      cachedLinks = [{ name: 'Portfólio Carbon Films', link: `https://drive.google.com/drive/folders/${PORTFOLIO_FOLDER}` }];
    }

    return cachedLinks;
  } catch (err) {
    console.error('[drive] Erro ao buscar portfólio:', err.message);
    return [{ name: 'Portfólio Carbon Films', link: `https://drive.google.com/drive/folders/${PORTFOLIO_FOLDER}` }];
  }
}

// Formata links para incluir no prompt da IA ou na mensagem
async function formatPortfolioText() {
  const links = await getPortfolioLinks();
  if (links.length === 1) return `Portfólio: ${links[0].link}`;
  return links.map((f, i) => `${i + 1}. ${f.name}: ${f.link}`).join('\n');
}

module.exports = { getPortfolioLinks, formatPortfolioText };
