#!/usr/bin/env node
'use strict';

/**
 * Social Media Squad — Orchestrator
 * Pipeline completo: Pesquisa → Copy → Design → Aprovacao → Instagram
 *
 * Uso:
 *   node run-workflow.js carousel --topic "3 erros de marketing"
 *   node run-workflow.js carousel --input briefing.json
 *   node run-workflow.js export <design_id>
 *   node run-workflow.js post --from-latest
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const readline = require('readline');

const ROOT = path.join(__dirname, '..');
const DATA_DIR = path.join(__dirname, '../data');
const LATEST_FILE = path.join(DATA_DIR, 'carousel-latest.json');
const ENV_PATH = path.join(__dirname, '../.env');
const MIND_COUNCIL_PATH = path.join(DATA_DIR, 'mind-council-frameworks.yaml');
const THEME_STATE_FILE = path.join(DATA_DIR, 'theme-state.json');
const POST_HISTORY_FILE = path.join(DATA_DIR, 'post-history.json');

// ---------------------------------------------------------------
// POST HISTORY — memória de tópicos já publicados
// ---------------------------------------------------------------
function loadPostHistory() {
  try { return JSON.parse(fs.readFileSync(POST_HISTORY_FILE, 'utf8')); } catch { return []; }
}

function isTopicDuplicate(topic) {
  const history = loadPostHistory();
  if (!history.length) return false;
  const norm = t => t.toLowerCase().replace(/[^a-z0-9\u00c0-\u024f]/g, '');
  const incoming = norm(topic);
  return history.some(p => {
    const similarity = incoming.split('').filter(c => norm(p.topic).includes(c)).length / incoming.length;
    return similarity > 0.7;
  });
}

function printPostHistory(limit = 10) {
  const history = loadPostHistory();
  if (!history.length) { console.log('  Nenhum post registrado ainda.'); return; }
  console.log(`\n  Ultimos ${Math.min(limit, history.length)} posts publicados:`);
  history.slice(0, limit).forEach((p, i) => {
    const date = new Date(p.posted_at).toLocaleDateString('pt-BR');
    console.log(`  ${i + 1}. [${date}] ${p.type.toUpperCase()} — ${p.topic}`);
  });
  console.log('');
}

// ---------------------------------------------------------------
// THEME ALTERNATION — dark → white → dark → white ...
// Lê theme-state.json, alterna e persiste o novo estado.
// ---------------------------------------------------------------
function getNextTheme() {
  let state = { last_theme: 'white', carousel_count: 0 };
  try { state = JSON.parse(fs.readFileSync(THEME_STATE_FILE, 'utf8')); } catch { /* first run */ }
  const next = state.last_theme === 'dark' ? 'white' : 'dark';
  const newState = { last_theme: next, carousel_count: (state.carousel_count || 0) + 1, note: state.note };
  fs.writeFileSync(THEME_STATE_FILE, JSON.stringify(newState, null, 2));
  return next;
}

// Agentes reais (lazy-require para não quebrar se dependências ausentes)
function getAgentRunner() { try { return require('./agent-runner'); } catch { return null; } }
function getApifyRunner() { try { return require('./apify-runner'); } catch { return null; } }

// ---------------------------------------------------------------
// MIND COUNCIL — carrega frameworks e simula consulta
// ---------------------------------------------------------------

function loadMindCouncil() {
  try {
    const raw = fs.readFileSync(MIND_COUNCIL_PATH, 'utf8');
    // Parse YAML manual (sem dependencia externa)
    const council = {};
    let current = null;
    for (const line of raw.split('\n')) {
      const specialistMatch = line.match(/^  (\w+):$/);
      if (specialistMatch) { current = specialistMatch[1]; council[current] = []; }
      const roleMatch = line.match(/^\s+role:\s+'(.+)'$/);
      if (roleMatch && current) council[current].role = roleMatch[1];
      const principleMatch = line.match(/^\s+principle:\s+'(.+)'$/);
      if (principleMatch && current) {
        if (!council[current].principles) council[current].principles = [];
        council[current].principles.push(principleMatch[1]);
      }
    }
    return council;
  } catch { return {}; }
}

const SPECIALIST_LABELS = {
  rafael_kiso: 'Rafael Kiso (Dados + Funil)',
  paulo_cuenca: 'Paulo Cuenca (Conteudo + Cordilheira)',
  gary_vaynerchuk: 'Gary Vaynerchuk (Copy + Volume)',
  neil_patel: 'Neil Patel (SEO + Score)',
  casey_neistat: 'Casey Neistat (Narrativa + Pacing + Hook)',
  peter_mckinnon: 'Peter McKinnon (Tipografia + Grade + Brand)',
};

