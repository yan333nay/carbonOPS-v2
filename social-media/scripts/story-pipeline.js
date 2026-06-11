#!/usr/bin/env node
'use strict';

/**
 * story-pipeline.js — Pipeline autônomo de storytelling diário
 *
 * Escolhe uma história, gera imagens cinematográficas via Higgsfield API
 * (modelo Soul) ou Unsplash como fallback, monta 7 slides narrativos e
 * publica via Buffer no Instagram da Carbon Films.
 *
 * Uso:
 *   node scripts/story-pipeline.js              # autônomo completo
 *   node scripts/story-pipeline.js --dry-run    # gera mas não posta
 *   node scripts/story-pipeline.js --story "nome"  # força uma história
 */

const fs             = require('fs');
const path           = require('path');
const https          = require('https');
const http           = require('http');
const { execSync }   = require('child_process');

const ROOT      = path.join(__dirname, '..');
const OUT       = path.join(ROOT, 'output', 'slides');
const LOGO_PATH = path.join(ROOT, 'assets', 'logo-carbon.png');
const ENV_PATH  = path.join(ROOT, '.env');
const MEMORY_PATH = path.join(ROOT, 'data', 'story-memory.json');
const HISTORY_PATH = path.join(ROOT, 'data', 'post-history.json');

const EVOLUTION_URL      = 'http://localhost:8081';
const EVOLUTION_INSTANCE = 'carbonfilms';
const YAN_WHATSAPP       = '5547984989657';

// ── args ──────────────────────────────────────────────────────
const DRY_RUN    = process.argv.includes('--dry-run');
const STORY_ARG  = (() => { const i = process.argv.indexOf('--story'); return i > -1 ? process.argv[i + 1] : null; })();

// ── env ───────────────────────────────────────────────────────
function loadEnv() {
  try {
    for (const line of fs.readFileSync(ENV_PATH, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z_]+)=(.+)$/);
      if (m) process.env[m[1]] = m[2].trim();
    }
  } catch {}
}

function getLogoBase64() {
  try { return `data:image/png;base64,${fs.readFileSync(LOGO_PATH).toString('base64')}`; }
  catch { return ''; }
}

// ── Higgsfield CLI (soul_cinematic — cenas cinematográficas com contexto de marca) ─
const BG_DIR = path.join(ROOT, 'output', 'backgrounds');
const HF_SERVER_URL = 'http://127.0.0.1:7891';

function hfCredits() {
  try {
    const out = execSync('higgsfield account status', { encoding: 'utf8', stdio: 'pipe' }).trim();
    const m = out.match(/([\d.]+)\s*credits?/);
    return m ? parseFloat(m[1]) : 0;
  } catch { return 0; }
}

function generateImageHiggsfield(prompt) {
  try {
    if (hfCredits() < 0.12) {
      console.log('    Higgsfield: creditos insuficientes');
      return null;
    }
    const tmpPrompt = `/tmp/hf-prompt-${Date.now()}.txt`;
    fs.writeFileSync(tmpPrompt, prompt);
    const result = execSync(
      `higgsfield generate create soul_cinematic --prompt "$(cat ${tmpPrompt})" --aspect_ratio 3:4 --wait`,
      { encoding: 'utf8', timeout: 90000, shell: '/bin/bash' }
    ).trim();
    fs.unlinkSync(tmpPrompt);
    if (!result.startsWith('http')) return null;

    // Baixa imagem localmente — CloudFront pode ser inacessível no Playwright
    if (!fs.existsSync(BG_DIR)) fs.mkdirSync(BG_DIR, { recursive: true });
    const localFile = path.join(BG_DIR, `hf-${Date.now()}.jpg`);
    try {
      execSync(`curl -s -L --max-time 30 -o "${localFile}" "${result}"`, { timeout: 35000 });
      if (fs.existsSync(localFile) && fs.statSync(localFile).size > 5000) {
        const localUrl = `${HF_SERVER_URL}/backgrounds/${path.basename(localFile)}`;
        console.log(`    Higgsfield ok (local): ${path.basename(localFile)}`);
        return localUrl;
      }
    } catch {}
    // Fallback: usa URL CDN diretamente
    console.log(`    Higgsfield ok (CDN): ${result.slice(0, 60)}...`);
    return result;
  } catch (err) {
    const msg = err.stderr?.toString().trim() || err.message || '';
    if (msg.includes('Not authenticated')) console.log('    Higgsfield: não autenticado');
    else console.log(`    Higgsfield: ${msg.slice(0, 80)}`);
    return null;
  }
}

// ── Wikipedia — foto real da pessoa ──────────────────────────
// Aceita qualquer resolução — foto real da pessoa sempre preferível a stock photo
async function fetchWikipedia(title, lang = 'en') {
  if (!title) return '';
  try {
    const slug = encodeURIComponent(title.replace(/ /g, '_'));
    const url  = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${slug}`;
    const res  = await httpGet(url, { 'User-Agent': 'CarbonFilmsBot/1.0 (social media automation)' });
    const json = JSON.parse(res);
    const orig = json?.originalimage;

    if (!orig?.source) {
      console.log(`    Wikipedia: sem imagem para "${title}"`);
      return '';
    }

    console.log(`    Wikipedia ok (${orig.width}x${orig.height}): ${orig.source.slice(0, 70)}...`);
    return orig.source;
  } catch { return ''; }
}

// ── Unsplash fallback ─────────────────────────────────────────
async function fetchUnsplash(query) {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return '';
  try {
    const q   = encodeURIComponent(query);
    const url = `https://api.unsplash.com/photos/random?query=${q}&orientation=portrait&w=1080&h=1350&client_id=${key}`;
    const res = await httpGet(url, { 'Accept-Version': 'v1' });
    return JSON.parse(res).urls?.regular || '';
  } catch { return ''; }
}

// ── Escolha da imagem
// Para slide 1 (retrato): Wikipedia → Higgsfield → Unsplash
// Para slides narrativos: Higgsfield → Unsplash
async function getPortraitImage(wikiTitle, hfPrompt, unsplashQuery) {
  console.log(`  Buscando retrato: ${wikiTitle || '—'}`);
  const wiki = await fetchWikipedia(wikiTitle);
  if (wiki) return wiki;
  const hf = generateImageHiggsfield(hfPrompt);
  if (hf) return hf;
  // Fallback: busca o rosto da pessoa pelo nome no Unsplash
  const personQuery = `${wikiTitle} portrait photo`;
  console.log(`  Fallback Unsplash: "${personQuery}"`);
  const byName = await fetchUnsplash(personQuery);
  if (byName) return byName;
  console.log(`  Fallback Unsplash: "${unsplashQuery}"`);
  return fetchUnsplash(unsplashQuery);
}

async function getImage(hfPrompt, unsplashQuery) {
  console.log(`  Higgsfield: "${hfPrompt.slice(0, 60)}..."`);
  const hf = generateImageHiggsfield(hfPrompt);
  if (hf) return hf;
  console.log(`  Fallback Unsplash: "${unsplashQuery}"`);
  return fetchUnsplash(unsplashQuery);
}

// ── Claude API — geração dinâmica de histórias ────────────────

// Empresários disponíveis para rotação (~50 nomes)
const ENTREPRENEURS = [
  // Internacionais
  'Steve Jobs', 'Jeff Bezos', 'Elon Musk', 'Howard Schultz', 'Jack Ma',
  'Walt Disney', 'Phil Knight', 'Reed Hastings', 'Henry Ford', 'Richard Branson',
  'Oprah Winfrey', 'Jan Koum', 'Ingvar Kamprad', 'Herb Kelleher', 'Ray Kroc',
  'Howard Hughes', 'Sam Walton', 'Michael Dell', 'Amancio Ortega', 'Larry Ellison',
  'Sara Blakely', 'JK Rowling', 'Arianna Huffington', 'Coco Chanel', 'Estée Lauder',
  'Vera Wang', 'Tory Burch', 'Whitney Wolfe Herd', 'Anne Wojcicki', 'Cher Wang',
  // Brasileiros
  'Flávio Augusto da Silva', 'Luiza Helena Trajano', 'Jorge Paulo Lemann',
  'Abílio Diniz', 'Silvio Santos', 'Roberto Marinho', 'Antônio Ermírio de Moraes',
  'Guilherme Benchimol', 'David Vélez', 'Eduardo Saverin', 'Tallis Gomes',
  'Beto Sicupira', 'Marcel Telles', 'Cris Arcangeli', 'Nizan Guanaes',
  'Luciano Hang', 'João Appolinário', 'Alex Atala', 'Amauri Temporal',
  // Históricos / outros
  'Thomas Edison', 'Andrew Carnegie', 'John D. Rockefeller', 'P.T. Barnum',
  'Mary Kay Ash', 'Helena Rubinstein', 'Adam Neumann', 'Travis Kalanick',
];

