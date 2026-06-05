const fs = require('fs');
const path = require('path');

const LOG_PATH = path.join(__dirname, '..', 'logs', 'leads.log');

function ensureDir() {
  const dir = path.dirname(LOG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function log(msg) {
  ensureDir();
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
}

function logError(msg) {
  log(`ERRO: ${msg}`);
}

module.exports = { log, logError };
