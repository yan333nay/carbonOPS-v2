const fs = require('fs');
const path = require('path');

const STATE_PATH = path.join(__dirname, '..', 'data', 'search-state.json');

function load() {
  if (!fs.existsSync(STATE_PATH)) return { cityIndex: 0, templateIndex: 0 };
  return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
}

function save(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

module.exports = { load, save };
