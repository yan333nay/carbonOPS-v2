#!/usr/bin/env node
/**
 * Auditoria a cada 30 min:
 * 1. Verifica se o webhook-server está rodando (porta 3001)
 * 2. Detecta leads em negociação onde o bot não respondeu
 * 3. Loga relatório com resumo de saúde do sistema
 */
require('dotenv').config({ path: __dirname + '/../.env' });
const { execSync, spawn } = require('child_process');
const fs   = require('fs');
const path = require('path');

const DB_PATH  = path.join(__dirname, '..', 'data', 'campaign-db.json');
const LOG_PATH = path.join(__dirname, '..', 'logs', 'audit.log');
const ROOT     = path.join(__dirname, '..');

function log(msg) {
  const line = `[audit] ${new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })} — ${msg}`;
  console.log(line);
}

// ─── 1. Checar se porta 3001 está ativa ──────────────────────────────────────
function isWebhookRunning() {
  try {
    const out = execSync('ss -tlnp 2>/dev/null | grep :3001', { encoding: 'utf8', timeout: 5000 });
    return out.trim().length > 0;
  } catch {
    return false;
  }
}

function restartWebhook() {
  log('ALERTA: webhook-server OFFLINE — reiniciando...');
  const child = spawn('node', ['webhook-server.js'], {
    cwd: ROOT,
    detached: true,
    stdio: ['ignore', fs.openSync(path.join(ROOT, 'logs/webhook.log'), 'a'), fs.openSync(path.join(ROOT, 'logs/webhook.log'), 'a')],
  });
  child.unref();
  log(`Webhook reiniciado (PID ${child.pid})`);
}

// ─── 2. Detectar leads sem resposta ──────────────────────────────────────────
function auditLeads() {
  if (!fs.existsSync(DB_PATH)) {
    log('DB não encontrado — nada a auditar');
    return;
  }

  const db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
  const contacts = db.contacts || [];

  const semResposta = [];
  const travadasMuito = [];
  const now = Date.now();
  const TRINTA_MIN = 30 * 60 * 1000;
  const QUATRO_HORAS = 4 * 60 * 60 * 1000;

  for (const c of contacts) {
    if (c.status !== 'negotiating') continue;

    const hist = c.conversationHistory || [];
    if (!hist.length) continue;

    const last = hist[hist.length - 1];

    // Último turno é do usuário = bot recebeu mas não respondeu
    if (last.role === 'user') {
      const ts = last.timestamp ? new Date(last.timestamp).getTime() : 0;
      const atraso = ts ? Math.round((now - ts) / 60000) : null;
      semResposta.push({ nome: c.nome, atrasoMin: atraso });
    }

    // Em negociação há mais de 4h sem nenhuma atividade (respondedAt antigo)
    if (c.respondedAt) {
      const ultimaAtividade = new Date(c.respondedAt).getTime();
      if (now - ultimaAtividade > QUATRO_HORAS && last.role === 'assistant') {
        travadasMuito.push({ nome: c.nome, ultimaAtividade: c.respondedAt });
      }
    }
  }

  // Relatório
  const totalNegociando = contacts.filter(c => c.status === 'negotiating').length;
  const totalPendente   = contacts.filter(c => c.status === 'pending').length;
  const totalFechados   = contacts.filter(c => ['closed_won','closed_lost','closed_bot','closed_sem_resposta'].includes(c.status)).length;

  log(`--- RELATÓRIO DE SAÚDE ---`);
  log(`Leads em negociação: ${totalNegociando} | Pendentes: ${totalPendente} | Fechados: ${totalFechados}`);

  if (semResposta.length === 0) {
    log('OK: todos os leads em negociação foram respondidos');
  } else {
    log(`ALERTA: ${semResposta.length} lead(s) SEM resposta do bot:`);
    for (const l of semResposta) {
      log(`  - ${l.nome}${l.atrasoMin ? ` (há ${l.atrasoMin} min)` : ''}`);
    }
  }

  if (travadasMuito.length > 0) {
    log(`INFO: ${travadasMuito.length} lead(s) em negociação sem atividade há +4h (aguardando resposta do lead):`);
    for (const l of travadasMuito) {
      log(`  - ${l.nome} (última atividade: ${new Date(l.ultimaAtividade).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })})`);
    }
  }
}

// ─── 3. Checar instância Evolution conectada ─────────────────────────────────
async function checkEvolution() {
  try {
    const res = await fetch(`${process.env.EVOLUTION_URL}/instance/connectionState/${process.env.EVOLUTION_INSTANCE}`, {
      headers: { apikey: process.env.EVOLUTION_API_KEY },
    });
    const data = await res.json();
    const state = data?.instance?.state || 'unknown';
    if (state !== 'open') {
      log(`ALERTA: Evolution API — instância ${process.env.EVOLUTION_INSTANCE} desconectada! Estado: ${state}`);
    } else {
      log(`OK: WhatsApp conectado (Evolution state: open)`);
    }
  } catch (err) {
    log(`ALERTA: Evolution API inacessível — ${err.message}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────
(async () => {
  log('=== AUDITORIA INICIADA ===');

  // 1. Webhook
  if (!isWebhookRunning()) {
    restartWebhook();
  } else {
    log('OK: webhook-server rodando na porta 3001');
  }

  // 2. Evolution
  await checkEvolution();

  // 3. Leads
  auditLeads();

  log('=== AUDITORIA CONCLUÍDA ===\n');
})();
