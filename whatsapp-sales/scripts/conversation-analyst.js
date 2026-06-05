/**
 * conversation-analyst.js — Analisa conversas do SDR e gera relatório de gaps.
 *
 * Lê todos os contatos com histórico de conversa, agrupa por resultado
 * (reunião / perdido / em andamento) e usa Claude Sonnet para identificar:
 * - Padrões de abandono (onde a conversa morre)
 * - Tom e linguagem problemáticos
 * - Objeções não tratadas
 * - O que funciona vs o que não funciona
 * - Sugestões concretas de melhoria
 *
 * Uso: node scripts/conversation-analyst.js
 * Saída: logs/analysis-YYYY-MM-DD.json + resumo no terminal (+ WhatsApp do Yan)
 */
require('dotenv').config({ path: __dirname + '/../.env' });
const fs      = require('fs');
const path    = require('path');
const Anthropic = require('@anthropic-ai/sdk');
const { sendText } = require('../src/evolution');

const DB_PATH          = path.join(__dirname, '..', 'data', 'campaign-db.json');
const LOGS_DIR         = path.join(__dirname, '..', 'logs');
const LEARNED_RULES_PATH = path.join(__dirname, '..', 'data', 'learned-rules.json');
const OWNER            = process.env.OWNER_WHATSAPP || '';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function loadDB() {
  if (!fs.existsSync(DB_PATH)) return { contacts: [] };
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function formatConversation(contact) {
  const history = (contact.conversationHistory || []);
  if (history.length === 0) return null;

  const turns = history.map(m => {
    const who = m.role === 'assistant' ? 'BOT' : 'LEAD';
    return `${who}: ${(m.content || '').substring(0, 300)}`;
  }).join('\n');

  return {
    nome:    contact.nome,
    nicho:   contact.nicho || 'imobiliarias',
    status:  contact.status,
    stage:   contact.negotiationStage,
    turnoLead: history.filter(m => m.role === 'user').length,
    resultado: contact.status === 'meeting_scheduled' ? 'REUNIAO'
             : contact.status === 'closed_won'        ? 'FECHADO'
             : (contact.status || '').startsWith('closed_lost') ? 'PERDIDO'
             : (contact.status || '').startsWith('closed_')    ? 'ENCERRADO'
             : 'EM_ANDAMENTO',
    conversa: turns,
  };
}

async function analyzeConversations(samples) {
  const resumo = samples.map((s, i) =>
    `--- CONVERSA ${i + 1} [${s.resultado}] ${s.nome} (${s.nicho}) ---\n${s.conversa}`
  ).join('\n\n');

  const prompt = `Você é um especialista em vendas consultivas B2B pelo WhatsApp.

Analise as conversas abaixo entre um SDR (BOT) e leads de uma agência de marketing digital (Carbon Films, SC).
O SDR vende: landing pages, sites, bots de IA, tráfego pago.

CONVERSAS:
${resumo}

Gere uma análise objetiva com estas seções:

1. PADRÕES DE ABANDONO
Onde e por que as conversas morrem? Identifique os pontos exatos (turno X, tipo de resposta).

2. PROBLEMAS DE TOM E LINGUAGEM
Frases específicas que soam robóticas, repetitivas ou que afastam o lead. Cite exemplos reais das conversas.

3. OBJEÇÕES NÃO TRATADAS
Objeções que o bot não souber lidar bem. O que o lead disse e o que o bot deveria ter respondido.

4. O QUE ESTÁ FUNCIONANDO
Padrões de mensagem ou abordagem que geraram engajamento real.

5. TOP 5 MELHORIAS PRIORITÁRIAS
Lista enumerada, da mais impactante para a menos. Cada item: problema específico + solução concreta + exemplo de como reescrever.

Seja direto e específico. Cite trechos reais das conversas quando possível. Limite: 800 palavras.`;

  const response = await client.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 2000,
    messages:   [{ role: 'user', content: prompt }],
  });

  return response.content[0].text.trim();
}

async function extractRules(analysis) {
  const prompt = `Você é um engenheiro de prompts especializado em SDR WhatsApp.

Com base na análise de conversas abaixo, extraia exatamente 5 regras de comportamento acionáveis para um bot de vendas.

Cada regra deve:
- Ser uma instrução direta no imperativo (ex: "Nunca responda X sem antes Y")
- Ter no máximo 120 caracteres
- Ser baseada em padrão real identificado na análise
- Ser diferente das regras permanentes já existentes (saudações, preço, traço)

ANÁLISE:
${analysis}

Responda APENAS com um JSON no formato:
{ "rules": ["regra 1", "regra 2", "regra 3", "regra 4", "regra 5"] }

Nenhum texto fora do JSON.`;

  const response = await client.messages.create({
    model:      'claude-sonnet-4-6',
    max_tokens: 600,
    messages:   [{ role: 'user', content: prompt }],
  });

  try {
    const json = JSON.parse(response.content[0].text.trim());
    return (json.rules || []).filter(r => r && r.length < 160);
  } catch {
    console.error('[analyst] Falha ao parsear regras extraídas');
    return [];
  }
}

