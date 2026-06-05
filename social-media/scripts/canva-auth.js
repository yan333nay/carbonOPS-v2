#!/usr/bin/env node
'use strict';

const http = require('http');
const crypto = require('crypto');
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

const CLIENT_ID = env.CANVA_CLIENT_ID;
const CLIENT_SECRET = env.CANVA_CLIENT_SECRET;
const REDIRECT_URI = env.CANVA_REDIRECT_URI;
const PORT = 3000;

// PKCE helpers
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

// Exchange code for token
function exchangeCode(code, codeVerifier) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code_verifier: codeVerifier,
    }).toString();

    const req = https.request({
      hostname: 'api.canva.com',
      path: '/rest/v1/oauth/token',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(new Error(`Failed to parse token response: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// Save token to .env
function saveToken(tokenData) {
  let envContent = fs.readFileSync(envPath, 'utf8');

  const fields = {
    CANVA_ACCESS_TOKEN: tokenData.access_token,
    CANVA_REFRESH_TOKEN: tokenData.refresh_token || '',
    CANVA_TOKEN_EXPIRES_AT: String(Date.now() + (tokenData.expires_in || 3600) * 1000),
  };

  for (const [key, value] of Object.entries(fields)) {
    if (envContent.includes(`${key}=`)) {
      envContent = envContent.replace(new RegExp(`${key}=.*`), `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
  }

  fs.writeFileSync(envPath, envContent);
  console.log('Token salvo em .env');
}

async function main() {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  const scopes = [
    'profile:read', 'folder:read', 'design:permission:read',
    'folder:permission:read', 'asset:write', 'folder:write',
    'design:meta:read', 'design:content:read', 'folder:permission:write',
    'design:permission:write', 'design:content:write',
    'brandtemplate:content:read', 'brandtemplate:meta:read',
    'app:write', 'app:read', 'comment:read',
    'brandtemplate:content:write', 'asset:read', 'comment:write',
  ].join(' ');

  const authUrl = new URL('https://www.canva.com/api/oauth/authorize');
  authUrl.searchParams.set('code_challenge_method', 's256');
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('client_id', CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.set('scope', scopes);
  authUrl.searchParams.set('code_challenge', codeChallenge);

  console.log('\nAbra este URL no navegador:\n');
  console.log(authUrl.toString());
  console.log('\nAguardando callback em http://127.0.0.1:3000/auth/canva/callback ...\n');

  // Local server to capture the callback
  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://127.0.0.1:${PORT}`);

    if (!url.pathname.startsWith('/auth/canva/callback')) {
      res.end('Not found');
      return;
    }

    const code = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    if (error) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end(`<h2>Erro: ${error}</h2>`);
      server.close();
      return;
    }

    if (!code) {
      res.writeHead(400, { 'Content-Type': 'text/html' });
      res.end('<h2>Codigo nao recebido</h2>');
      server.close();
      return;
    }

    console.log('Codigo recebido. Trocando por access token...');

    try {
      const tokenData = await exchangeCode(code, codeVerifier);

      if (tokenData.error) {
        throw new Error(`${tokenData.error}: ${tokenData.error_description}`);
      }

      saveToken(tokenData);

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end('<h2>Autenticado com sucesso! Pode fechar esta aba.</h2>');

      console.log('\nSucesso! Access token obtido.');
      console.log(`Expira em: ${tokenData.expires_in}s`);
    } catch (err) {
      console.error('Erro ao trocar codigo:', err.message);
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(`<h2>Erro: ${err.message}</h2>`);
    }

    server.close();
  });

  server.listen(PORT, '127.0.0.1');
}

main().catch(console.error);
