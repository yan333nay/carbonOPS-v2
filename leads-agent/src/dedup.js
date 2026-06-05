const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'leads-db.json');

function load() {
  if (!fs.existsSync(DB_PATH)) return { leads: [] };
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function save(db) {
  db.updatedAt = new Date().toISOString();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

function getHostname(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
}

function isDuplicate(url, db) {
  const host = getHostname(url);
  return db.leads.some(l => getHostname(l.siteUrl) === host);
}

module.exports = { load, save, isDuplicate };