function consultMindCouncil(stage, context) {
  const council = loadMindCouncil();

  const stageMap = {
    research: ['rafael_kiso', 'gary_vaynerchuk'],
    strategy: ['rafael_kiso', 'paulo_cuenca'],
    copy: ['gary_vaynerchuk', 'neil_patel'],
    design: ['paulo_cuenca'],
    performance: ['neil_patel'],
    video_edit: ['casey_neistat', 'peter_mckinnon'],
    hook_video: ['casey_neistat', 'gary_vaynerchuk'],
  };

  const specialists = stageMap[stage] || [];
  if (specialists.length === 0) return;

  console.log(`\n  [Mind Council] Consultando especialistas...`);

  for (const id of specialists) {
    const spec = council[id];
    if (!spec) continue;
    const label = SPECIALIST_LABELS[id] || id;
    const principles = spec.principles || [];
    const insight = principles.length > 0
      ? principles[Math.floor(Math.random() * principles.length)]
      : spec.role || 'sem insight disponivel';
    console.log(`  > ${label}:`);
    console.log(`    "${insight}"`);
  }

  // Recomendacao sintetica por stage
  const recommendations = {
    research: `  -> Priorizar topico HOT se existe janela de 24-48h. Formato: ${context.format || 'carousel'}.`,
    strategy: `  -> Alinhar formato com etapa do funil. Objetivo: ${context.objective || 'saves/engajamento'}.`,
    copy: `  -> Hook nos primeiros 3 segundos. 1 CTA especifico. Sem emoji excessivo.`,
    design: `  -> Visual deve comunicar sem legenda. Brandbook Carbon Films: preto, branco, bold.`,
    performance: `  -> Score minimo 7/10 para postar. Horario: 19h-21h BRT. Hashtags: 8-12, nao 30.`,
    video_edit: `  -> Hook visual em 3s. Cortes a cada 2-4s. Loop no frame final. Brand consistente.`,
    hook_video: `  -> Frame 1: tensao visual + texto bold maiusculo. Nunca comece com introducao.`,
  };

  if (recommendations[stage]) {
    console.log(`\n  Recomendacao: ${recommendations[stage]}`);
  }
  console.log();
}

function loadEnv() {
  try {
    return fs.readFileSync(ENV_PATH, 'utf8')
      .split('\n').filter(l => l && !l.startsWith('#'))
      .reduce((a, l) => { const [k, ...v] = l.split('='); if (k) a[k.trim()] = v.join('=').trim(); return a; }, {});
  } catch { return {}; }
}

function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

function separator(title) {
  console.log('\n' + '='.repeat(55));
  if (title) console.log(`  ${title}`);
  console.log('='.repeat(55));
}

