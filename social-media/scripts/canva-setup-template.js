#!/usr/bin/env node
'use strict';

/**
 * canva-setup-template.js
 * Encontra e salva o ID do template de carousel do Canva.
 *
 * Como funciona:
 *   1. Lista todos os designs do usuário no Canva
 *   2. Usuário escolhe qual é o template de carousel
 *   3. Salva o ID em data/canva-template-ids.json
 *
 * Uso:
 *   node canva-setup-template.js
 *   node canva-setup-template.js --url "https://www.canva.com/design/DAxxxxxxx/edit"
 */

const readline = require('readline');
const fs = require('fs');
const path = require('path');

const client = require('./canva-client');
const ROOT = path.join(__dirname, '..');
const TEMPLATE_IDS_PATH = path.join(ROOT, 'data', 'canva-template-ids.json');

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

function separator(title) {
  console.log('\n' + '='.repeat(50));
  if (title) console.log(`  ${title}`);
  console.log('='.repeat(50));
}

function extractDesignIdFromUrl(url) {
  const match = url.match(/design\/([A-Za-z0-9_-]+)\//);
  return match ? match[1] : null;
}

function saveTemplateIds(ids) {
  fs.writeFileSync(TEMPLATE_IDS_PATH, JSON.stringify(ids, null, 2));
  console.log(`\nSalvo em: data/canva-template-ids.json`);
}

function loadTemplateIds() {
  try {
    return JSON.parse(fs.readFileSync(TEMPLATE_IDS_PATH, 'utf8'));
  } catch {
    return {};
  }
}

async function setupViaUrl(url) {
  const designId = extractDesignIdFromUrl(url);
  if (!designId) {
    console.error('URL inválida. Formato esperado: https://www.canva.com/design/DAxxxxxxx/edit');
    process.exit(1);
  }

  separator('VERIFICANDO DESIGN NO CANVA');
  console.log(`ID extraído: ${designId}`);

  try {
    const design = await client.getDesign(designId);
    console.log(`Nome:    ${design.title || '(sem título)'}`);
    console.log(`Tipo:    ${design.design_type?.name || 'desconhecido'}`);
    console.log(`URL:     ${client.getEditorUrl(designId)}`);

    const confirm = await prompt('\nEsse é o template de carousel correto? (s/n): ');
    if (confirm.toLowerCase() !== 's') {
      console.log('Cancelado.');
      return;
    }

    const ids = loadTemplateIds();
    ids.carousel = designId;
    ids.carousel_title = design.title || 'Carousel Carbon Films';
    ids.carousel_editor_url = client.getEditorUrl(designId);
    ids.updated_at = new Date().toISOString();
    saveTemplateIds(ids);

    separator('TEMPLATE CONFIGURADO');
    console.log(`ID:      ${designId}`);
    console.log(`Nome:    ${ids.carousel_title}`);
    console.log('\nPipeline de carousel agora vai usar este template como base.');
    console.log('Para usar, rode: node run-workflow.js carousel --topic "seu topico"');

  } catch (err) {
    console.error(`Erro ao buscar design: ${err.message}`);
    process.exit(1);
  }
}

async function setupViaList() {
  separator('BUSCANDO DESIGNS DO CANVA');
  console.log('Carregando seus designs...\n');

  let designs;
  try {
    designs = await client.listDesigns(50);
  } catch (err) {
    console.error(`Erro ao listar designs: ${err.message}`);
    console.log('\nDica: verifique se o CANVA_ACCESS_TOKEN está configurado no .env');
    console.log('Execute: node canva-auth.js para autenticar');
    process.exit(1);
  }

  if (!designs.length) {
    console.log('Nenhum design encontrado na conta.');
    process.exit(0);
  }

  // Filtra designs que parecem ser carousel (por nome ou dimensões)
  const carouselLike = designs.filter(d => {
    const name = (d.title || '').toLowerCase();
    const isSquare = d.thumbnail?.width === d.thumbnail?.height;
    return name.includes('carros') || name.includes('carousel') ||
           name.includes('carbon') || name.includes('slide') || isSquare;
  });

  const display = carouselLike.length > 0 ? carouselLike : designs;

  console.log(`${display.length} designs encontrados:\n`);
  display.forEach((d, i) => {
    const date = d.updated_at
      ? new Date(d.updated_at * 1000).toLocaleDateString('pt-BR')
      : '—';
    console.log(`  ${String(i + 1).padStart(2)}. ${d.title || '(sem título)'} — ${date}`);
    console.log(`      ID: ${d.id} | URL: ${client.getEditorUrl(d.id)}`);
  });

  console.log('\n  0. Digitar URL manualmente');
  const choice = await prompt('\nNúmero do template de carousel: ');

  if (choice === '0') {
    const url = await prompt('Cole a URL do Canva: ');
    await setupViaUrl(url);
    return;
  }

  const idx = parseInt(choice) - 1;
  if (isNaN(idx) || idx < 0 || idx >= display.length) {
    console.error('Opção inválida.');
    process.exit(1);
  }

  const selected = display[idx];
  console.log(`\nSelecionado: "${selected.title || selected.id}"`);
  console.log(`URL: ${client.getEditorUrl(selected.id)}`);

  const confirm = await prompt('Confirmar? (s/n): ');
  if (confirm.toLowerCase() !== 's') {
    console.log('Cancelado.');
    return;
  }

  const ids = loadTemplateIds();
  ids.carousel = selected.id;
  ids.carousel_title = selected.title || 'Carousel Carbon Films';
  ids.carousel_editor_url = client.getEditorUrl(selected.id);
  ids.updated_at = new Date().toISOString();
  saveTemplateIds(ids);

  separator('TEMPLATE CONFIGURADO');
  console.log(`ID:    ${selected.id}`);
  console.log(`Nome:  ${ids.carousel_title}`);
  console.log(`\nPipeline configurada para usar este template.`);
  console.log('Rode: node run-workflow.js carousel --topic "seu topico"');
}

async function showStatus() {
  const ids = loadTemplateIds();
  if (!ids.carousel) {
    console.log('Nenhum template configurado ainda.');
    console.log('Execute: node canva-setup-template.js');
    return;
  }
  console.log('Template configurado:');
  console.log(`  ID:      ${ids.carousel}`);
  console.log(`  Nome:    ${ids.carousel_title || '—'}`);
  console.log(`  URL:     ${ids.carousel_editor_url || client.getEditorUrl(ids.carousel)}`);
  console.log(`  Salvo:   ${ids.updated_at || '—'}`);
}

// ---------------------------------------------------------------
// CLI
// ---------------------------------------------------------------
(async () => {
  const args = process.argv.slice(2);

  if (args.includes('--status')) {
    await showStatus();
    return;
  }

  const urlIdx = args.indexOf('--url');
  if (urlIdx !== -1) {
    await setupViaUrl(args[urlIdx + 1]);
    return;
  }

  // Modo interativo: lista designs
  await setupViaList();
})().catch(err => {
  console.error('Erro:', err.message);
  process.exit(1);
});
