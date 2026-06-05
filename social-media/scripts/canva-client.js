#!/usr/bin/env node
'use strict';

/**
 * Canva Connect API Client — Carbon Films Social Media Squad
 * Usado pelo agente Pixel (canva-designer) para criar e exportar designs
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const ENV_PATH = path.join(__dirname, '../.env');

// ---------------------------------------------------------------
// ENV loader
// ---------------------------------------------------------------
function loadEnv() {
  return fs.readFileSync(ENV_PATH, 'utf8')
    .split('\n')
    .filter(line => line && !line.startsWith('#'))
    .reduce((acc, line) => {
      const [key, ...rest] = line.split('=');
      if (key) acc[key.trim()] = rest.join('=').trim();
      return acc;
    }, {});
}

function saveEnvKey(key, value) {
  let content = fs.readFileSync(ENV_PATH, 'utf8');
  if (content.includes(`${key}=`)) {
    content = content.replace(new RegExp(`${key}=.*`), `${key}=${value}`);
  } else {
    content += `\n${key}=${value}`;
  }
  fs.writeFileSync(ENV_PATH, content);
}

// ---------------------------------------------------------------
// HTTP helper
// ---------------------------------------------------------------
function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

// ---------------------------------------------------------------
// Token management
// ---------------------------------------------------------------
async function refreshToken(env) {
  console.log('Renovando access token...');
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: env.CANVA_REFRESH_TOKEN,
    client_id: env.CANVA_CLIENT_ID,
    client_secret: env.CANVA_CLIENT_SECRET,
  }).toString();

  const res = await request({
    hostname: 'api.canva.com',
    path: '/rest/v1/oauth/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(body),
    },
  }, body);

  if (res.status !== 200 || res.body.error) {
    throw new Error(`Token refresh failed: ${res.body.error_description || res.body.error}`);
  }

  saveEnvKey('CANVA_ACCESS_TOKEN', res.body.access_token);
  saveEnvKey('CANVA_TOKEN_EXPIRES_AT', String(Date.now() + (res.body.expires_in || 3600) * 1000));
  if (res.body.refresh_token) {
    saveEnvKey('CANVA_REFRESH_TOKEN', res.body.refresh_token);
  }

  return res.body.access_token;
}

async function getValidToken() {
  const env = loadEnv();
  const expiresAt = parseInt(env.CANVA_TOKEN_EXPIRES_AT || '0');
  const bufferMs = 5 * 60 * 1000; // refresh 5min before expiry

  if (Date.now() + bufferMs >= expiresAt) {
    return refreshToken(env);
  }

  return env.CANVA_ACCESS_TOKEN;
}

// ---------------------------------------------------------------
// API methods
// ---------------------------------------------------------------
async function apiCall(method, path, body = null) {
  const token = await getValidToken();

  const options = {
    hostname: 'api.canva.com',
    path,
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  };

  if (body) {
    const bodyStr = JSON.stringify(body);
    options.headers['Content-Length'] = Buffer.byteLength(bodyStr);
  }

  return request(options, body);
}

// ---------------------------------------------------------------
// Design dimensions map (from commands-library.yaml)
// ---------------------------------------------------------------
const COMMAND_SPECS = {
  'feed-impactante':  { width: 1080, height: 1350, design_type: 'UNKNOWN' },
  'stories-simples':  { width: 1080, height: 1920, design_type: 'UNKNOWN' },
  'carrossel-edu':    { width: 1080, height: 1080, design_type: 'UNKNOWN' },
  'reels-trend':      { width: 1080, height: 1920, design_type: 'UNKNOWN' },
  'resultado-cliente':{ width: 1080, height: 1080, design_type: 'UNKNOWN' },
  'bastidores':       { width: 1080, height: 1920, design_type: 'UNKNOWN' },
  'tiktok-viral':     { width: 1080, height: 1920, design_type: 'UNKNOWN' },
  'autoridade':       { width: 1080, height: 1350, design_type: 'UNKNOWN' },
  'edicao-basica':    { width: 1080, height: 1080, design_type: 'UNKNOWN' },
};

// ---------------------------------------------------------------
// Public API
// ---------------------------------------------------------------

/** List designs */
async function listDesigns(limit = 10) {
  const res = await apiCall('GET', `/rest/v1/designs?limit=${limit}`);
  if (res.status !== 200) throw new Error(`listDesigns failed: ${JSON.stringify(res.body)}`);
  return res.body.items || [];
}

/** Get design by ID */
async function getDesign(designId) {
  const res = await apiCall('GET', `/rest/v1/designs/${designId}`);
  if (res.status !== 200) throw new Error(`getDesign failed: ${JSON.stringify(res.body)}`);
  return res.body.design;
}

/** Create a new design for a given command */
async function createDesign(command, title = null) {
  const spec = COMMAND_SPECS[command];
  if (!spec) throw new Error(`Unknown command: ${command}. Valid: ${Object.keys(COMMAND_SPECS).join(', ')}`);

  const body = {
    design_type: { type: 'custom', width: spec.width, height: spec.height },
  };
  if (title) body.title = title;

  const res = await apiCall('POST', '/rest/v1/designs', body);
  if (res.status !== 200) throw new Error(`createDesign failed: ${JSON.stringify(res.body)}`);

  return res.body.design;
}

/** Export design as image */
async function exportDesign(designId, format = 'jpg', quality = 100) {
  // Create export job
  const res = await apiCall('POST', '/rest/v1/exports', {
    design_id: designId,
    format: { type: format, quality },
  });

  if (res.status !== 200) throw new Error(`exportDesign failed: ${JSON.stringify(res.body)}`);

  const jobId = res.body.job?.id;
  if (!jobId) throw new Error('No export job ID returned');

  // Poll for completion
  console.log(`Export job iniciado: ${jobId}`);
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const poll = await apiCall('GET', `/rest/v1/exports/${jobId}`);

    if (poll.status !== 200) throw new Error(`Export poll failed: ${JSON.stringify(poll.body)}`);

    const job = poll.body.job;
    console.log(`  Status: ${job?.status}`);

    if (job?.status === 'success') {
      return job.urls || [];
    }
    if (job?.status === 'failed') {
      throw new Error(`Export job failed: ${JSON.stringify(job)}`);
    }
  }

  throw new Error('Export job timed out after 60s');
}

/** Get current user */
async function getUser() {
  const res = await apiCall('GET', '/rest/v1/users/me/profile');
  if (res.status !== 200) throw new Error(`getUser failed: ${JSON.stringify(res.body)}`);
  return res.body.profile;
}

/** List brand templates */
async function listBrandTemplates(limit = 20) {
  const res = await apiCall('GET', `/rest/v1/brand-templates?limit=${limit}`);
  if (res.status !== 200) throw new Error(`listBrandTemplates failed: ${JSON.stringify(res.body)}`);
  return res.body.items || [];
}

/** Get editor URL for a design */
function getEditorUrl(designId) {
  return `https://www.canva.com/design/${designId}/edit`;
}

module.exports = {
  listDesigns,
  getDesign,
  createDesign,
  exportDesign,
  getUser,
  listBrandTemplates,
  getEditorUrl,
  getValidToken,
  COMMAND_SPECS,
};