async function generateStory(entrepreneurName) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY não definido no .env — necessário para gerar histórias dinâmicas.');

  const prompt = `Você é um roteirista de social media especialista em storytelling cinematográfico para Instagram.

Crie um carrossel de 7 slides sobre ${entrepreneurName} para a conta @carbonfilms.sc (agência de marketing visual, Santa Catarina, Brasil).

REGRAS OBRIGATÓRIAS:
- Português do Brasil, tom direto e impactante
- PROIBIDO emojis em qualquer campo
- Sem frases genéricas ou clichês motivacionais
- Fatos REAIS e verificáveis sobre a pessoa
- Narrativa cinematográfica: tensão, conflito, virada, lição
- Máx 80 chars por texto1 (para caber no slide — menos texto, mais impacto)

REGRAS DE IMAGEM (CRÍTICO — LEIA COM ATENÇÃO):
- hfPrompt: descreva uma CENA REAL e RECONHECÍVEL ligada à empresa/marca/produto da pessoa. Mencione explicitamente o nome da empresa/produto quando visual (ex: "McDonald's golden arches exterior 1955", "Apple store product launch stage spotlight", "Amazon warehouse conveyor belt"). Estilo cinemático, 35mm, sem pessoas. Em inglês.
- unsplash: a query DEVE descrever literalmente o que está sendo falado no slide. Se o slide fala de siderurgia, escreva "steel mill furnace industrial 1900s". Se fala de ferrovia, escreva "railroad construction workers 1870s". Se fala de um produto, cite o produto. NUNCA use termos genéricos como "office", "wall", "abstract", "dark minimal" para slides narrativos — isso gera fotos sem nexo com o conteúdo. Sempre em inglês, 3-6 palavras descritivas da CENA ESPECÍFICA.

REGRAS DE ALGORITMO (Instagram Explorar):
- hook: abra com paradoxo ou dado chocante que cria lacuna de curiosidade (ex: "ELE PERDEU TUDO\nTRES VEZES.\nATÉ QUE..."). Provoque o usuário a querer saber o final.
- slides[0].fato: O slide 2 é a "segunda capa" — o Instagram mostra ele para quem não arrastou o slide 1. Deve conter uma estatística ou fato isolado tão chocante que force o usuário a voltar ao início. Ex: "De US$0 para US$127 bilhões em 20 anos." Máx 70 chars.
- caption: feche com "Salve esse post para reler quando precisar." antes das hashtags.

ESTRUTURA JSON (retorne SOMENTE o JSON, sem markdown, sem explicações):
{
  "id": "slug-unico",
  "nome": "Nome Completo — Subtítulo impactante da história",
  "wikiTitle": "Nome exato para buscar no Wikipedia em inglês",
  "teaser": "Frase de 5 a 8 palavras. Curiosidade pura, sem revelar o final. Sem ponto final. Ex: 'A mulher que o mundo tentou apagar' ou 'Ele foi demitido. Voltou bilionario'",
  "hook": "PARADOXO OU DADO CHOCANTE\\nEM MAIÚSCULAS\\nATÉ 4 LINHAS",
  "hook_sub": "Uma frase que aprofunda a curiosidade sem revelar o final.",
  "slides": [
    {
      "capitulo": "O contexto",
      "fato": "Estatística ou número chocante isolado. Máx 70 chars. Ex: 'Faliu 3 vezes antes dos 30 anos.'",
      "titulo": "TÍTULO\\nEM MAIÚSCULAS",
      "texto1": "Uma frase curta e impactante. Fato real e específico. Máx 80 chars.",
      "hfPrompt": "Cena REAL da empresa/produto: ex 'McDonald's golden arches 1955 Des Plaines Illinois exterior, cinematic 35mm, no people'. Mencione o nome da marca explicitamente. Em inglês.",
      "unsplash": "descreva a cena exata do slide: setor, produto, ambiente histórico. Ex: 'carnegie steel mill pittsburgh 1890s' — em inglês, 3-6 palavras"
    },
    {
      "capitulo": "A crise",
      "titulo": "TÍTULO\\nEM MAIÚSCULAS",
      "texto1": "Uma frase curta e impactante. Máx 80 chars.",
      "hfPrompt": "Cena relacionada à crise da história. Mencione a empresa/produto se visual. 35mm cinemático, sem pessoas. Em inglês.",
      "unsplash": "cena específica da crise: o setor, o evento, o ambiente real. Ex: 'stock market crash 1929 wall street' — em inglês, 3-6 palavras"
    },
    {
      "capitulo": "A decisão",
      "titulo": "TÍTULO\\nEM MAIÚSCULAS",
      "texto1": "Uma frase curta e impactante. Máx 80 chars.",
      "hfPrompt": "Cena da virada ou decisão. Mencione empresa/produto se visual. 35mm cinemático, sem pessoas. Em inglês.",
      "unsplash": "cena da virada: o produto, o local, o setor específico. Ex: 'ford assembly line detroit 1913' — em inglês, 3-6 palavras"
    },
    {
      "capitulo": "O resultado",
      "titulo": "TÍTULO\\nEM MAIÚSCULAS",
      "texto1": "Uma frase curta e impactante. Máx 80 chars.",
      "hfPrompt": "Cena do sucesso/escala da empresa. Mencione o nome da marca (ex: 'McDonald's restaurants across America aerial'). 35mm cinemático, sem pessoas. Em inglês.",
      "unsplash": "empresa ou setor no auge: produto, planta industrial, escala. Ex: 'carnegie steel corporation expansion railroad' — em inglês, 3-6 palavras"
    },
    {
      "capitulo": "A lição",
      "citacao": "Citação real e verificável da pessoa. Impactante. Máx 200 chars.",
      "autor": "Nome Completo, contexto/ano",
      "hfPrompt": "Dark minimal cinematic background, philosophical mood, subtle light",
      "unsplash": "dark minimal cinematic portrait philosophical light"
    }
  ],
  "cta_titulo": "PERGUNTA\\nPROVOCATIVA\\nEM MAIÚSCULAS",
  "cta_texto": "Conexão direta entre a história e o poder do marketing visual. Como a Carbon Films ajuda marcas a construir autoridade. Máx 160 chars.",
  "caption": "Texto completo da legenda para Instagram. 3-4 parágrafos curtos. Fatos + reflexão. SEM emojis. Fechar com 'Salve esse post para reler quando precisar.' e então EXATAMENTE 5 hashtags — nem mais, nem menos. Inclua obrigatoriamente #carbonfilms e #storytelling entre elas.",
  "pillar": "inspiracional"
}`;

  const body = JSON.stringify({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2500,
    messages: [{ role: 'user', content: prompt }],
  });

  log(`Gerando história sobre ${entrepreneurName} via Claude API...`);
  const res  = await httpPost('https://api.anthropic.com/v1/messages', body, {
    'x-api-key':           key,
    'anthropic-version':   '2023-06-01',
    'Content-Type':        'application/json',
  });

  const json = JSON.parse(res);
  if (json.error) throw new Error(`Claude API erro: ${json.error.message}`);
  const text = json.content?.[0]?.text || '';

  // Extrai JSON da resposta (remove possível markdown)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('Claude não retornou JSON válido: ' + text.slice(0, 300));
  return JSON.parse(jsonMatch[0]);
}

