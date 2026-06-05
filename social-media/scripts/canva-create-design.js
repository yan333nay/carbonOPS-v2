#!/usr/bin/env node
'use strict';

/**
 * Pixel — Canva Design Creator
 *
 * Uso: node canva-create-design.js <command> [titulo]
 *
 * Exemplos:
 *   node canva-create-design.js feed-impactante "Carbon Films - Post Semanal"
 *   node canva-create-design.js carrossel-edu "7 Erros de Marketing"
 *   node canva-create-design.js stories-simples
 */

const client = require('./canva-client');

const BRANDBOOK = {
  colors: {
    bg: '#050505',
    gold: '#C9A84C',
    white: '#FFFFFF',
    gray_400: '#A0A0A0',
  },
  fonts: {
    display: 'Anton',    // headlines, hooks
    body: 'Montserrat',  // corpo, CTAs
  },
  brand: 'Carbon Films',
  handle: '@carbonfilms.sc',
};

const COMMAND_DESCRIPTIONS = {
  'feed-impactante':   'Feed 4:5 — Visual forte, hook, texto mínimo (1080x1350)',
  'stories-simples':   'Story 9:16 — CTA direto, interacao (1080x1920)',
  'carrossel-edu':     'Carrossel 1:1 — Educacional, 8-10 slides, gera saves (1080x1080)',
  'reels-trend':       'Reels 9:16 — Trending sound, corte rapido (1080x1920)',
  'resultado-cliente': 'Feed 1:1 — Prova social, antes/depois (1080x1080)',
  'bastidores':        'Stories/Reels 9:16 — Raw, autentico (1080x1920)',
  'tiktok-viral':      'TikTok 9:16 — Hook 3s, loop, FYP (1080x1920)',
  'autoridade':        'Feed 4:5 — Posicionamento, opiniao forte (1080x1350)',
  'edicao-basica':     'Feed 1:1 — Branding simples aplicado (1080x1080)',
};

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  const title = args[1];

  if (!command || command === '--help' || command === '-h') {
    console.log('\nPixel — Canva Design Creator\n');
    console.log('Uso: node canva-create-design.js <command> [titulo]\n');
    console.log('Commands disponíveis:');
    for (const [cmd, desc] of Object.entries(COMMAND_DESCRIPTIONS)) {
      console.log(`  /${cmd.padEnd(20)} ${desc}`);
    }
    console.log('\nExemplos:');
    console.log('  node canva-create-design.js feed-impactante "Carbon Films - Post"');
    console.log('  node canva-create-design.js carrossel-edu "7 Erros de Marketing"');
    process.exit(0);
  }

  if (!COMMAND_DESCRIPTIONS[command]) {
    console.error(`\nErro: comando "${command}" nao encontrado.`);
    console.error(`Use um dos: ${Object.keys(COMMAND_DESCRIPTIONS).join(', ')}`);
    process.exit(1);
  }

  const designTitle = title || `Carbon Films — ${command} — ${new Date().toLocaleDateString('pt-BR')}`;
  const spec = client.COMMAND_SPECS[command];

  console.log(`\nPixel — Criando design Carbon Films`);
  console.log(`Command:    /${command}`);
  console.log(`Titulo:     ${designTitle}`);
  console.log(`Dimensoes:  ${spec.width}x${spec.height}px`);
  console.log(`Brandbook:  Carbon Black (#050505) + Gold (#C9A84C)\n`);

  try {
    // Create design
    process.stdout.write('Criando design no Canva...');
    const design = await client.createDesign(command, designTitle);
    console.log(` OK — ID: ${design.id}`);

    // Get editor URL
    const editorUrl = client.getEditorUrl(design.id);

    console.log('\n--- DESIGN CRIADO ---');
    console.log(`ID:     ${design.id}`);
    console.log(`Titulo: ${design.title}`);
    console.log(`URL:    ${editorUrl}`);

    console.log('\n--- BRIEFING BRANDBOOK CARBON FILMS ---');
    console.log(`Background:  ${BRANDBOOK.colors.bg} (Carbon Black)`);
    console.log(`Accent:      ${BRANDBOOK.colors.gold} (Carbon Gold)`);
    console.log(`Fonte titulo: ${BRANDBOOK.fonts.display} — UPPERCASE, tight letter-spacing`);
    console.log(`Fonte corpo:  ${BRANDBOOK.fonts.body} — weights 300/400/700/800`);
    console.log(`Handle:      ${BRANDBOOK.handle} (bottom, JetBrains Mono gray)`);
    console.log(`Emojis:      PROIBIDOS`);

    console.log('\n--- PROXIMO PASSO ---');
    console.log('Abra o link acima para editar o design no Canva.');
    console.log('Aplique o brandbook e exporte quando pronto.\n');

    // Save design ID for future export
    const outputPath = `squads/social-media-squad/data/designs-queue.json`;
    let queue = [];
    try {
      queue = JSON.parse(require('fs').readFileSync(outputPath, 'utf8'));
    } catch {
      // file doesn't exist yet
    }
    queue.push({
      id: design.id,
      command,
      title: designTitle,
      dimensions: `${spec.width}x${spec.height}`,
      created_at: new Date().toISOString(),
      status: 'editing',
      editor_url: editorUrl,
    });
    require('fs').writeFileSync(outputPath, JSON.stringify(queue, null, 2));
    console.log(`Design registrado em: ${outputPath}`);

  } catch (err) {
    console.error(`\nErro: ${err.message}`);
    process.exit(1);
  }
}

main();
