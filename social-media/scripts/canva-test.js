#!/usr/bin/env node
'use strict';

const https = require('https');
const fs = require('fs');
const path = require('path');

// Load .env
const envPath = path.join(__dirname, '../.env');
const env = fs.readFileSync(envPath, 'utf8')
  .split('\n')
  .filter(line => line && !line.startsWith('#'))
  .reduce((acc, line) => {
    const [key, ...rest] = line.split('=');
    if (key) acc[key.trim()] = rest.join('=').trim();
    return acc;
  }, {});

const ACCESS_TOKEN = env.CANVA_ACCESS_TOKEN;

function apiGet(path) {
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.canva.com',
      path,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (err) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  console.log('Testando Canva Connect API...\n');

  // 1. Get current user
  console.log('1. Usuario atual:');
  const user = await apiGet('/rest/v1/users/me');
  if (user.status === 200) {
    console.log(`   ID: ${user.body.user?.user_id}`);
    console.log(`   Team: ${user.body.user?.team_id}`);
    console.log(`   Display name: ${user.body.user?.display_name || '(sem nome)'}`);
  } else {
    console.log(`   Erro ${user.status}:`, user.body);
  }

  // 2. List designs
  console.log('\n2. Designs na conta:');
  const designs = await apiGet('/rest/v1/designs?limit=5');
  if (designs.status === 200) {
    const items = designs.body.items || [];
    if (items.length === 0) {
      console.log('   Nenhum design encontrado');
    } else {
      items.forEach((d, i) => {
        console.log(`   [${i + 1}] ${d.title || '(sem titulo)'} — ID: ${d.id}`);
      });
    }
  } else {
    console.log(`   Erro ${designs.status}:`, designs.body);
  }

  // 3. List brand templates
  console.log('\n3. Brand templates:');
  const templates = await apiGet('/rest/v1/brand-templates?limit=5');
  if (templates.status === 200) {
    const items = templates.body.items || [];
    if (items.length === 0) {
      console.log('   Nenhum brand template encontrado');
    } else {
      items.forEach((t, i) => {
        console.log(`   [${i + 1}] ${t.title || '(sem titulo)'} — ID: ${t.id}`);
      });
    }
  } else {
    console.log(`   Erro ${templates.status}:`, templates.body);
  }

  console.log('\nTeste concluido.');
}

main().catch(console.error);