// ---------------------------------------------------------------
// STAGE 1 — Pesquisa de conteudo (Pulse — trend-analyst)
// Modo real: Apify scraping de concorrentes + análise de tendências
// Fallback: modo interativo com menu
// ---------------------------------------------------------------
async function stageResearch(topicHint) {
  separator('ETAPA 1 — PESQUISA DE CONTEUDO');
  console.log('Agente: Pulse (trend-analyst)');
  console.log('Tarefas: scan-competitors → analyze-trends → suggest-content\n');

  consultMindCouncil('research', { format: 'carousel' });

  const env = loadEnv();
  const hasApify = !!env.APIFY_TOKEN;

  // --- HISTORICO DE POSTS ---
  printPostHistory(5);

  // --- MODO RAPIDO: tópico fornecido via --topic ---
  if (topicHint) {
    console.log(`Topico: "${topicHint}"`);
    if (isTopicDuplicate(topicHint)) {
      console.log(`\n  [AVISO] Topico similar ja foi postado anteriormente.`);
      console.log(`  Considere variar o angulo ou escolher outro tema.\n`);
    }

    // Enriquece com dados reais de concorrentes se Apify disponivel
    if (hasApify) {
      console.log('\n  [Pulse] Apify disponivel — analisando concorrentes...');
      try {
        const apify = getApifyRunner();
        if (apify) {
          const competitors = ['maisqmarketing', 'agenciaexpmark'];
          const profiles = await apify.runActor('apify~instagram-profile-scraper', {
            usernames: competitors,
            resultsLimit: 6,
          }, { timeoutMs: 90000, verbose: true });

          if (profiles.length > 0) {
            const topPosts = profiles
              .filter(p => p.caption || p.title)
              .slice(0, 3)
              .map(p => ({
                username: p.ownerUsername || p.username,
                caption_preview: (p.caption || p.title || '').slice(0, 80),
                likes: p.likesCount || 0,
                comments: p.commentsCount || 0,
              }));

            console.log(`  [Pulse] ${profiles.length} posts analisados. Top engajamento:`);
            topPosts.forEach(p => {
              console.log(`    @${p.username}: ${p.likes} likes — "${p.caption_preview}..."`);
            });

            return {
              chosen_topic: topicHint,
              trend_urgency: 'evergreen',
              content_pillar: 'educativo',
              format_recommendation: 'carousel',
              hook_direction: 'dado surpreendente + promessa de solucao',
              funnel_stage: 'awareness',
              competitor_insights: topPosts,
            };
          }
        }
      } catch (e) {
        console.log(`  [Pulse] Apify falhou (${e.message.slice(0, 60)}). Continuando sem dados.\n`);
      }
    } else {
      console.log('  (APIFY_TOKEN ausente — pesquisa de concorrentes desativada)');
    }

    console.log();
    return {
      chosen_topic: topicHint,
      trend_urgency: 'evergreen',
      content_pillar: 'educativo',
      format_recommendation: 'carousel',
      hook_direction: 'dado surpreendente + promessa de solucao',
      funnel_stage: 'awareness',
    };
  }

  // --- MODO FULL: sem tópico — Apify scraping + análise pelo Pulse ---
  if (hasApify) {
    console.log('\n  [Pulse] Modo full — analisando Instagram do nicho...');
    try {
      const apify = getApifyRunner();
      if (apify) {
        // Scraping de hashtags do nicho
        const hashtagData = await apify.runActor('apify~instagram-hashtag-scraper', {
          hashtags: ['marketingdigital', 'trafegopagosc', 'marketingsc'],
          resultsLimit: 10,
        }, { timeoutMs: 90000, verbose: true });

        const topPosts = (hashtagData || [])
          .filter(p => (p.likesCount || 0) > 100)
          .sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0))
          .slice(0, 5)
          .map(p => ({
            caption: (p.caption || '').slice(0, 100),
            likes: p.likesCount || 0,
            hashtag: p.hashtag || '',
          }));

        console.log(`\n  [Pulse] ${topPosts.length} posts virais encontrados no nicho.`);

        // Pulse (Trend Analyst) analisa os dados e sugere tópico
        const agentRunner = getAgentRunner();
        if (agentRunner && (env.ANTHROPIC_API_KEY || env.OPENROUTER_API_KEY)) {
          console.log('\n  [Pulse] Analisando dados com IA...');
          const brief = await agentRunner.runAgent({
            agentId: 'trend-analyst',
            task: 'Analise os posts virais do nicho e sugira o melhor tópico para um carrossel da Carbon Films',
            context: { top_posts: topPosts, brand: 'Carbon Films', niche: 'marketing-digital-sc' },
            schema: {
              chosen_topic: 'string — título do carrossel sugerido',
              trend_urgency: 'evergreen | this-week | immediate',
              content_pillar: 'educativo | inspiracional | prova-social | cta-direto',
              hook_direction: 'string — direção do hook',
              funnel_stage: 'awareness | consideration | decision',
              reasoning: 'string — por que esse tópico agora',
            },
          });
          console.log(`\n  [Pulse] Tópico sugerido: "${brief.chosen_topic}"`);
          console.log(`  Urgência: ${brief.trend_urgency} | Funil: ${brief.funnel_stage}`);
          console.log(`  Racional: ${brief.reasoning || '-'}\n`);
          return brief;
        }

        // Sem API — mostra sugestões dos dados
        console.log('\n  [Pulse] Sugestões baseadas em dados:');
        topPosts.slice(0, 3).forEach((p, i) => {
          console.log(`  ${i + 1}. [${p.likes} likes] ${p.caption.slice(0, 60)}`);
        });
        console.log('  4. Digitar tópico customizado\n');
        const choice = await prompt('Escolha (1-4): ');
        const idx = parseInt(choice) - 1;
        const chosen = idx >= 0 && idx < 3
          ? topPosts[idx].caption
          : await prompt('Digite o tópico: ');

        return {
          chosen_topic: chosen,
          trend_urgency: 'evergreen',
          content_pillar: 'educativo',
          format_recommendation: 'carousel',
          hook_direction: 'dado surpreendente + promessa de solucao',
          funnel_stage: 'awareness',
        };
      }
    } catch (e) {
      console.log(`  [Pulse] Apify falhou (${e.message.slice(0, 80)}). Modo interativo.\n`);
    }
  }

  // --- FALLBACK: modo interativo ---
  console.log('Selecione o topico do carrossel:');
  console.log('  1. 3 Erros que Matam seu Trafego Pago');
  console.log('  2. Como Aumentar Engajamento no Instagram em 30 Dias');
  console.log('  3. Por que Video Marketing Gera 3x Mais ROI');
  console.log('  4. Digitar topico customizado\n');

  const choice = await prompt('Escolha (1-4): ');
  const topics = {
    '1': '3 Erros que Matam seu Trafego Pago',
    '2': 'Como Aumentar Engajamento no Instagram em 30 Dias',
    '3': 'Por que Video Marketing Gera 3x Mais ROI',
  };

  let topic = topics[choice];
  if (!topic) topic = await prompt('Digite o topico: ');

  return {
    chosen_topic: topic,
    trend_urgency: 'evergreen',
    content_pillar: 'educativo',
    format_recommendation: 'carousel',
    hook_direction: 'dado surpreendente + promessa de solucao',
    funnel_stage: 'awareness',
  };
}

