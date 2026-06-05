#!/usr/bin/env node
/**
 * scheduler.js — Social Media Squad Scheduler
 *
 * Lê o weekly-plan.json e executa tarefas nos horários definidos.
 * Carousels são gerados automaticamente; aprovação manual antes de postar.
 *
 * Uso:
 *   node scripts/scheduler.js start          # inicia o scheduler (fica rodando)
 *   node scripts/scheduler.js status         # mostra agenda do dia
 *   node scripts/scheduler.js next           # próxima tarefa agendada
 *   node scripts/scheduler.js run <day> <hh:mm>  # força execução de um slot
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

const ROOT         = path.join(__dirname, '..');
const WEEKLY_PLAN  = path.join(ROOT, 'data', 'weekly-plan.json');
const LOG_FILE     = path.join(ROOT, 'output', 'scheduler.log');
const SCRIPTS_DIR  = __dirname;

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const DAY_LABELS = { sunday: 'Dom', monday: 'Seg', tuesday: 'Ter', wednesday: 'Qua', thursday: 'Qui', friday: 'Sex', saturday: 'Sáb' };

// ---------------------------------------------------------------
// Logging
// ---------------------------------------------------------------
function log(msg) {
  const ts = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const line = `[${ts}] ${msg}`;
  console.log(line);
  try {
    if (!fs.existsSync(path.dirname(LOG_FILE))) fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    fs.appendFileSync(LOG_FILE, line + '\n');
  } catch { /* silent */ }
}

// ---------------------------------------------------------------
// Carrega o plano semanal
// ---------------------------------------------------------------
function loadPlan() {
  return JSON.parse(fs.readFileSync(WEEKLY_PLAN, 'utf8'));
}

// ---------------------------------------------------------------
// Retorna dia da semana atual (string: 'monday', etc.)
// ---------------------------------------------------------------
function todayKey() {
  return DAY_KEYS[new Date().getDay()];
}