// ── Memória e seleção de empresário ──────────────────────────
// (mantido para fallback — não é mais STORIES)
const STORIES = [
  {
    id: 'jobs-apple',
    nome: 'Steve Jobs — O homem que foi demitido da própria empresa',
    wikiTitle: 'Steve Jobs',
    teaser: 'Demitido da empresa que fundou',
    hook: 'ELE FOI\nDEMITIDO DA\nPRÓPRIA\nEMPRESA.',
    hook_sub: 'Doze anos depois, voltou e criou o produto mais vendido da história.',
    slides: [
      {
        capitulo: 'O contexto',
        titulo: 'UM GÊNIO\nSEM EMPRESA.',
        texto1: 'Steve Jobs fundou a Apple em 1976 em uma garagem. Dez anos depois, o conselho de diretores que ele mesmo escolheu o expulsou da empresa que criou.',
        texto2: 'Tinha 30 anos e não sabia o que fazer com a própria vida.',
        hfPrompt: 'A lone man sitting in an empty office at night, dramatic chiaroscuro lighting, cinematic dark mood, 35mm film, Silicon Valley 1985 aesthetic, ultra realistic',
        unsplash: 'empty office dark night dramatic',
      },
      {
        capitulo: 'A crise',
        titulo: 'O ANO\nEM QUE ELE\nDESAPARECEU.',
        texto1: 'Jobs ficou deprimido. Considerou vender todas as ações da Apple e abandonar a tecnologia. Passava semanas viajando pela Europa sem destino.',
        texto2: 'O homem mais falado do Vale do Silício havia se tornado invisível.',
        hfPrompt: 'Man alone traveling in Europe, foggy streets at dawn, existential mood, cinematic photography, dark tone, solitude, 1986',
        unsplash: 'man alone walking foggy street dark',
      },
      {
        capitulo: 'A decisão',
        titulo: 'ELE FUNDOU\nDUAS EMPRESAS\nNO EXÍLIO.',
        texto1: 'Em vez de desistir, Jobs fundou a NeXT e comprou uma pequena empresa de animação chamada Pixar. Sem saber, estava construindo o futuro.',
        texto2: 'Ninguém apostava nele. Ele apostou em si mesmo.',
        hfPrompt: 'Entrepreneur alone working in a workshop at night, multiple screens glowing, determined focus, cinematic dark atmosphere, intense concentration',
        unsplash: 'entrepreneur startup night working intense',
      },
      {
        capitulo: 'O resultado',
        titulo: 'A APPLE\nCOMPROUDE\nVOLTA.',
        texto1: 'Em 1997, a Apple adquiriu a NeXT por US$427 milhões e Jobs voltou como CEO. Em três anos, lançou o iMac, o iPod e depois o iPhone.',
        texto2: 'A empresa que o expulsou se tornou a mais valiosa do mundo em suas mãos.',
        hfPrompt: 'Product launch event on stage with dramatic spotlight, Apple style presentation, dark auditorium, cinematic reveal, 2007',
        unsplash: 'technology product launch stage spotlight dark',
      },
      {
        capitulo: 'A lição',
        citacao: 'Ser demitido da Apple foi a melhor coisa que poderia ter acontecido comigo. O peso de ser bem-sucedido foi substituído pela leveza de ser um iniciante de novo.',
        autor: 'Steve Jobs, Stanford 2005',
        hfPrompt: 'Cinematic quote slide, dark minimal background with subtle light, contemplative mood, philosophical atmosphere',
        unsplash: 'dark minimal abstract contemplative',
      },
    ],
    cta_titulo: 'QUAL EXÍLIO\nESTÁ TE\nPREPARANDO?',
    cta_texto: 'As maiores viradas de mercado acontecem depois da queda. Marcas que documentam sua jornada constroem autoridade que nenhum anúncio compra.',
    caption: `Ele foi demitido da própria empresa. Doze anos depois, voltou e criou o produto mais vendido da história.\n\nA história de Steve Jobs não é sobre genialidade. É sobre o que você faz quando tudo desmorona.\n\nNem todo exílio é o fim. Alguns são o começo.\n\n#storytelling #empreendedorismo #stevejobs #apple #marketingdigital #carbonfilms #santacatarina`,
    pillar: 'inspiracional',
  },
  {
    id: 'bezos-amazon',
    nome: 'Jeff Bezos — O analista que largou Wall Street para vender livros',
    teaser: 'Largou Wall Street por uma garagem',
    hook: 'ELE TINHA\nO EMPREGO\nDOS SONHOS.\nLARGOU TUDO.',
    hook_sub: 'Em 1994, trocou Wall Street por uma garagem e uma ideia maluca: vender livros pela internet.',
    slides: [
      {
        capitulo: 'O contexto',
        titulo: 'SALÁRIO\nDE 7 DÍGITOS.\nE INSATISFAÇÃO.',
        texto1: 'Jeff Bezos era vice-presidente sênior em um dos fundos hedge mais respeitados de Nova York. Tinha 30 anos, ganhava mais de US$1 milhão por ano e estava no caminho certo.',
        texto2: 'Exceto por uma ideia que não saia da cabeça: a internet crescia 2.300% ao ano.',
        hfPrompt: 'Wall Street New York office high rise at night, dramatic city lights, financial district atmosphere, cinematic dark blue tone, 1994',
        unsplash: 'wall street new york night office',
      },
      {
        capitulo: 'A crise',
        titulo: 'SEU CHEFE\nRIU DA\nIDEIA.',
        texto1: 'Bezos foi ao parque com o chefe para contar o plano. O homem ouviu tudo, refletiu e disse: "É uma ótima ideia para alguém que não tem um ótimo emprego."',
        texto2: 'Bezos foi para casa, pensou por 48 horas e pediu demissão.',
        hfPrompt: 'Two men talking in a park, one skeptical one determined, autumn light, cinematic storytelling, dramatic moment of decision',
        unsplash: 'two people talking park autumn dramatic',
      },
      {
        capitulo: 'A decisão',
        titulo: 'SEATTLE.\nUMA GARAGEM.\nUS$245 MIL\nDO BOLSO DO PAI.',
        texto1: 'Bezos e a esposa MacKenzie cruzaram os EUA de carro enquanto ele digitava o plano de negócios no laptop. A Amazon começou em uma garagem com três funcionários.',
        texto2: 'O domínio amazon.com foi registrado em 1994. Em 1995, o primeiro livro foi vendido.',
        hfPrompt: 'Small startup garage with boxes and computers, early internet era, humble beginnings, warm intimate lighting, 1994 Seattle',
        unsplash: 'garage startup humble beginning boxes',
      },
      {
        capitulo: 'O resultado',
        titulo: 'US$1.7\nTRILHÃO.',
        texto1: 'A Amazon hoje vale US$1.7 trilhão. Bezos chegou a ser o homem mais rico do planeta. Mas o que mais importa: ele criou algo que nunca existiu antes.',
        texto2: 'Tudo porque preferiu o arrependimento de ter tentado ao arrependimento de nunca saber.',
        hfPrompt: 'Global scale logistics network visualization, cinematic top view of fulfillment center, dramatic scale and scope, modern',
        unsplash: 'amazon logistics warehouse aerial dramatic',
      },
      {
        capitulo: 'A lição',
        citacao: 'Eu sabia que aos 80 anos não me arrependeria de ter tentado. Mas me arrependeria de não ter tentado nada.',
        autor: 'Jeff Bezos',
        hfPrompt: 'Minimalist dark philosophical background, abstract contemplation, cinematic still, deep thought atmosphere',
        unsplash: 'dark minimalist abstract philosophy',
      },
    ],
    cta_titulo: 'QUAL IDEIA\nESTÁ ESPERANDO\nO MOMENTO CERTO?',
    cta_texto: 'O momento certo não existe. Existe a decisão de agir — e a presença digital para mostrar essa jornada ao mundo.',
    caption: `Em 1994, Jeff Bezos deixou Wall Street para vender livros pela internet.\n\nSeu chefe achou a ideia boa "para quem não tem um emprego melhor".\n\nHoje a Amazon vale US$1.7 trilhão.\n\nAlgumas ideias parecem pequenas demais para o mundo em que você está. Talvez você precise criar um mundo novo.\n\n#bezos #amazon #empreendedorismo #storytelling #marketingdigital #carbonfilms`,
    pillar: 'inspiracional',
  },
  {
    id: 'sara-blakely',
    nome: 'Sara Blakely — Ela vendeu fax porta a porta. Depois criou um império bilionário.',
    teaser: 'Com US$5.000 e uma tesoura',
    hook: 'ELA VENDIA\nFAX PORTA\nA PORTA.\nHOJE VALE\nR$5 BI.',
    hook_sub: 'Com US$5.000 de economia e uma ideia que os homens da indústria acharam ridícula.',
    slides: [
      {
        capitulo: 'O contexto',
        titulo: 'REPROVADA\nNA FACULDADE\nDE DIREITO.\nDUAS VEZES.',
        texto1: 'Sara Blakely tentou entrar na faculdade de direito duas vezes e não passou. Passou os sete anos seguintes vendendo máquinas de fax porta a porta no calor da Flórida.',
        texto2: 'Toda manhã ela ligava a campainha de casas e escritórios para ouvir "não".',
        hfPrompt: 'Woman in business clothes walking suburban streets door to door sales, hot Florida day, determined expression, cinematic slice of life, 1990s',
        unsplash: 'woman business street walking determined',
      },
      {
        capitulo: 'A ideia',
        titulo: 'ELA CORTOU\nAS PERNAS\nDA MEIA-\nCALÇA.',
        texto1: 'Antes de uma festa, Blakely queria usar calça bege mas não tinha a roupa certa por baixo. Cortou o pé de uma meia-calça e usou. Ficou perfeito.',
        texto2: 'Passou dois anos pesquisando a indústria têxtil enquanto ainda vendia fax durante o dia.',
        hfPrompt: 'Close up of hands crafting fabric textile, entrepreneurial experimentation, intimate workshop lighting, cinematic detail shot',
        unsplash: 'fabric textile hands crafting detail',
      },
      {
        capitulo: 'A rejeição',
        titulo: 'TODOS OS\nFABRICANTES\nDISSERAM NÃO.',
        texto1: 'Ela ligou para todas as fábricas de meias dos EUA. Todos os donos eram homens. Todos disseram que a ideia não funcionaria. Um dono disse sim depois de contar para as filhas.',
        texto2: 'Ela usou US$5.000 de economia, escreveu o próprio registro de patente e vendeu pessoalmente para a Neiman Marcus.',
        hfPrompt: 'Woman on phone in small office, rejected but persistent, dramatic window light, cinematic determination, late night working',
        unsplash: 'woman phone office determined night',
      },
      {
        capitulo: 'O resultado',
        titulo: 'SPANX.\nPRIMEIRA\nBILIONÁRIA\nSEM HERDEIRO.',
        texto1: 'A Spanx faturou US$4 milhões no primeiro ano. Sara Blakely tornou-se a primeira mulher bilionária self-made da história dos EUA sem herança ou cônjuge rico.',
        texto2: 'A empresa nunca recebeu investimento externo. Ela tinha 100% das ações.',
        hfPrompt: 'Successful businesswoman in elegant office, achievement atmosphere, warm dramatic lighting, powerful composition, Forbes style portrait',
        unsplash: 'successful businesswoman portrait powerful',
      },
      {
        capitulo: 'A lição',
        citacao: 'Meu pai me perguntava toda semana: "Em que você falhou essa semana?" Ele comemorava o fracasso. Aprendi que falhar significa que você está tentando.',
        autor: 'Sara Blakely, fundadora da Spanx',
        hfPrompt: 'Dark cinematic background with subtle warm light, philosophical contemplative atmosphere, editorial photography style',
        unsplash: 'dark warm light contemplative editorial',
      },
    ],
    cta_titulo: 'SUA IDEIA\nTAMBÉM\nPARECE PEQUENA\nDEMAIS?',
    cta_texto: 'Toda grande marca começou onde ninguém acreditava. Presença visual profissional é o que separa a ideia que morre em silêncio da que o mundo descobre.',
    caption: `Sara Blakely vendia fax porta a porta. Depois cortou a perna da meia-calça para uma festa e viu um bilhão de dólares.\n\nTodos os fabricantes disseram não. Ela foi até o consumidor final.\n\nA Spanx foi criada com US$5.000. Nunca recebeu investimento. Sara ficou com 100% da empresa bilionária.\n\nA ideia estava certa. O que faltava era visibilidade.\n\n#sarablakely #spanx #empreendedorismo #storytelling #mulheresempreendedoras #carbonfilms`,
    pillar: 'inspiracional',
  },
  {
    id: 'flavio-augusto',
    nome: 'Flávio Augusto — Do fracasso escolar ao bilhão sem diploma',
    teaser: 'Reprovado. Sem diploma. R$1 bilhao',
    hook: 'REPROVADO.\nSEM DIPLOMA.\nR$1 BILHÃO\nDE PATRIMÔNIO.',
    hook_sub: 'A história do brasileiro que vendeu a própria empresa para comprar o Orlando City e criou um dos maiores cursos de inglês do mundo.',
    slides: [
      {
        capitulo: 'O contexto',
        titulo: 'NÃO ENTROU\nNA FACULDADE.\nNÃO TINHA\nPLANO B.',
        texto1: 'Flávio Augusto da Silva não passou no vestibular. Enquanto os amigos entravam na universidade, ele ficou para trás sem saber o que fazer.',
        texto2: 'Começou a trabalhar em um curso de inglês como vendedor. Era o pior emprego disponível — e o lugar onde tudo mudou.',
        hfPrompt: 'Young Brazilian man in small language school office, humble beginnings, determined look, warm interior lighting, 1990s Rio de Janeiro',
        unsplash: 'young man office humble beginning warm',
      },
      {
        capitulo: 'A descoberta',
        titulo: 'ELE ERA\nO MELHOR\nVENDEDOR.',
        texto1: 'Em dois anos, Flávio batia todos os recordes de vendas. Mas ganhar comissão não era suficiente — ele queria ser dono.',
        texto2: 'Com 24 anos, pediu dinheiro emprestado para a família e abriu o Wise Up.',
        hfPrompt: 'Brazilian entrepreneur young man on phone, sales energy, 1990s office aesthetic, cinematic drama, ambitious determination',
        unsplash: 'young entrepreneur phone sales energy',
      },
      {
        capitulo: 'O crescimento',
        titulo: 'EM 10 ANOS:\n65 FRANQUIAS.\nSEM BANCO.',
        texto1: 'O Wise Up cresceu sem investidor, sem financiamento bancário. Flávio reinvestia tudo. Em dez anos, eram mais de 65 unidades em todo o Brasil.',
        texto2: 'Em 2013, vendeu o Wise Up por R$700 milhões para o Grupo Abril.',
        hfPrompt: 'Map of Brazil with multiple business locations illuminated, growth visualization, dark dramatic background, cinematic scale',
        unsplash: 'brazil map business growth expansion',
      },
      {
        capitulo: 'O resultado',
        titulo: 'COMPROU\nUM TIME\nDE FUTEBOL\nNOS EUA.',
        texto1: 'Com o dinheiro da venda, comprou participação no Orlando City FC da MLS. Depois lançou o WR Educação, que hoje tem mais de 2 milhões de alunos.',
        texto2: 'O homem que não entrou na faculdade construiu um dos maiores impérios educacionais do Brasil.',
        hfPrompt: 'Soccer stadium at night with dramatic lights, Orlando City colors purple, cinematic sports photography, epic scale',
        unsplash: 'soccer stadium night lights dramatic',
      },
      {
        capitulo: 'A lição',
        citacao: 'Diploma não é garantia de nada. Resultados são a única moeda que o mercado aceita. Eu aprendi vendendo — e vendo onde os outros não enxergavam.',
        autor: 'Flávio Augusto da Silva',
        hfPrompt: 'Dark cinematic background with subtle Brazilian urban atmosphere, philosophical quote style, editorial photography',
        unsplash: 'dark urban brazil cinematic editorial',
      },
    ],
    cta_titulo: 'SEU NEGÓCIO\nTEM RESULTADO.\nO MUNDO\nESTÁ VENDO?',
    cta_texto: 'Flávio Augusto construiu um bilhão com vendas e visibilidade. Sua marca precisa das duas coisas — e a Carbon Films entrega as duas.',
    caption: `Reprovado no vestibular. Sem diploma. Sem banco. Sem investidor.\n\nFlávio Augusto vendeu um curso de inglês por R$700 milhões e comprou um time de futebol nos EUA.\n\nA história dele não é sobre sorte. É sobre saber vender o que tem valor.\n\nO que a sua empresa tem de valor que o mundo ainda não está vendo?\n\n#flavioaugusto #wiseup #empreendedorismo #brasileiros #storytelling #marketingdigital #carbonfilms`,
    pillar: 'inspiracional',
  },
  {
    id: 'luiza-trajano',
    nome: 'Luiza Helena Trajano — De caixa no Magazine a CEO do maior varejista do Brasil',
    teaser: 'Comecou como caixa. Virou CEO',
    hook: 'COMEÇOU\nCOMO CAIXA\nNUM MAGAZIN\nDE INTERIOR.',
    hook_sub: 'Décadas depois, transformou uma loja de família em um império de R$40 bilhões.',
    slides: [
      {
        capitulo: 'O começo',
        titulo: 'UMA LOJA\nNA CIDADE\nDE FRANCA.\n1957.',
        texto1: 'O Magazine Luiza nasceu em Franca, interior de São Paulo. Luiza Helena Trajano entrou aos 12 anos para ajudar os tios. Começou como caixa e vendedora.',
        texto2: 'A cidade tinha menos de 50 mil habitantes. A loja tinha menos de 10 funcionários.',
        hfPrompt: 'Small Brazilian retail store interior 1970s, warm vintage lighting, humble beginnings, film grain texture, nostalgic atmosphere',
        unsplash: 'vintage store interior warm brazil nostalgic',
      },
      {
        capitulo: 'A aposta',
        titulo: 'INTERNET EM\n1999. QUANDO\nNINGUÉM\nACREDITAVA.',
        texto1: 'Em 1999, Luiza apostou no e-commerce quando quase nenhum brasileiro tinha cartão de crédito ou acesso à internet. Os concorrentes riram.',
        texto2: 'Ela via o futuro enquanto o mercado olhava para o presente.',
        hfPrompt: 'Early 2000s computer screen glowing in dark retail office, pioneer internet era, cinematic mood, visionary atmosphere, Brazil',
        unsplash: 'computer screen dark office early internet',
      },
      {
        capitulo: 'A crise',
        titulo: 'QUANDO O\nVAREJO DIZIA\nQUE ELA\nIRIA QUEBRAR.',
        texto1: 'O Magazine Luiza conviveu com crises, inflação e concorrentes maiores. Analistas previam a falência várias vezes. Luiza nunca vendeu.',
        texto2: 'Enquanto outros varejistas foram engolidos, ela continuou investindo em pessoas e tecnologia.',
        hfPrompt: 'Woman executive leading team meeting, Brazilian corporate environment, determined leadership, cinematic dramatic lighting',
        unsplash: 'woman executive leadership team meeting',
      },
      {
        capitulo: 'O resultado',
        titulo: 'R$40 BILHÕES.\n40 MIL\nFUNCIONÁRIOS.',
        texto1: 'O Magazine Luiza hoje tem mais de 40 mil colaboradores, mais de 1.500 lojas e é um dos maiores varejistas da América Latina.',
        texto2: 'Luiza é consistentemente eleita a empresária mais admirada do Brasil.',
        hfPrompt: 'Modern large retail corporation scale, aerial view of headquarters, successful Brazilian business, cinematic drone shot',
        unsplash: 'large retail corporation headquarters aerial',
      },
      {
        capitulo: 'A lição',
        citacao: 'Gente é tudo. Empresa nenhuma cresce sem tratar bem as pessoas que fazem ela funcionar. Isso eu aprendi vendendo no balcão.',
        autor: 'Luiza Helena Trajano',
        hfPrompt: 'Dark warm cinematic background with subtle light, quote philosophy style, Brazilian entrepreneurship atmosphere',
        unsplash: 'dark warm light philosophical brazil',
      },
    ],
    cta_titulo: 'SUA MARCA\nTEM HISTÓRIA.\nESTÁ CONTANDO?',
    cta_texto: 'As marcas que duram décadas são as que constroem confiança com o tempo — e visibilidade com consistência.',
    caption: `Começou como caixa aos 12 anos em uma lojinha de Franca.\n\nApostou na internet em 1999 quando o mercado ria.\n\nHoje comanda um império de R$40 bilhões com 40 mil pessoas.\n\nLuiza Helena Trajano nunca vendeu a empresa. Nunca desistiu. Nunca parou de investir em pessoas.\n\nAlgumas histórias só fazem sentido olhando para trás.\n\n#luizatrajano #magazineluiza #brasil #empreendedorismo #storytelling #carbonfilms #marketingdigital`,
    pillar: 'inspiracional',
  },
];