async function main() {
  console.log('[analyst] Iniciando análise de conversas...');
  const db = loadDB();

  // Seleciona contatos com histórico real (pelo menos 2 turnos do lead)
  const withHistory = db.contacts
    .map(formatConversation)
    .filter(Boolean)
    .filter(c => c.turnoLead >= 1);

  if (withHistory.length === 0) {
    console.log('[analyst] Nenhuma conversa com histórico suficiente para analisar.');
    return;
  }

  // Agrupa por resultado para análise balanceada
  const grupos = {
    REUNIAO:      withHistory.filter(c => c.resultado === 'REUNIAO'),
    PERDIDO:      withHistory.filter(c => c.resultado === 'PERDIDO'),
    EM_ANDAMENTO: withHistory.filter(c => c.resultado === 'EM_ANDAMENTO'),
    ENCERRADO:    withHistory.filter(c => c.resultado === 'ENCERRADO'),
  };

  console.log(`[analyst] Históricos: ${withHistory.length} total`);
  Object.entries(grupos).forEach(([k, v]) => console.log(`  ${k}: ${v.length}`));

  // Monta amostra representativa: até 5 de cada grupo, priorizando conversas longas
  const sortByTurns = arr => [...arr].sort((a, b) => b.turnoLead - a.turnoLead);
  const samples = [
    ...sortByTurns(grupos.REUNIAO).slice(0, 3),
    ...sortByTurns(grupos.PERDIDO).slice(0, 5),
    ...sortByTurns(grupos.EM_ANDAMENTO).slice(0, 4),
    ...sortByTurns(grupos.ENCERRADO).slice(0, 3),
  ];

  if (samples.length === 0) {
    console.log('[analyst] Amostra vazia — sem histórico suficiente.');
    return;
  }

  console.log(`[analyst] Analisando ${samples.length} conversas com Claude Sonnet...`);
  const analysis = await analyzeConversations(samples);

  // Salva JSON completo
  const reportPath = path.join(LOGS_DIR, `analysis-${todayStr()}.json`);
  const report = {
    date:       todayStr(),
    generatedAt: new Date().toISOString(),
    totalWithHistory: withHistory.length,
    sampleSize: samples.length,
    breakdown:  Object.fromEntries(Object.entries(grupos).map(([k, v]) => [k, v.length])),
    analysis,
  };
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`[analyst] Relatório salvo em ${reportPath}`);

  // Extrai regras acionáveis e persiste em learned-rules.json
  console.log('[analyst] Extraindo regras acionáveis...');
  const newRules = await extractRules(analysis);
  if (newRules.length > 0) {
    let existing = { lastUpdated: null, rules: [] };
    try { existing = JSON.parse(fs.readFileSync(LEARNED_RULES_PATH, 'utf8')); } catch { /* primeiro write */ }
    existing.rules    = newRules;
    existing.lastUpdated = new Date().toISOString();
    fs.writeFileSync(LEARNED_RULES_PATH, JSON.stringify(existing, null, 2));
    console.log(`[analyst] ${newRules.length} regras salvas em learned-rules.json`);
  }

  // Exibe no terminal
  console.log('\n' + '='.repeat(60));
  console.log('ANÁLISE DE CONVERSAS SDR — ' + todayStr());
  console.log('='.repeat(60));
  console.log(analysis);
  if (newRules.length > 0) {
    console.log('\n--- REGRAS EXTRAÍDAS ---');
    newRules.forEach((r, i) => console.log(`${i + 1}. ${r}`));
  }
  console.log('='.repeat(60) + '\n');

  // Envia resumo para o Yan via WhatsApp (primeiros 1500 chars)
  if (OWNER) {
    const resumoWA = `Analise de conversas SDR ${todayStr()}\n\n` + analysis.substring(0, 1400) + (analysis.length > 1400 ? '\n\n[ver log completo em logs/analysis-' + todayStr() + '.json]' : '');
    await sendText(OWNER, resumoWA).catch(err => console.error('[analyst] Erro ao enviar WhatsApp:', err.message));
    console.log('[analyst] Resumo enviado para', OWNER);
  }
}

main().catch(err => {
  console.error('[analyst] ERRO:', err.message);
  process.exit(1);
});