// ---------------------------------------------------------------
// Retorna HH:MM atual no fuso BRT (UTC-3)
// ---------------------------------------------------------------
function nowBRT() {
  const now = new Date();
  const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  const hh = String(brt.getUTCHours()).padStart(2, '0');
  const mm = String(brt.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function nowSeconds() {
  const now = new Date();
  const brt = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  return brt.getUTCHours() * 3600 + brt.getUTCMinutes() * 60 + brt.getUTCSeconds();
}

function timeToSeconds(hhmm) {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 3600 + m * 60;
}

// ---------------------------------------------------------------
// Executa um slot específico
// ---------------------------------------------------------------
async function executeSlot(day, slot) {
  const label = `[${DAY_LABELS[day] || day} ${slot.time}] [${slot.format.toUpperCase()}]`;

  log(`${label} Iniciando execução — pilar: ${slot.pillar}`);

  if (slot.format === 'carousel') {
    log(`${label} Gerando carousel (tema será alternado automaticamente)...`);
    try {
      // Extrai tópico do topic_type para passar como hint
      const topicHints = {
        'educativo': 'dicas de marketing digital para pequenos negócios',
        'inspiracional': 'transformação de marca com marketing visual',
        'prova_social': 'resultados reais de clientes Carbon Films',
        'entretenimento': 'bastidores de uma agência de marketing',
      };
      const topicHint = topicHints[slot.pillar] || 'estratégias de marketing digital';

      log(`${label} Tópico: "${topicHint}"`);
      log(`${label} Executando: node run-workflow.js carousel --topic "${topicHint}"`);

      // Executa em modo não-interativo (sem stdin)
      const child = spawn('node', [
        path.join(SCRIPTS_DIR, 'run-workflow.js'),
        'carousel',
        '--topic', topicHint,
      ], {
        cwd: ROOT,
        stdio: ['ignore', 'pipe', 'pipe'],
        env: { ...process.env },
      });

      let output = '';
      child.stdout.on('data', d => { output += d; process.stdout.write(d); });
      child.stderr.on('data', d => { output += d; process.stderr.write(d); });

      await new Promise((resolve, reject) => {
        child.on('close', code => {
          if (code === 0) {
            log(`${label} Carousel gerado com sucesso.`);
            log(`${label} AGUARDANDO APROVAÇÃO → rode: node scripts/run-workflow.js post --from-latest`);
            resolve();
          } else {
            log(`${label} ERRO — exit code ${code}`);
            reject(new Error(`Exit ${code}`));
          }
        });
      });

    } catch (e) {
      log(`${label} FALHA: ${e.message}`);
    }

  } else if (slot.format === 'stories') {
    if (slot.auto_post) {
      log(`${label} Stories marcado como auto-post.`);
      log(`${label} NOTA: Auto-post de stories requer integração Meta API + conteúdo preparado.`);
      log(`${label} TODO: integrar com stories-generator quando implementado.`);
    } else {
      log(`${label} Stories aguarda criação manual.`);
    }

  } else if (slot.format === 'reel') {
    log(`${label} Reel agendado.`);
    log(`${label} NOTA: Reels requerem vídeo. Certifique-se de ter o arquivo pronto.`);
    log(`${label} Especialista: ${slot.specialist} — Insight: ${slot.insight}`);

  } else if (slot.format === 'static') {
    log(`${label} Static agendado — tipo: ${slot.topic_type}`);
    log(`${label} Gere o visual e use: node run-workflow.js post --from-latest`);

  } else if (slot.format === 'review') {
    log(`${label} === REVIEW SEMANAL (Neil Patel) ===`);
    log(`${label} Acesse o Instagram Insights e registre:`);
    log(`${label}   - Top 3 posts por saves/shares`);
    log(`${label}   - Taxa de engajamento média`);
    log(`${label}   - Crescimento de seguidores`);
    log(`${label}   - Ajuste de estratégia para próxima semana`);
    log(`${label} Score mínimo 7/10 para manter a estratégia.`);
  }

  log(`${label} Slot concluído.`);
}

// ---------------------------------------------------------------
// CMD: status — agenda do dia atual
// ---------------------------------------------------------------
function cmdStatus() {
  const plan = loadPlan();
  const today = todayKey();
  const dayPlan = plan.days[today];
  const now = nowBRT();

  console.log('\n' + '═'.repeat(55));
  console.log(`  Carbon Films — Agenda de Hoje (${DAY_LABELS[today] || today})`);
  console.log('═'.repeat(55));
  console.log(`  Horário BRT atual: ${now}`);
  console.log(`  Foco do dia: ${dayPlan?.focus || '—'}`);
  console.log('─'.repeat(55));

  if (!dayPlan || !dayPlan.slots.length) {
    console.log('  Nenhum slot agendado para hoje.');
    return;
  }

  for (const slot of dayPlan.slots) {
    const past = timeToSeconds(slot.time) < nowSeconds();
    const status = past ? '✓ passado' : '◎ pendente';
    const autoLabel = slot.auto_post ? '[auto]' : '[manual]';
    console.log(`\n  ${slot.time}  ${slot.format.padEnd(8)}  ${slot.pillar.padEnd(16)}  ${status}`);
    console.log(`         ${autoLabel}  Especialista: ${slot.specialist}`);
    if (slot.theme && slot.theme !== 'alternating') {
      console.log(`         Tema: ${slot.theme}`);
    } else if (slot.theme === 'alternating') {
      console.log('         Tema: alternando automaticamente');
    }
  }

  console.log('\n' + '─'.repeat(55));
  console.log('  Para iniciar o scheduler: node scripts/scheduler.js start');
  console.log('  Para forçar um slot:      node scripts/scheduler.js run <day> <hh:mm>');
  console.log('═'.repeat(55) + '\n');
}

// ---------------------------------------------------------------
// CMD: next — próxima tarefa
// ---------------------------------------------------------------
function cmdNext() {
  const plan = loadPlan();
  const today = todayKey();
  const currentSec = nowSeconds();

  // Procura no dia atual primeiro, depois nos próximos
  const dayOrder = [today, ...DAY_KEYS.filter(d => d !== today)];

  for (const day of dayOrder) {
    const dayPlan = plan.days[day];
    if (!dayPlan) continue;

    const slots = day === today
      ? dayPlan.slots.filter(s => timeToSeconds(s.time) > currentSec)
      : dayPlan.slots;

    if (slots.length > 0) {
      const next = slots[0];
      console.log('\n  Próximo slot agendado:');
      console.log(`  Dia:       ${DAY_LABELS[day] || day}`);
      console.log(`  Horário:   ${next.time} BRT`);
      console.log(`  Formato:   ${next.format}`);
      console.log(`  Pilar:     ${next.pillar}`);
      console.log(`  Execução:  ${next.auto_post ? 'automático' : 'aguarda aprovação'}`);
      console.log(`  Insight:   ${next.insight}\n`);
      return;
    }
  }

  console.log('  Nenhum slot encontrado.');
}

// ---------------------------------------------------------------
// CMD: run <day> <hh:mm> — força execução
// ---------------------------------------------------------------
async function cmdRun(args) {
  const day = args[0];
  const time = args[1];

  if (!day || !time) {
    console.error('Uso: node scheduler.js run <day> <hh:mm>');
    console.error('Exemplo: node scheduler.js run monday 09:00');
    process.exit(1);
  }

  const plan = loadPlan();
  const dayPlan = plan.days[day];

  if (!dayPlan) {
    console.error(`Dia não encontrado: ${day}`);
    console.error(`Dias válidos: ${DAY_KEYS.join(', ')}`);
    process.exit(1);
  }

  const slot = dayPlan.slots.find(s => s.time === time);
  if (!slot) {
    console.error(`Horário não encontrado: ${time} em ${day}`);
    const times = dayPlan.slots.map(s => s.time).join(', ');
    console.error(`Horários disponíveis para ${day}: ${times}`);
    process.exit(1);
  }

  log(`Execução forçada: ${day} ${time}`);
  await executeSlot(day, slot);
}

// ---------------------------------------------------------------
// CMD: start — loop principal do scheduler
// ---------------------------------------------------------------
async function cmdStart() {
  log('Scheduler iniciado. Aguardando horários agendados...');
  log('Timezone: BRT (UTC-3)');
  log('Pressione Ctrl+C para parar.\n');

  cmdStatus();

  const plan = loadPlan();
  const fired = new Set(); // controla slots já executados hoje

  // Verifica a cada 30 segundos
  const CHECK_INTERVAL = 30 * 1000;

  async function tick() {
    const today = todayKey();
    const now = nowBRT();
    const currentSec = nowSeconds();
    const dayPlan = plan.days[today];

    if (!dayPlan) return;

    for (const slot of dayPlan.slots) {
      const slotSec = timeToSeconds(slot.time);
      const key = `${today}-${slot.time}-${slot.format}`;

      // Janela de disparo: entre o horário exato e 2 minutos depois
      const withinWindow = currentSec >= slotSec && currentSec < (slotSec + 120);

      if (withinWindow && !fired.has(key)) {
        fired.add(key);
        log(`DISPARANDO slot: ${today} ${slot.time} [${slot.format}]`);
        executeSlot(today, slot).catch(e => log(`ERRO no slot ${key}: ${e.message}`));
      }
    }

    // Limpa fired ao virar o dia
    const midnight = DAY_KEYS[new Date().getDay()];
    if (midnight !== today) fired.clear();
  }

  // Executa imediatamente e depois a cada intervalo
  await tick();
  setInterval(tick, CHECK_INTERVAL);

  // Recarrega o plano a cada hora (permite atualização sem reiniciar)
  setInterval(() => {
    try {
      Object.assign(plan, loadPlan());
      log('Plano semanal recarregado.');
    } catch (e) {
      log(`AVISO: Falha ao recarregar plano: ${e.message}`);
    }
  }, 60 * 60 * 1000);
}

// ---------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------
const [, , cmd, ...args] = process.argv;

const commands = {
  start:  () => cmdStart(),
  status: () => { cmdStatus(); process.exit(0); },
  next:   () => { cmdNext();   process.exit(0); },
  run:    () => cmdRun(args),
};

if (!cmd || !commands[cmd]) {
  console.log('\nSocial Media Squad — Scheduler\n');
  console.log('Comandos:');
  console.log('  node scripts/scheduler.js start          # inicia o scheduler (loop contínuo)');
  console.log('  node scripts/scheduler.js status         # agenda do dia atual');
  console.log('  node scripts/scheduler.js next           # próximo slot agendado');
  console.log('  node scripts/scheduler.js run <day> <hh:mm>  # força execução de um slot');
  console.log('\nExemplos:');
  console.log('  node scripts/scheduler.js run monday 09:00');
  console.log('  node scripts/scheduler.js run tuesday 19:00');
  console.log('\nDias válidos: monday tuesday wednesday thursday friday saturday sunday\n');
  process.exit(0);
}

commands[cmd]().catch(err => {
  log(`ERRO FATAL: ${err.message}`);
  process.exit(1);
});