// ---------------------------------------------------------------
// STAGE 2 — Copy (Lyra — copy-writer + Gary mindclone)
// Modo real: Claude API com persona Lyra + brandbook Carbon Films
// Fallback: templates hardcoded por tipo de tópico
// ---------------------------------------------------------------
async function stageCopy(contentBrief) {
  separator('ETAPA 2 — COPY E LEGENDA');
  console.log('Agente: Lyra (copy-writer) + Gary Vaynerchuk mindclone\n');
  consultMindCouncil('copy', { topic: contentBrief.chosen_topic });

  const env = loadEnv();
  const hasApi = !!(env.ANTHROPIC_API_KEY || env.OPENROUTER_API_KEY);
  const agentRunner = getAgentRunner();

  // --- MODO REAL: Lyra via Claude API ---
  if (hasApi && agentRunner) {
    console.log('  [Lyra] Gerando copy com IA (brandbook Carbon Films)...');
    try {
      const result = await agentRunner.runAgent({
        agentId: 'copy-writer',
        task: 'Crie copy completa para um carrossel do Instagram da Carbon Films: 5 slides (intro + 3 dicas + CTA) + caption + hashtags.',
        context: {
          topic: contentBrief.chosen_topic,
          trend_urgency: contentBrief.trend_urgency || 'evergreen',
          content_pillar: contentBrief.content_pillar || 'educativo',
          hook_direction: contentBrief.hook_direction || 'dado surpreendente + promessa de solucao',
          funnel_stage: contentBrief.funnel_stage || 'awareness',
          format: 'carousel 5 slides',
          brand_voice: 'Carbon Films: UPPERCASE em hooks, direto, autoridade, sem emoji',
          competitor_insights: contentBrief.competitor_insights || [],
        },
        schema: {
          slides: [
            '(5 objetos obrigatórios)',
            { hook: 'string UPPERCASE — texto do título do slide', body: 'string ou null — parágrafo curto, máx 120 chars' },
          ],
          caption: 'string — legenda completa para Instagram, sem hashtags, máx 300 chars',
          hashtags: ['string — 8 hashtags relevantes, com #'],
        },
      });

      // Valida e normaliza resposta
      const slides = (result.slides || []).slice(0, 6).map(s => ({
        hook: String(s.hook || '').toUpperCase(),
        body: s.body || null,
      }));

      const caption = result.caption || '';
      const hashtags = (result.hashtags || []).slice(0, 12);

      console.log(`\n  [Lyra] Hook: "${slides[0]?.hook}"`);
      console.log('  [Lyra] Caption (preview):');
      console.log(caption.split('\n').slice(0, 2).map(l => '    ' + l).join('\n'));
      console.log(`  [Lyra] Hashtags: ${hashtags.slice(0, 4).join(' ')} ...`);

      return { slides, caption, hashtags };
    } catch (e) {
      console.log(`\n  [Lyra] API falhou: ${e.message.slice(0, 100)}`);
      console.log('  [Lyra] Usando templates hardcoded como fallback...\n');
    }
  } else if (!hasApi) {
    console.log('  (ANTHROPIC_API_KEY ausente — Lyra no modo template)\n');
  }

  // --- FALLBACK: templates hardcoded ---
  const topic = contentBrief.chosen_topic;
  const slides = generateSlidesFromTopic(topic);
  const caption = generateCaption(topic, slides);
  const hashtags = [
    '#carbonfilms', '#marketingdigital', '#trafegopagosc',
    '#marketingsc', '#agenciadecomunicacao', '#marketingvisual',
    '#brandingsc', '#santacatarina',
  ];

  console.log('Hook gerado:', slides[0].hook);
  console.log('Caption (preview):');
  console.log(caption.split('\n').slice(0, 3).map(l => '  ' + l).join('\n'));
  console.log(`  Hashtags: ${hashtags.slice(0, 4).join(' ')} ...`);

  return { slides, caption, hashtags };
}