// ── Memória de histórias ──────────────────────────────────────
function loadStoryMemory() {
  try { return JSON.parse(fs.readFileSync(MEMORY_PATH, 'utf8')); }
  catch { return { used_names: [], used_ids: [], last_used: null }; }
}

function saveStoryMemory(memory) {
  fs.writeFileSync(MEMORY_PATH, JSON.stringify(memory, null, 2));
}

function pickEntrepreneur(memory) {
  if (STORY_ARG) return STORY_ARG;
  const recent = (memory.used_names || []).slice(-15);
  const available = ENTREPRENEURS.filter(n => !recent.includes(n));
  const pool = available.length ? available : ENTREPRENEURS;
  return pool[Math.floor(Math.random() * pool.length)];
}

// ── HTML base ─────────────────────────────────────────────────
const GRAIN_URL = `data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E`;

function headHtml(extraCss = '') {
  return `<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Montserrat:ital,wght@0,300;0,400;0,700;1,300&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:ital@1&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{width:1080px;height:1350px;overflow:hidden;background:#050505;}
.slide{width:1080px;height:1350px;position:relative;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;}
.bg{position:absolute;inset:0;background-size:cover;background-position:center;z-index:0;}
.ov{position:absolute;inset:0;z-index:1;}
.grain{position:absolute;inset:0;z-index:3;pointer-events:none;opacity:0.04;background-image:url("${GRAIN_URL}");background-size:200px;}
.topo{position:relative;z-index:4;padding:60px 72px 0;display:flex;align-items:center;justify-content:space-between;}
.marca{display:flex;align-items:center;gap:18px;}
.logo-c{width:80px;height:80px;border-radius:50%;border:1.5px solid rgba(255,255,255,0.18);overflow:hidden;background:#111;flex-shrink:0;}
.logo-c img{width:100%;height:100%;object-fit:cover;display:block;}
.mn{font-family:'Montserrat',sans-serif;font-weight:700;font-size:34px;color:#fff;letter-spacing:-0.3px;}
.mh{font-family:'JetBrains Mono',monospace;font-size:22px;color:rgba(255,255,255,0.40);}
.ns{font-family:'JetBrains Mono',monospace;font-size:22px;color:rgba(255,255,255,0.30);letter-spacing:0.08em;}
.corpo{position:relative;z-index:4;padding:0 72px;flex:1;display:flex;flex-direction:column;justify-content:flex-end;padding-bottom:100px;}
.cap{font-family:'JetBrains Mono',monospace;font-size:22px;color:rgba(255,255,255,0.35);letter-spacing:0.18em;text-transform:uppercase;margin-bottom:28px;display:block;}
.tit{font-family:'Anton',sans-serif;font-size:88px;color:#fff;line-height:0.98;letter-spacing:-1px;text-transform:uppercase;margin-bottom:44px;}
.txt{font-family:'Montserrat',sans-serif;font-size:37px;color:rgba(255,255,255,0.65);line-height:1.6;font-weight:300;max-width:900px;}
.txt+.txt{margin-top:24px;}
.rod{position:relative;z-index:4;padding:0 72px 52px;display:flex;align-items:center;justify-content:space-between;}
.seta{width:64px;height:64px;background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);border-radius:50%;display:flex;align-items:center;justify-content:center;}
.seta svg{width:26px;height:26px;}
.hint{font-family:'Montserrat',sans-serif;font-size:24px;color:rgba(255,255,255,0.30);font-weight:300;margin-left:16px;}
.cont{font-family:'JetBrains Mono',monospace;font-size:20px;color:rgba(255,255,255,0.20);}
@keyframes arr-pulse{0%,100%{transform:translateX(0);opacity:0.45;}60%{transform:translateX(8px);opacity:0.90;}}
.swipe-arr{animation:arr-pulse 2.2s ease-in-out infinite;}
.prog{display:flex;gap:9px;align-items:center;}
.prog span{display:block;width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,0.15);}
.prog span.on{background:rgba(255,255,255,0.65);width:22px;border-radius:4px;}
.swipe-cta{display:flex;align-items:center;gap:12px;font-family:'Montserrat',sans-serif;font-size:24px;color:rgba(255,255,255,0.38);font-weight:300;}
${extraCss}
</style>`;
}

