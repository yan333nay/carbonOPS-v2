#!/usr/bin/env node
'use strict';

/**
 * Remi — Remotion Video Renderer (CLI)
 * Renderiza templates stickman para o pipeline de vídeo.
 *
 * Uso:
 *   node remi-render.js motivacional
 *   node remi-render.js acao
 *   node remi-render.js motivacional --preview     (abre Remotion Studio)
 *   node remi-render.js list                       (lista templates)
 *   node remi-render.js install                    (instala deps Remotion)
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const REMOTION_DIR = path.join(ROOT, 'remotion');
const OUTPUT_DIR = path.join(ROOT, 'output', 'videos');

const TEMPLATES = {
  motivacional: {
    id: 'StickmanMotivacional',
    label: 'Stickman Motivacional v1',
    duration: '33s',
    file: 'stickman-motivacional.mp4',
    yaml: 'templates/video-templates/stickman-motivacional-v1.yaml',
  },
  acao: {
    id: 'StickmanAcaoImediata',
    label: 'Stickman Ação Imediata v1',
    duration: '32s',
    file: 'stickman-acao-imediata.mp4',
    yaml: 'templates/video-templates/stickman-acao-imediata-v1.yaml',
  },
};

function separator(title) {
  console.log('\n' + '='.repeat(50));
  if (title) console.log(`  ${title}`);
  console.log('='.repeat(50));
}

function ensureOutputDir() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
}

function checkRemotionInstalled() {
  const nodeModules = path.join(REMOTION_DIR, 'node_modules', 'remotion');
  return fs.existsSync(nodeModules);
}

function installRemotionDeps() {
  separator('INSTALANDO DEPENDÊNCIAS REMOTION');
  console.log('Isso pode levar 1-2 minutos...\n');
  execSync('npm install', {
    cwd: REMOTION_DIR,
    stdio: 'inherit',
  });
  console.log('\nDependências instaladas!');
}

function renderTemplate(templateKey, options = {}) {
  const template = TEMPLATES[templateKey];
  if (!template) {
    console.error(`Template "${templateKey}" não encontrado. Disponíveis: ${Object.keys(TEMPLATES).join(', ')}`);
    process.exit(1);
  }

  separator(`REMI — RENDERIZANDO ${template.label.toUpperCase()}`);
  console.log(`Composição: ${template.id}`);
  console.log(`Duração:    ${template.duration}`);
  console.log(`Saída:      output/videos/${template.file}\n`);

  if (!checkRemotionInstalled()) {
    console.log('Remotion não instalado. Instalando agora...');
    installRemotionDeps();
  }

  ensureOutputDir();
  const outputPath = path.join(OUTPUT_DIR, template.file);

  if (options.preview) {
    // Abre Remotion Studio para preview
    separator('ABRINDO REMOTION STUDIO');
    console.log('Pressione Ctrl+C para fechar.\n');
    const studio = spawn('npx', ['remotion', 'studio', 'src/Root.tsx'], {
      cwd: REMOTION_DIR,
      stdio: 'inherit',
      shell: true,
    });
    studio.on('error', err => {
      console.error('Erro ao abrir Studio:', err.message);
    });
    return;
  }

  // Render
  console.log('Iniciando render...');
  const startTime = Date.now();

  try {
    execSync(
      `npx remotion render src/Root.tsx ${template.id} --output "${outputPath}" --codec h264`,
      { cwd: REMOTION_DIR, stdio: 'inherit' }
    );

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const size = fs.existsSync(outputPath)
      ? (fs.statSync(outputPath).size / 1024 / 1024).toFixed(1)
      : '?';

    separator('RENDER CONCLUÍDO');
    console.log(`Arquivo: output/videos/${template.file}`);
    console.log(`Tamanho: ${size} MB`);
    console.log(`Tempo:   ${elapsed}s`);
    console.log('\nProximo passo: aprovar o vídeo e passar para o Rhythm (scheduler) postar.');

    // Salva resultado para o pipeline
    const resultFile = path.join(ROOT, 'data', 'video-latest.json');
    fs.writeFileSync(resultFile, JSON.stringify({
      template: templateKey,
      composition: template.id,
      output: outputPath,
      duration: template.duration,
      format: 'mp4',
      codec: 'h264',
      rendered_at: new Date().toISOString(),
      ready_for_post: false,
    }, null, 2));

    console.log('\nResultado salvo em data/video-latest.json');
    return outputPath;

  } catch (err) {
    console.error('\nErro durante o render:', err.message);
    console.log('\nDica: rode "node remi-render.js install" para reinstalar as deps.');
    process.exit(1);
  }
}

function listTemplates() {
  separator('TEMPLATES DISPONÍVEIS — REMI');
  for (const [key, tpl] of Object.entries(TEMPLATES)) {
    const installed = checkRemotionInstalled() ? 'pronto' : 'remotion não instalado';
    console.log(`\n  ${key}`);
    console.log(`    Nome:    ${tpl.label}`);
    console.log(`    Duração: ${tpl.duration}`);
    console.log(`    ID:      ${tpl.id}`);
    console.log(`    Status:  ${installed}`);
  }
  console.log('\nUso:');
  console.log('  node remi-render.js motivacional           # renderizar');
  console.log('  node remi-render.js motivacional --preview # abrir no Studio');
  console.log('  node remi-render.js install                # instalar Remotion');
}

// ---------------------------------------------------------------
// CLI
// ---------------------------------------------------------------
const [,, cmd, ...rest] = process.argv;

switch (cmd) {
  case 'motivacional':
  case 'acao':
    renderTemplate(cmd, { preview: rest.includes('--preview') });
    break;

  case 'list':
    listTemplates();
    break;

  case 'install':
    installRemotionDeps();
    break;

  default:
    console.log('Remi — Remotion Editor (Carbon Films)\n');
    console.log('Comandos:');
    console.log('  node remi-render.js list              # listar templates');
    console.log('  node remi-render.js motivacional      # renderizar template 1');
    console.log('  node remi-render.js acao              # renderizar template 2');
    console.log('  node remi-render.js motivacional --preview  # preview no Studio');
    console.log('  node remi-render.js install           # instalar dependências');
}