function generateSlidesFromTopic(topic) {
  // Templates por tipo de topico (Carbon Films voice: UPPERCASE, direto, sem emoji)
  if (topic.toLowerCase().includes('erro') || topic.toLowerCase().includes('mata')) {
    return [
      { hook: topic.toUpperCase(), body: null, label: 'CF_001 / MARKETING' },
      { hook: 'ERRO 01: SEM OBJETIVO CLARO', body: 'Impulsionar sem meta definida e queimar dinheiro. Defina: awareness, lead ou venda.' },
      { hook: 'ERRO 02: PUBLICO MUITO AMPLO', body: 'Quanto mais aberto o publico, menos relevante o anuncio. Nicho = custo menor.' },
      { hook: 'ERRO 03: CRIATIVO SEM HOOK', body: 'Os primeiros 3 segundos decidem tudo. Sem hook, o algoritmo te descarta.' },
      { hook: 'A CONSEQUENCIA: ROI NEGATIVO', body: 'Esses 3 erros juntos podem consumir 70% do seu budget sem resultado.' },
      { hook: 'CORRIJA. ESCALE. LUCRE.', body: 'FALAR COM A CARBON' },
    ];
  }

  if (topic.toLowerCase().includes('engajamento') || topic.toLowerCase().includes('instagram')) {
    return [
      { hook: topic.toUpperCase(), body: null, label: 'CF_002 / INSTAGRAM' },
      { hook: 'PASSO 01: CONSISTENCIA ANTES DE CRIATIVIDADE', body: 'O algoritmo premia quem posta. Sem consistencia, nenhuma estrategia funciona.' },
      { hook: 'PASSO 02: CONTEUDO QUE GERA SAVES', body: 'Saves sinalizam valor ao algoritmo. Crie posts que as pessoas querem guardar.' },
      { hook: 'PASSO 03: CTA EM TODO POST', body: 'Sem direcao, sem acao. Cada post precisa de 1 CTA claro e especifico.' },
      { hook: '+300% EM 90 DIAS', body: 'Resultado de uma conta que aplicou esses 3 passos com disciplina.' },
      { hook: 'QUER ESSE RESULTADO?', body: 'FALAR COM A CARBON' },
    ];
  }

  // Generic educational carousel
  const words = topic.split(' ');
  return [
    { hook: topic.toUpperCase(), body: null, label: 'CF_003 / MARKETING' },
    { hook: `${words[0].toUpperCase()}: O PROBLEMA`, body: 'Maioria das marcas ignora isso e paga caro pela ignorancia.' },
    { hook: 'A SOLUCAO QUE FUNCIONA', body: 'Dados de +300 clientes em 5 anos mostram o caminho correto.' },
    { hook: 'COMO APLICAR NA PRATICA', body: 'Tres passos simples que qualquer negocio consegue executar.' },
    { hook: 'O RESULTADO', body: 'Marcas que aplicam isso crescem 3x mais rapido que a media do setor.' },
    { hook: 'PROXIMO PASSO', body: 'FALAR COM A CARBON' },
  ];
}

function generateCaption(topic, slides) {
  const hook = slides[0].hook;
  return `${hook.includes('ERRO') ? hook.replace('ERROS', 'erros').replace('QUE', 'que').replace('SEU', 'seu').replace('TRÁFEGO', 'trafego') : topic.toLowerCase()}.

${slides.slice(1, -1).map((s, i) => `${i + 1}. ${s.hook.replace(/^\w+\s\d+:\s/, '').toLowerCase()}`).join('\n')}

Salva esse post para nao esquecer.

#carbonfilms #marketingdigital #trafegopagosc #marketingsc #agenciadecomunicacao #marketingvisual #brandingsc #santacatarina`;
}

// Mapeamento de formato para dimensões
const FORMAT_DIMENSIONS = {
  carousel: '1080x1080 (1:1)',
  feed:     '1080x1350 (4:5)',
  stories:  '1080x1920 (9:16)',
  reels:    '1080x1920 (9:16)',
};

function detectFormat(topicHint, formatHint) {
  if (formatHint) return formatHint;
  const t = (topicHint || '').toLowerCase();
  if (t.includes('stories') || t.includes('story')) return 'stories';
  if (t.includes('reels') || t.includes('reel')) return 'reels';
  if (t.includes('feed') || t.includes('4:5')) return 'feed';
  return 'carousel'; // padrão
}