function marcaHtml(logo, num) {
  return `<div class="topo">
    <div class="marca">
      <div class="logo-c"><img src="${logo}" alt=""></div>
      <span class="mh">@carbonfilms.sc</span>
    </div>
    <span class="ns">${num}</span>
  </div>`;
}

function overlayGrad(strength = 'normal') {
  const g = {
    normal:     'rgba(5,5,5,0.65) 0%,rgba(5,5,5,0.20) 35%,rgba(5,5,5,0.82) 65%,rgba(5,5,5,1.0) 100%',
    heavy:      'rgba(5,5,5,0.80) 0%,rgba(5,5,5,0.45) 35%,rgba(5,5,5,0.90) 65%,rgba(5,5,5,1.0) 100%',
    capa:       'rgba(5,5,5,0.55) 0%,rgba(5,5,5,0.15) 30%,rgba(5,5,5,0.72) 60%,rgba(5,5,5,0.98) 100%',
    cinematic:  'rgba(5,5,5,0.52) 0%,rgba(5,5,5,0.00) 22%,rgba(5,5,5,0.00) 50%,rgba(5,5,5,0.88) 72%,rgba(5,5,5,1.00) 100%',
  };
  return `linear-gradient(to bottom,${g[strength] || g.normal})`;
}

// ── Slide builders ────────────────────────────────────────────
function buildSlide1(logo, story, img) {
  const personName = story.nome.split('—')[0].trim().toUpperCase();
  const teaser     = (story.teaser || story.hook.split('\n').slice(0, 2).join(' ')).toUpperCase();
  return `<!DOCTYPE html><html lang="pt-BR"><head>${headHtml(`
.s1{width:1080px;height:1350px;position:relative;overflow:hidden;background:#050505;}
.s1-img{position:absolute;inset:0;background-size:cover;background-position:center 18%;z-index:0;}
.s1-grad{position:absolute;inset:0;z-index:1;
  background:linear-gradient(to bottom,
    rgba(5,5,5,0.62) 0%,
    rgba(5,5,5,0.00) 22%,
    rgba(5,5,5,0.00) 58%,
    rgba(5,5,5,0.78) 76%,
    rgba(5,5,5,0.97) 90%,
    rgba(5,5,5,1.00) 100%);}
.s1-grain{position:absolute;inset:0;z-index:2;pointer-events:none;opacity:0.04;background-image:url("${GRAIN_URL}");background-size:200px;}
.s1-top{position:absolute;top:0;left:0;right:0;z-index:4;padding:52px 64px 0;display:flex;align-items:center;justify-content:space-between;}
.s1-marca{display:flex;align-items:center;gap:14px;}
.s1-logo{width:52px;height:52px;border-radius:50%;border:1.5px solid rgba(255,255,255,0.20);overflow:hidden;background:#111;flex-shrink:0;}
.s1-logo img{width:100%;height:100%;object-fit:cover;display:block;}
.s1-handle{font-family:'JetBrains Mono',monospace;font-size:21px;color:rgba(255,255,255,0.40);letter-spacing:0.04em;}
.s1-num{font-family:'JetBrains Mono',monospace;font-size:20px;color:rgba(255,255,255,0.28);letter-spacing:0.10em;}
.s1-bottom{position:absolute;bottom:0;left:0;right:0;z-index:4;padding:0 64px 60px;}
.s1-name{display:block;font-family:'JetBrains Mono',monospace;font-size:22px;color:rgba(255,255,255,0.38);letter-spacing:0.16em;margin-bottom:20px;}
.s1-teaser{display:block;font-family:'Anton',sans-serif;font-size:96px;color:#fff;line-height:0.93;letter-spacing:-1px;text-transform:uppercase;margin-bottom:44px;}
.s1-swipe{display:flex;align-items:center;gap:14px;}
.s1-swipe-txt{font-family:'JetBrains Mono',monospace;font-size:20px;color:rgba(255,255,255,0.38);letter-spacing:0.14em;text-transform:uppercase;}
`)}</head><body>
<div class="s1">
  <div class="s1-img" style="background-image:url('${img}');"></div>
  <div class="s1-grad"></div>
  <div class="s1-grain"></div>
  <div class="s1-top">
    <div class="s1-marca">
      <div class="s1-logo"><img src="${logo}" alt=""></div>
      <span class="s1-handle">@carbonfilms.sc</span>
    </div>
    <span class="s1-num">01 / 07</span>
  </div>
  <div class="s1-bottom">
    <span class="s1-name">${personName}</span>
    <span class="s1-teaser">${teaser}</span>
    <div class="s1-swipe">
      <svg class="swipe-arr" width="26" height="26" viewBox="0 0 26 26" fill="none"><path d="M5 13h16M14 7l6 6-6 6" stroke="rgba(255,255,255,0.50)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span class="s1-swipe-txt">arraste para ver</span>
    </div>
  </div>
</div></body></html>`;
}

function progDots(active) {
  return `<div class="prog">${Array.from({length:7},(_,i)=>`<span class="${i===active-1?'on':''}"></span>`).join('')}</div>`;
}

function buildSlideNarrative(logo, slide, num, img) {
  const numStr = String(num).padStart(2, '0');
  return `<!DOCTYPE html><html lang="pt-BR"><head>${headHtml(`
.sn{width:1080px;height:1350px;position:relative;overflow:hidden;background:#050505;}
.sn-img{position:absolute;inset:0;background-size:cover;background-position:center;z-index:0;}
.sn-grad{position:absolute;inset:0;z-index:1;background:${overlayGrad('cinematic')};}
.sn-grain{position:absolute;inset:0;z-index:2;pointer-events:none;opacity:0.04;background-image:url("${GRAIN_URL}");background-size:200px;}
.sn-top{position:absolute;top:0;left:0;right:0;z-index:4;padding:52px 64px 0;display:flex;align-items:center;justify-content:space-between;}
.sn-marca{display:flex;align-items:center;gap:14px;}
.sn-logo{width:52px;height:52px;border-radius:50%;border:1.5px solid rgba(255,255,255,0.18);overflow:hidden;background:#111;flex-shrink:0;}
.sn-logo img{width:100%;height:100%;object-fit:cover;display:block;}
.sn-handle{font-family:'JetBrains Mono',monospace;font-size:21px;color:rgba(255,255,255,0.38);letter-spacing:0.04em;}
.sn-num{font-family:'JetBrains Mono',monospace;font-size:20px;color:rgba(255,255,255,0.25);letter-spacing:0.10em;}
.sn-bottom{position:absolute;bottom:0;left:0;right:0;z-index:4;padding:0 64px 56px;}
.sn-tit{display:block;font-family:'Anton',sans-serif;font-size:104px;color:#fff;line-height:0.92;letter-spacing:-1.5px;text-transform:uppercase;margin-bottom:28px;}
.sn-txt{display:block;font-family:'Montserrat',sans-serif;font-size:34px;color:rgba(255,255,255,0.60);line-height:1.45;font-weight:300;max-width:880px;margin-bottom:40px;}
.sn-rod{display:flex;align-items:center;justify-content:space-between;}
.sn-prog{display:flex;gap:9px;align-items:center;}
.sn-prog span{display:block;width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,0.15);}
.sn-prog span.on{background:rgba(255,255,255,0.65);width:22px;border-radius:4px;}
.sn-swipe{display:flex;align-items:center;gap:12px;font-family:'JetBrains Mono',monospace;font-size:19px;color:rgba(255,255,255,0.30);letter-spacing:0.12em;text-transform:uppercase;}
`)}</head><body>
<div class="sn">
  <div class="sn-img" style="background-image:url('${img}');"></div>
  <div class="sn-grad"></div>
  <div class="sn-grain"></div>
  <div class="sn-top">
    <div class="sn-marca">
      <div class="sn-logo"><img src="${logo}" alt=""></div>
      <span class="sn-handle">@carbonfilms.sc</span>
    </div>
    <span class="sn-num">${numStr} / 07</span>
  </div>
  <div class="sn-bottom">
    <span class="sn-tit">${slide.titulo || ''}</span>
    <span class="sn-txt">${slide.texto1 || ''}</span>
    <div class="sn-rod">
      <div class="sn-prog">${Array.from({length:7},(_,i)=>`<span class="${i===num-1?'on':''}"></span>`).join('')}</div>
      <div class="sn-swipe">
        <svg class="swipe-arr" width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M4 11h14M11 5l6 6-6 6" stroke="rgba(255,255,255,0.35)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>arraste</span>
      </div>
    </div>
  </div>
</div></body></html>`;
}

function buildSlideCitacao(logo, slide, img) {
  const citacao = slide?.citacao || slide?.quote || slide?.frase || slide?.texto1 || slide?.titulo || '';
  const autor   = slide?.autor   || slide?.source || slide?.autoria || slide?.capitulo || '';
  return `<!DOCTYPE html><html lang="pt-BR"><head>${headHtml(`
.cit{font-family:'Playfair Display',serif;font-style:italic;font-size:58px;color:#fff;line-height:1.35;letter-spacing:-0.5px;max-width:880px;margin-bottom:48px;position:relative;z-index:5;}
.at{font-family:'JetBrains Mono',monospace;font-size:24px;color:rgba(255,255,255,0.30);letter-spacing:0.10em;text-transform:uppercase;position:relative;z-index:5;}
.lv{width:64px;height:1px;background:rgba(255,255,255,0.20);margin-bottom:32px;position:relative;z-index:5;}
.asp{font-family:'Playfair Display',serif;font-style:italic;font-size:200px;line-height:0.5;color:rgba(255,255,255,0.04);position:absolute;top:160px;left:60px;pointer-events:none;z-index:2;}
`)}</head><body>
<div class="slide" style="background:#070707;">
  <div class="bg" style="background-image:url('${img}');opacity:0.15;"></div>
  <div class="grain"></div>
  <div class="asp">"</div>
  ${marcaHtml(logo, '06 / 07')}
  <div style="position:relative;z-index:4;padding:0 72px;flex:1;display:flex;flex-direction:column;justify-content:center;">
    <p class="cit">${citacao}</p>
    <div class="lv"></div>
    <span class="at">${autor}</span>
  </div>
  <div class="rod">
    ${progDots(6)}
    <div style="display:flex;align-items:center;gap:14px;">
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M4 11V17a1 1 0 001 1h12a1 1 0 001-1v-6M11 3v10M7 7l4-4 4 4" stroke="rgba(255,255,255,0.40)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span style="font-family:'Montserrat',sans-serif;font-size:24px;color:rgba(255,255,255,0.38);font-weight:300;">salve esse post</span>
    </div>
  </div>
</div></body></html>`;
}

function buildSlideCta(logo, story, img) {
  return `<!DOCTYPE html><html lang="pt-BR"><head>${headHtml(`
.sc{width:1080px;height:1350px;position:relative;overflow:hidden;background:#050505;}
.sc-img{position:absolute;inset:0;background-size:cover;background-position:center;z-index:0;}
.sc-grad{position:absolute;inset:0;z-index:1;background:${overlayGrad('heavy')};}
.sc-grain{position:absolute;inset:0;z-index:2;pointer-events:none;opacity:0.04;background-image:url("${GRAIN_URL}");background-size:200px;}
.sc-top{position:absolute;top:0;left:0;right:0;z-index:4;padding:52px 64px 0;display:flex;align-items:center;justify-content:space-between;}
.sc-marca{display:flex;align-items:center;gap:14px;}
.sc-logo{width:52px;height:52px;border-radius:50%;border:1.5px solid rgba(255,255,255,0.18);overflow:hidden;background:#111;flex-shrink:0;}
.sc-logo img{width:100%;height:100%;object-fit:cover;display:block;}
.sc-handle{font-family:'JetBrains Mono',monospace;font-size:21px;color:rgba(255,255,255,0.38);letter-spacing:0.04em;}
.sc-num{font-family:'JetBrains Mono',monospace;font-size:20px;color:rgba(255,255,255,0.25);letter-spacing:0.10em;}
.sc-body{position:absolute;bottom:0;left:0;right:0;z-index:4;padding:0 64px 56px;}
.sc-pergunta{display:block;font-family:'Anton',sans-serif;font-size:96px;color:#fff;line-height:0.92;letter-spacing:-1.5px;text-transform:uppercase;margin-bottom:36px;}
.sc-texto{display:block;font-family:'Montserrat',sans-serif;font-size:32px;color:rgba(255,255,255,0.55);line-height:1.45;font-weight:300;max-width:860px;margin-bottom:48px;}
.sc-divider{width:1px;height:48px;background:rgba(255,255,255,0.20);}
.sc-dm-wrap{display:flex;align-items:center;gap:28px;margin-bottom:40px;}
.sc-dm-inner{}
.sc-dm-label{display:block;font-family:'Montserrat',sans-serif;font-size:26px;color:rgba(255,255,255,0.40);font-weight:300;margin-bottom:6px;}
.sc-dm-handle{display:block;font-family:'JetBrains Mono',monospace;font-size:30px;color:#fff;letter-spacing:0.05em;}
.sc-actions{display:flex;align-items:center;gap:32px;}
.sc-action{display:flex;align-items:center;gap:10px;font-family:'Montserrat',sans-serif;font-size:25px;color:rgba(255,255,255,0.32);font-weight:300;}
.sc-sep{width:1px;height:22px;background:rgba(255,255,255,0.12);}
`)}</head><body>
<div class="sc">
  <div class="sc-img" style="background-image:url('${img}');"></div>
  <div class="sc-grad"></div>
  <div class="sc-grain"></div>
  <div class="sc-top">
    <div class="sc-marca">
      <div class="sc-logo"><img src="${logo}" alt=""></div>
      <span class="sc-handle">@carbonfilms.sc</span>
    </div>
    <span class="sc-num">07 / 07</span>
  </div>
  <div class="sc-body">
    <span class="sc-pergunta">${(story.cta_titulo || '').replace(/\\n/g, '<br>')}</span>
    <span class="sc-texto">${story.cta_texto || ''}</span>
    <div class="sc-dm-wrap">
      <div class="sc-divider"></div>
      <div class="sc-dm-inner">
        <span class="sc-dm-label">conversa sem compromisso</span>
        <span class="sc-dm-handle">DM @carbonfilms.sc</span>
      </div>
    </div>
    <div class="sc-actions">
      <div class="sc-action">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 12V18a1 1 0 001 1h14a1 1 0 001-1v-6M12 3v10M8 7l4-4 4 4" stroke="rgba(255,255,255,0.32)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>salve</span>
      </div>
      <div class="sc-sep"></div>
      <div class="sc-action">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M20 12.5L12 20m0 0l-8-7.5M12 20V4" stroke="rgba(255,255,255,0.32)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
        <span>compartilhe</span>
      </div>
    </div>
  </div>
</div></body></html>`;
}

// ── Imgur upload ──────────────────────────────────────────────
async function uploadImgur(filePath) {
  const clientId = process.env.IMGUR_CLIENT_ID;
  if (!clientId) throw new Error('IMGUR_CLIENT_ID não definido');
  const data = fs.readFileSync(filePath).toString('base64');
  const body  = `image=${encodeURIComponent(data)}&type=base64`;
  const res   = await httpPost('https://api.imgur.com/3/image', body, {
    Authorization: `Client-ID ${clientId}`,
    'Content-Type': 'application/x-www-form-urlencoded',
  });
  const json = JSON.parse(res);
  if (!json.success) throw new Error('Imgur falhou: ' + JSON.stringify(json.data));
  return json.data.link;
}

// ── WhatsApp via Evolution API ────────────────────────────────
async function evolutionRequest(endpoint, body) {
  const apiKey = process.env.EVOLUTION_API_KEY || 'Carbonfilms2025#';
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify(body);
    const u = new URL(`${EVOLUTION_URL}${endpoint}`);
    const req = http.request({
      hostname: u.hostname, port: u.port || 8081,
      path: u.pathname, method: 'POST',
      headers: { 'apikey': apiKey, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
    }, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => resolve(JSON.parse(d))); });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function waSendText(text) {
  return evolutionRequest(`/message/sendText/${EVOLUTION_INSTANCE}`, { number: YAN_WHATSAPP, text });
}

async function waSendImage(filePath, caption) {
  const base64   = fs.readFileSync(filePath).toString('base64');
  const fileName = path.basename(filePath);
  return evolutionRequest(`/message/sendMedia/${EVOLUTION_INSTANCE}`, {
    number: YAN_WHATSAPP, mediatype: 'image', mimetype: 'image/jpeg',
    media: base64, fileName, caption,
  });
}

function getPostingTime() {
  const days = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
  const day = new Date().getDay();
  // Após 14h: melhor horário é sempre 19h, com 20h como alternativa
  const times = { 1: '19h', 2: '19h', 3: '19h', 4: '20h', 5: '19h' };
  const hora = times[day] || '19h';
  return `Poste hoje (${days[day]}) as *${hora}* — pico de engajamento no Instagram Brasil.`;
}

async function sendViaWhatsApp(story, personName) {
  const slideLabels = ['Capa', 'Origem', 'A crise', 'Virada', 'Resultado', 'Citacao', 'CTA'];
  const horario = getPostingTime();

  log('Enviando slides para o WhatsApp...');
  await waSendText(`*Carrossel pronto — ${personName}*\n\n${story.nome.split('—')[1]?.trim() || ''}`);
  await sleep(1200);

  for (let i = 1; i <= 7; i++) {
    const fp = path.join(OUT, `slide-${i}.jpg`);
    await waSendImage(fp, `${i}/7 — ${slideLabels[i - 1]}`);
    log(`  [${i}/7] WhatsApp ok`);
    await sleep(1800);
  }

  await waSendText(`*Legenda:*\n\n${story.caption}`);
  await sleep(1200);
  await waSendText(horario);

  log('Slides e legenda enviados para o WhatsApp.');
}

// ── Buffer post ───────────────────────────────────────────────
async function postBuffer(imageUrls, caption) {
  const token = process.env.BUFFER_ACCESS_TOKEN;
  if (!token) throw new Error('BUFFER_ACCESS_TOKEN não definido');

  const variables = {
    input: {
      channelId:      '69ff20b95c4c051afa293dc1',
      schedulingType: 'automatic',
      mode:           'shareNow',
      text:           caption,
      assets:         imageUrls.map(url => ({ image: { url } })),
      metadata:       { instagram: { type: 'post', shouldShareToFeed: true } },
    },
  };

  const mutation = `mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      ... on PostActionSuccess { post { id status dueAt } }
      ... on InvalidInputError { message }
      ... on LimitReachedError { message }
      ... on UnauthorizedError { message }
      ... on UnexpectedError { message }
      ... on RestProxyError { message }
    }
  }`;

  const res  = await httpPost('https://api.buffer.com/', JSON.stringify({ query: mutation, variables }), {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  });
  const json = JSON.parse(res);
  if (json.errors) throw new Error('Buffer erro: ' + JSON.stringify(json.errors));
  return json.data?.createPost;
}

// ── HTTP helpers ──────────────────────────────────────────────
function httpGet(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, { headers }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}

function httpPost(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const u   = new URL(url);
    const lib = url.startsWith('https') ? https : http;
    const req = lib.request({
      hostname: u.hostname, port: u.port || (url.startsWith('https') ? 443 : 80),
      path: u.pathname + u.search, method: 'POST',
      headers: { ...headers, 'Content-Length': Buffer.byteLength(body) },
    }, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Story preview HTML ────────────────────────────────────────
function buildPreviewHtml(storyNome) {
  const ts = new Date().toLocaleString('pt-BR');
  return `<!DOCTYPE html><html lang="pt-BR"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Story Preview — Carbon Films</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{background:#080808;font-family:monospace;color:#fff;padding:48px 32px;}
h1{font-size:13px;letter-spacing:.2em;color:#333;text-transform:uppercase;margin-bottom:6px;}
.sub{font-size:12px;color:#222;margin-bottom:48px;}
.grid{display:flex;flex-wrap:wrap;gap:20px;justify-content:center;}
.card{display:flex;flex-direction:column;align-items:center;gap:10px;}
.cap{font-size:11px;color:#2a2a2a;letter-spacing:.14em;text-transform:uppercase;}
.card img{display:block;width:280px;height:350px;object-fit:cover;border-radius:8px;border:1px solid #141414;cursor:pointer;transition:transform .2s,border-color .2s;}
.card img:hover{transform:scale(1.04);border-color:#2a2a2a;}
#lb{display:none;position:fixed;inset:0;background:rgba(0,0,0,.95);z-index:99;align-items:center;justify-content:center;}
#lb.open{display:flex;}
#lb img{max-height:94vh;max-width:94vw;border-radius:10px;}
#lb-close{position:absolute;top:24px;right:32px;font-size:24px;color:#444;cursor:pointer;letter-spacing:.1em;}
#lb-close:hover{color:#fff;}
#lb-nav{position:absolute;bottom:28px;font-size:11px;color:#333;letter-spacing:.16em;}
</style></head><body>
<h1>Carbon Films — Storytelling</h1>
<div class="sub">${storyNome || ''} · 7 slides · 1080×1350px · ${ts}</div>
<div class="grid" id="grid"></div>
<div id="lb"><span id="lb-close">FECHAR</span><img id="lb-img" src="" alt=""><span id="lb-nav"></span></div>
<script>
const slides=[
  {n:1,cap:'01 — hook'},{n:2,cap:'02 — contexto'},{n:3,cap:'03 — a crise'},
  {n:4,cap:'04 — a decisão'},{n:5,cap:'05 — resultado'},{n:6,cap:'06 — a lição'},{n:7,cap:'07 — cta'},
];
let cur=0;
const grid=document.getElementById('grid');
slides.forEach((s,i)=>{
  const card=document.createElement('div');card.className='card';
  const cap=document.createElement('div');cap.className='cap';cap.textContent=s.cap;
  const img=document.createElement('img');
  img.src='slide-'+s.n+'.jpg?t='+Date.now();img.alt='Slide '+s.n;
  img.onclick=()=>{cur=i;open();};
  card.appendChild(cap);card.appendChild(img);grid.appendChild(card);
});
const lb=document.getElementById('lb');
const lbImg=document.getElementById('lb-img');
const lbNav=document.getElementById('lb-nav');
function open(){lbImg.src=slides[cur].n>0?'slide-'+slides[cur].n+'.jpg?t='+Date.now():'';lbNav.textContent=(cur+1)+' / '+slides.length;lb.classList.add('open');}
document.getElementById('lb-close').onclick=()=>lb.classList.remove('open');
lb.onclick=(e)=>{if(e.target===lb)lb.classList.remove('open');};
document.addEventListener('keydown',(e)=>{
  if(!lb.classList.contains('open'))return;
  if(e.key==='ArrowRight'){cur=(cur+1)%slides.length;open();}
  if(e.key==='ArrowLeft'){cur=(cur-1+slides.length)%slides.length;open();}
  if(e.key==='Escape')lb.classList.remove('open');
});
</script></body></html>`;
}

// ── Log ───────────────────────────────────────────────────────
const LOG_PATH = path.join(ROOT, 'logs', 'story.log');
function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}`;
  console.log(line);
  try { fs.appendFileSync(LOG_PATH, line + '\n'); } catch {}
}

// ── Pipeline principal ────────────────────────────────────────
async function main() {
  loadEnv();
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
  if (!fs.existsSync(path.join(ROOT, 'logs'))) fs.mkdirSync(path.join(ROOT, 'logs'), { recursive: true });

  const hasHF = process.env.HF_API_KEY && !process.env.HF_API_KEY.includes('COLOQUE');
  log(`\n=== Carbon Films — Story Pipeline ===`);
  log(`Higgsfield API: ${hasHF ? 'ativa' : 'sem credenciais — usando Unsplash'}`);
  log(`Modo: ${DRY_RUN ? 'dry-run' : 'publicação'}`);

  const memory   = loadStoryMemory();
  const personName = pickEntrepreneur(memory);
  log(`Empresário: ${personName}`);

  // Gera história dinamicamente via Claude API
  const story = await generateStory(personName);
  log(`História gerada: ${story.nome}`);

  const logo = getLogoBase64();

  // Imagens: slide 1 = retrato Wikipedia, demais = Higgsfield → Unsplash
  const slideList = story.slides;
  log('Buscando imagens...');

  const images = [];

  // Slide 1 — retrato da pessoa (Wikipedia → Higgsfield → Unsplash)
  // Quando Wikipedia falha, usa o hfPrompt do slide 2 (contextualizado pela história)
  // soul_location gera cenas sem pessoas — cria atmosfera cinematográfica do contexto do hook
  const hfPortraitPrompt = story.slides[0]?.hfPrompt ||
    `Dramatic cinematic empty scene, dark moody atmosphere, 35mm film, storytelling photography`;
  const unsplashPortraitQ = `${story.slides[0]?.unsplash || 'cinematic dark portrait dramatic'}`;
  const img1 = await getPortraitImage(
    story.wikiTitle,
    hfPortraitPrompt,
    unsplashPortraitQ
  );
  images.push(img1 || '');
  log(`  [1/7] retrato: ${img1 ? 'ok' : 'sem imagem'}`);

  // Slides 2-6: Higgsfield soul_location (0.12 créditos cada) → fallback Unsplash
  // Slide 7 (CTA): Unsplash (sem gerar, usa contexto genérico)
  // Custo total: 5 × 0.12 = 0.60 créditos/carrossel × 30 dias = 18 créditos/mês
  const UNSPLASH_FALLBACKS = [
    'dark cinematic empty room dramatic',
    'dramatic architecture interior dark moody',
    'cinematic shadow light contrast scene',
    'dark corridor spotlight dramatic film',
  ];
  function fallbackUnsplash(i) {
    return UNSPLASH_FALLBACKS[i % UNSPLASH_FALLBACKS.length];
  }

  for (let i = 0; i < 6; i++) {
    const slide     = slideList[i];
    const unsplashQ = slide?.unsplash || fallbackUnsplash(i);
    const hfPrompt  = slide?.hfPrompt || '';
    const isCtaSlide = i === 5; // slide 7 = CTA, usa Unsplash
    let img;
    if (!isCtaSlide && hfPrompt) {
      // Slides 2-6: Higgsfield soul_location
      img = await getImage(hfPrompt, unsplashQ);
    }
    // Fallback: Unsplash com query específica, depois genérica
    if (!img) img = await fetchUnsplash(unsplashQ);
    if (!img) img = await fetchUnsplash(fallbackUnsplash(i));
    images.push(img || '');
    log(`  [${i + 2}/7] ${img ? 'ok' : 'sem imagem'}${!isCtaSlide && hfPrompt ? ' (hf→unsplash)' : ''}`);
    await sleep(200);
  }

  // Gera HTMLs
  log('Gerando slides...');
  const htmlFiles = [];

  const s = slideList;
  const htmls = [
    buildSlide1(logo, story, images[0]),
    buildSlideNarrative(logo, s[0], 2, images[1]),
    buildSlideNarrative(logo, s[1], 3, images[2]),
    buildSlideNarrative(logo, s[2], 4, images[3]),
    buildSlideNarrative(logo, s[3], 5, images[4]),
    buildSlideCitacao(logo, s[4], images[5]),
    buildSlideCta(logo, story, images[6]),
  ];

  for (let i = 0; i < 7; i++) {
    const fp = path.join(OUT, `slide-${i + 1}.html`);
    fs.writeFileSync(fp, htmls[i], 'utf8');
    htmlFiles.push(fp);
    log(`  slide-${i + 1}.html`);
  }

  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify({
    generated_at: new Date().toISOString(),
    format: 'feed', total: 7, files: htmlFiles,
  }, null, 2));

  fs.writeFileSync(path.join(OUT, 'story-preview.html'), buildPreviewHtml(story.nome), 'utf8');

  // Captura via Playwright
  log('Capturando screenshots...');
  const { captureSlides } = require('./capture-slides');
  await captureSlides();

  if (DRY_RUN) {
    log('Dry-run: slides gerados, sem postagem.');
    log(`Preview: http://76.13.172.41:8080/story-preview.html`);
    return;
  }

  // Envia para WhatsApp do Yan
  await sendViaWhatsApp(story, personName);

  // Salva memória
  memory.used_names = [...(memory.used_names || []), personName].slice(-30);
  memory.used_ids   = [...(memory.used_ids || []), story.id].slice(-30);
  memory.last_used  = story.id;
  memory.last_post  = { sent_at: new Date().toISOString(), story: story.id, person: personName };
  saveStoryMemory(memory);

  // Salva em post-history.json
  try {
    const hist = JSON.parse(fs.readFileSync(HISTORY_PATH, 'utf8') || '[]');
    hist.unshift({ sent_at: new Date().toISOString(), topic: story.nome, pillar: story.pillar, type: 'storytelling' });
    fs.writeFileSync(HISTORY_PATH, JSON.stringify(hist.slice(0, 100), null, 2));
  } catch {}

  log('=== Pipeline concluída com sucesso ===\n');
}

main().catch(err => { log(`ERRO: ${err.message}`); process.exit(1); });
