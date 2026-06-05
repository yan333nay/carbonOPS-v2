'use strict';
/**
 * agent-runner.js
 * Executa agentes do social-media-squad via Claude API.
 * Lê persona do agente, injeta brandbook e chama a API.
 *
 * Uso:
 *   const { runAgent } = require('./agent-runner');
 *   const result = await runAgent({ agentId: 'copy-writer', task: '...', context: {}, schema: {} });
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env');
const AGENTS_DIR = path.join(ROOT, 'agents');
const BRANDBOOK_PATH = path.join(ROOT, 'data', 'brandbook-carbon-films.yaml');
const MIND_COUNCIL_PATH = path.join(ROOT, 'data', 'mind-council-frameworks.yaml');

// ---------------------------------------------------------------
function loadEnv() {
  try {
    return fs.readFileSync(ENV_PATH, 'utf8')
      .split('\n').filter(l => l && !l.startsWith('#'))
      .reduce((acc, l) => {
        const [k, ...v] = l.split('=');
        if (k && k.trim()) acc[k.trim()] = v.join('=').trim();
        return acc;
      }, {});
  } catch { return {}; }
}

function loadFile(filePath) {
  try { return fs.readFileSync(filePath, 'utf8'); }
  catch { return ''; }
}

// ---------------------------------------------------------------
// Extrai JSON de resposta que pode vir com markdown code blocks
// ---------------------------------------------------------------
function extractJson(text) {
  // Tenta extrair de ```json ... ```
  const codeBlock = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
  if (codeBlock) return JSON.parse(codeBlock[1]);

  // Tenta extrair objeto JSON diretamente
  const objMatch = text.match(/(\{[\s\S]*\})/);
  if (objMatch) return JSON.parse(objMatch[1]);

  // Tenta parsear direto
  return JSON.parse(text);
}

// ---------------------------------------------------------------
// Chama Claude API (Anthropic) ou OpenRouter
// ---------------------------------------------------------------
function callClaudeApi({ apiKey, isOpenRouter, systemPrompt, userMessage }) {
  const model = isOpenRouter
    ? 'anthropic/claude-haiku-4-5'
    : 'claude-haiku-4-5-20251001';

  const body = JSON.stringify({
    model,
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const hostname = isOpenRouter ? 'openrouter.ai' : 'api.anthropic.com';
  const apiPath = isOpenRouter ? '/api/v1/messages' : '/v1/messages';

  const headers = {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
  };

  if (isOpenRouter) {
    headers['Authorization'] = `Bearer ${apiKey}`;
    headers['HTTP-Referer'] = 'https://carbonfilms.com.br';
  } else {
    headers['x-api-key'] = apiKey;
    headers['anthropic-version'] = '2023-06-01';
  }

  return new Promise((resolve, reject) => {
    const req = https.request({ hostname, path: apiPath, method: 'POST', headers }, (r) => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => {
        try {
          const json = JSON.parse(d);
          if (json.error) return reject(new Error(`API: ${json.error.message || JSON.stringify(json.error)}`));
          const content = json.content?.[0]?.text || json.choices?.[0]?.message?.content || '';
          if (!content) return reject(new Error(`Resposta vazia da API. Status: ${r.statusCode}`));
          resolve(content);
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}\nBody: ${d.slice(0, 500)}`));
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ---------------------------------------------------------------
// Executa um agente com tarefa + contexto + schema de resposta
//
// @param {string}  agentId   — id do agente (ex: 'copy-writer')
// @param {string}  task      — descrição da tarefa
// @param {object}  context   — dados de contexto passados ao agente
// @param {object}  schema    — schema JSON esperado na resposta
// @param {boolean} [verbose] — imprime system prompt se true
// ---------------------------------------------------------------
async function runAgent({ agentId, task, context = {}, schema = {}, verbose = false }) {
  const env = loadEnv();
  const apiKey = env.ANTHROPIC_API_KEY || env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY não configurado em .env\n' +
      'Adicione a linha: ANTHROPIC_API_KEY=sk-ant-...\n' +
      'Ou: OPENROUTER_API_KEY=sk-or-...'
    );
  }

  const isOpenRouter = !env.ANTHROPIC_API_KEY && !!env.OPENROUTER_API_KEY;
  const apiLabel = isOpenRouter ? 'OpenRouter' : 'Anthropic';

  const persona = loadFile(path.join(AGENTS_DIR, `${agentId}.md`));
  const brandbook = loadFile(BRANDBOOK_PATH);
  const mindCouncil = loadFile(MIND_COUNCIL_PATH);

  const systemPrompt = [
    '# AGENTE SOCIAL MEDIA SQUAD — CARBON FILMS',
    '',
    persona ? `## PERSONA DO AGENTE\n${persona}` : '',
    '',
    brandbook ? `## BRANDBOOK CARBON FILMS\n${brandbook}` : '',
    '',
    mindCouncil ? `## MIND COUNCIL FRAMEWORKS\n${mindCouncil}` : '',
    '',
    '## INSTRUÇÃO CRÍTICA',
    'Responda SEMPRE em JSON válido conforme o schema solicitado.',
    'Nunca inclua texto fora do JSON. Use apenas o JSON puro ou um bloco ```json.',
    'Escreva todo o conteúdo em português do Brasil.',
    'Use voz da Carbon Films: direto, sem emoji, bold, autoridade.',
  ].filter(Boolean).join('\n');

  const userMessage = [
    `## TAREFA\n${task}`,
    '',
    `## CONTEXTO\n\`\`\`json\n${JSON.stringify(context, null, 2)}\n\`\`\``,
    '',
    `## SCHEMA DE RESPOSTA\n\`\`\`json\n${JSON.stringify(schema, null, 2)}\n\`\`\``,
    '',
    'Retorne o JSON preenchido conforme o schema acima.',
  ].join('\n');

  if (verbose) {
    console.log(`\n  [${agentId}] API: ${apiLabel}`);
    console.log(`  [${agentId}] System prompt: ${systemPrompt.length} chars`);
  }

  const rawResponse = await callClaudeApi({ apiKey, isOpenRouter, systemPrompt, userMessage });

  try {
    return extractJson(rawResponse);
  } catch (e) {
    throw new Error(
      `Agente ${agentId} retornou JSON inválido:\n` +
      rawResponse.slice(0, 500) + '\n' +
      `Parse error: ${e.message}`
    );
  }
}

module.exports = { runAgent, loadEnv };