// ---------------------------------------------------------------
// STAGE 3 — Design
// Pipeline: Unsplash (imagens) → HTML template → Playwright (screenshots JPG)
// Template: templates/carrossel-carbon-films.html
// ---------------------------------------------------------------
async function stageDesign(contentBrief, copyPackage) {
  const format = detectFormat(contentBrief.chosen_topic, null);
  const dims = FORMAT_DIMENSIONS[format] || FORMAT_DIMENSIONS.carousel;

  separator('ETAPA 3 — DESIGN (PIXEL — HTML + PLAYWRIGHT)');
  console.log('Agente: Pixel (html-designer)');
  console.log(`Template: carrossel-carbon-films.html — ${dims}\n`);
  consultMindCouncil('design', { format });

  const { execSync } = require('child_process');
  const env = loadEnv();

  // Le briefing escrito pelo stageCopy
  let briefing = JSON.parse(fs.readFileSync(LATEST_FILE, 'utf8'));
  const slides = briefing.copy || briefing.slides || [];

  // [1/3] Busca imagens no Unsplash por slide
  if (env.UNSPLASH_ACCESS_KEY) {
    console.log('[1/3] Buscando imagens no Unsplash...');
    try {
      const { fetchSlidesImages } = require('./fetch-unsplash');
      const imageUrls = await fetchSlidesImages(slides, contentBrief.chosen_topic, env.UNSPLASH_ACCESS_KEY);
      briefing.copy = slides.map((s, i) => ({ ...s, image_url: imageUrls[i] || null }));
      fs.writeFileSync(LATEST_FILE, JSON.stringify(briefing, null, 2));
    } catch (e) {
      console.log(`  Aviso: Unsplash falhou (${e.message?.slice(0, 60)}). Slides sem imagem de fundo.`);
    }
  } else {
    console.log('[1/3] UNSPLASH_ACCESS_KEY ausente — slides sem imagem de fundo.');
  }

  // [2/3] Gera slides HTML a partir do template carrossel-carbon-films.html
  console.log('\n[2/3] Gerando slides HTML...');
  execSync(`node "${path.join(__dirname, 'generate-slides-html.js')}" --format ${format}`, {
    stdio: 'inherit',
  });

  // [3/3] Captura screenshots com Playwright (1080×1350px)
  console.log('\n[3/3] Capturando screenshots (Playwright)...');
  execSync(`node "${path.join(__dirname, 'capture-slides.js')}"`, {
    stdio: 'inherit',
  });

  const manifestPath = path.join(ROOT, 'output', 'slides', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  briefing = JSON.parse(fs.readFileSync(LATEST_FILE, 'utf8'));
  briefing.design = {
    local_files: manifest.files,
    format,
    dimensions: dims,
    method: 'html-playwright',
    template: 'carrossel-carbon-films.html',
  };
  fs.writeFileSync(LATEST_FILE, JSON.stringify(briefing, null, 2));

  console.log(`\nSlides prontos: ${manifest.files.length} arquivos (${dims}) em output/slides/`);
  return briefing;
}

// ---------------------------------------------------------------
// STAGE 4 — Aprovacao humana
// ---------------------------------------------------------------
async function stageApproval(designResult, copyPackage) {
  separator('ETAPA 4 — APROVACAO HUMANA');
  consultMindCouncil('performance', {});

  console.log('PREVIEW DO POST:');
  console.log('-'.repeat(55));
  const localFiles = designResult.design.local_files || [];
  if (localFiles.length > 0) {
    console.log(`Slides:   ${localFiles.length} arquivos JPG gerados`);
    localFiles.forEach((f, i) => console.log(`  [${i + 1}] ${path.basename(f)}`));
  }
  console.log(`Format:   ${designResult.design.format} ${designResult.design.dimensions}`);
  console.log('\nCAPTION:');
  console.log(copyPackage.caption);
  console.log('-'.repeat(55));
  const template = designResult.design?.template || 'carrossel-carbon-films.html';
  console.log(`Template: ${template}`);
  console.log('\nOpcoes:');
  console.log('  1 = Aprovar e postar no Instagram agora');
  console.log('  2 = Aprovar sem postar (salvar como pronto)');
  console.log('  3 = Cancelar');

  const answer = await prompt('\nEscolha: ');
  return answer.trim();
}

// ---------------------------------------------------------------
// STAGE 5 — Export + Post Instagram
// ---------------------------------------------------------------
// ---------------------------------------------------------------
// Upload de imagem local para o Imgur (sem autenticação)
// Retorna URL pública usável pela Meta API
// ---------------------------------------------------------------
async function uploadToImgur(filePath) {
  const https = require('https');
  const fileData = fs.readFileSync(filePath);
  const b64 = fileData.toString('base64');
  const body = 'image=' + encodeURIComponent(b64) + '&type=base64';

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.imgur.com',
      path: '/3/image',
      method: 'POST',
      headers: {
        'Authorization': 'Client-ID 546c25a59c58ad7',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (r) => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => {
        try {
          const json = JSON.parse(d);
          if (json.data && json.data.link) resolve(json.data.link);
          else reject(new Error('Imgur: ' + JSON.stringify(json).slice(0, 200)));
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// ---------------------------------------------------------------
// Chama a Meta Graph API
// ---------------------------------------------------------------
function graphApi(endpoint, params) {
  return new Promise((resolve, reject) => {
    const body = new URLSearchParams(params).toString();
    const req = https.request({
      hostname: 'graph.facebook.com',
      path: `/v19.0${endpoint}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (r) => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function stagePost(designResult, copyPackage) {
  separator('ETAPA 5 — UPLOAD + INSTAGRAM');
  console.log('Agente: Pixel (upload Imgur) → Rhythm (post Meta API)\n');

  const env = loadEnv();

  if (!env.META_ACCESS_TOKEN || !env.INSTAGRAM_BUSINESS_ACCOUNT_ID) {
    console.log('ATENCAO: Credenciais Meta nao configuradas em .env');
    console.log('  META_ACCESS_TOKEN=...');
    console.log('  INSTAGRAM_BUSINESS_ACCOUNT_ID=17841400874017740');
    return null;
  }

  const TOKEN = env.META_ACCESS_TOKEN;
  const IG_ID = env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  // Arquivos locais dos slides (manifest gerado pelo capture-slides.js)
  const manifestPath = path.join(ROOT, 'output', 'slides', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const localFiles = manifest.files;

  if (!localFiles || !localFiles.length) {
    throw new Error('Nenhum slide encontrado em output/slides/manifest.json');
  }

  // [1] Upload para Imgur → URLs públicas para a Meta API
  console.log(`[1/3] Fazendo upload de ${localFiles.length} slides para o Imgur...`);
  const publicUrls = [];
  for (let i = 0; i < localFiles.length; i++) {
    process.stdout.write(`  slide-${i + 1}.jpg → `);
    const url = await uploadToImgur(localFiles[i]);
    console.log(url);
    publicUrls.push(url);
  }

  // Salva URLs para referência
  fs.writeFileSync(
    path.join(ROOT, 'output', 'slides', 'public-urls.json'),
    JSON.stringify(publicUrls, null, 2)
  );

  const caption = `${copyPackage.caption}\n\n${(copyPackage.hashtags || []).join(' ')}`;

  // [2] Cria containers individuais na Meta API
  console.log('\n[2/3] Criando containers na Meta API...');
  const containerIds = [];
  for (let i = 0; i < publicUrls.length; i++) {
    const res = await graphApi(`/${IG_ID}/media`, {
      image_url: publicUrls[i],
      is_carousel_item: 'true',
      access_token: TOKEN,
    });
    if (!res.id) throw new Error(`Container slide ${i + 1} falhou: ${JSON.stringify(res).slice(0, 200)}`);
    containerIds.push(res.id);
    console.log(`  Slide ${i + 1}: ${res.id}`);
  }

  // [3] Cria e publica o carousel
  console.log('\n[3/3] Publicando carousel...');
  const carousel = await graphApi(`/${IG_ID}/media`, {
    media_type: 'CAROUSEL',
    children: containerIds.join(','),
    caption,
    access_token: TOKEN,
  });
  if (!carousel.id) throw new Error('Carousel falhou: ' + JSON.stringify(carousel).slice(0, 300));

  const pub = await graphApi(`/${IG_ID}/media_publish`, {
    creation_id: carousel.id,
    access_token: TOKEN,
  });

  if (pub.id) {
    separator('CAROUSEL PUBLICADO');
    console.log(`Post ID: ${pub.id}`);
    console.log(`Slides:  ${localFiles.length}`);
    console.log(`Conta:   @carbonfilms.sc`);
  }

  return pub;
}

// ---------------------------------------------------------------
// Comandos
// ---------------------------------------------------------------
async function cmdCarousel(args) {
  const topicIdx = args.indexOf('--topic');
  const topicHint = topicIdx !== -1 ? args[topicIdx + 1] : null;

  const inputIdx = args.indexOf('--input');
  const inputFile = inputIdx !== -1 ? args[inputIdx + 1] : null;

  separator('SOCIAL MEDIA SQUAD — PIPELINE CAROUSEL');
  console.log('Carbon Films | Pixel + Lyra + Pulse + Rhythm');

  let contentBrief, copyPackage, designResult;

  if (inputFile) {
    // Modo full-briefing
    const input = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
    contentBrief = { chosen_topic: input.topic.title, format_recommendation: 'carousel' };
    copyPackage = { slides: input.slides, caption: input.topic.caption, hashtags: input.topic.hashtags };
    designResult = await stageDesign(contentBrief, copyPackage);
  } else {
    // Modo interativo/automatico
    contentBrief = await stageResearch(topicHint);
    copyPackage = await stageCopy(contentBrief);

    // Determina tema alternando automaticamente
    const theme = getNextTheme();
    console.log(`\n  [Theme] Tema selecionado: ${theme.toUpperCase()} (alternância automática)`);

    // Salva copy no briefing para que generate-slides-html.js leia corretamente
    const briefingForDesign = {
      topic: { title: contentBrief.chosen_topic },
      copy: copyPackage.slides,
      caption: copyPackage.caption,
      hashtags: copyPackage.hashtags,
      assets: [],
      theme,
    };
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(LATEST_FILE, JSON.stringify(briefingForDesign, null, 2));

    designResult = await stageDesign(contentBrief, copyPackage);
  }

  const approval = await stageApproval(designResult, copyPackage);

  if (approval === '1') {
    const postResult = await stagePost(designResult, copyPackage);
    if (postResult) {
      separator('CONCLUIDO');
      console.log('Post publicado no Instagram!');
      console.log(`ID: ${postResult.id}`);
    }
  } else if (approval === '2') {
    separator('CONCLUIDO');
    console.log('Design aprovado e salvo. Nao postado ainda.');
    console.log(`Arquivo: data/carousel-latest.json`);
    const files = designResult.design?.local_files || [];
    if (files.length) console.log(`Slides: ${files.length} JPGs em output/slides/`);
  } else {
    console.log('\nCancelado.');
  }
}

async function cmdExport() {
  // Pipeline migrado para HTML + Playwright — exportação via Canva removida.
  // Os JPGs são gerados diretamente em output/slides/ pelo capture-slides.js.
  const slidesDir = path.join(ROOT, 'output', 'slides');
  const files = fs.existsSync(slidesDir)
    ? fs.readdirSync(slidesDir).filter(f => f.endsWith('.jpg')).sort()
    : [];

  if (!files.length) {
    console.log('Nenhum slide exportado ainda. Rode: node run-workflow.js carousel');
    return;
  }
  console.log(`\n${files.length} slides disponíveis em output/slides/:`);
  files.forEach((f, i) => console.log(`  [${i + 1}] ${f}`));
}

async function cmdPost(args) {
  const fromLatest = args.includes('--from-latest');

  if (!fromLatest) {
    console.error('Uso: node run-workflow.js post --from-latest');
    process.exit(1);
  }

  if (!fs.existsSync(LATEST_FILE)) {
    console.error('Nenhum carousel salvo. Rode primeiro: node run-workflow.js carousel');
    process.exit(1);
  }

  const designResult = JSON.parse(fs.readFileSync(LATEST_FILE, 'utf8'));

  separator('POSTANDO CAROUSEL SALVO');
  console.log(`Design: ${designResult.design.id}`);
  console.log(`Titulo: ${designResult.design.title}`);

  const caption = await prompt('Caption (ou Enter para usar o salvo): ');
  const finalCaption = caption || designResult.copy?.map(s => s.hook).join(' · ') || '';

  const copyPackage = { caption: finalCaption, hashtags: ['#carbonfilms'], slides: [] };
  await stagePost(designResult, copyPackage);
}

// ---------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------
const [, , command, ...rest] = process.argv;

const commands = {
  carousel: () => cmdCarousel(rest),
  export: () => cmdExport(rest),
  post: () => cmdPost(rest),
  history: () => Promise.resolve(printPostHistory(20)),
};

if (!command || !commands[command]) {
  console.log('\nSocial Media Squad — Orchestrator\n');
  console.log('Comandos disponíveis:');
  console.log('  node run-workflow.js carousel                        # pipeline interativo');
  console.log('  node run-workflow.js carousel --topic "tema"         # pipeline rapido');
  console.log('  node run-workflow.js carousel --input briefing.json  # briefing completo');
  console.log('  node run-workflow.js export <design_id>              # exportar design');
  console.log('  node run-workflow.js post --from-latest              # postar ultimo carousel');
  console.log('  node run-workflow.js history                         # ver historico de posts');
  process.exit(0);
}

commands[command]().catch(err => {
  console.error('\nErro:', err.message);
  process.exit(1);
});
