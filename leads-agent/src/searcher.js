/**
 * Busca URLs de negócios locais via DuckDuckGo com Playwright (browser real).
 * Suporta múltiplos nichos: imobiliárias, restaurantes, academias, clínicas, etc.
 */
const { chromium } = require('playwright');
const { load: loadState, save: saveState } = require('./search-state');
const { log, logError } = require('./logger');

const EXCLUDE_DOMAINS = [
  'zapimoveis.com.br', 'vivareal.com.br', 'quintoandar.com.br',
  'imovelweb.com.br', 'olx.com.br', 'mercadolivre.com.br',
  'lopes.com.br', 'remax.com.br', 'century21.com.br',
  'chaves.com.br', 'wimoveis.com.br', 'imobiliariabrasil.com.br',
  'wikipedia.org', 'facebook.com', 'instagram.com', 'linkedin.com',
  'youtube.com', 'twitter.com', 'google.com', 'bing.com',
  'imobiliarias.com.br', 'imovel.com.br', 'properati.com.br',
  'duckduckgo.com', 'duck.ai', 'w3.org', 'apple.com',
  'zap.com.br', 'ifood.com.br', 'anotaai.com', 'abrasel.com.br',
  'guiademedicina.com.br', 'doctoralia.com.br', 'vitaldent.com.br',
  'academiadesportes.com.br', 'totalpass.com.br', 'gympass.com',
];

// 27 cidades brasileiras — SC com prioridade (Carbon Films está em SC)
const CITIES = [
  'Florianópolis SC', 'Joinville SC', 'Blumenau SC', 'Chapecó SC',
  'Itajaí SC', 'Balneário Camboriú SC', 'Criciúma SC', 'Tubarão SC',
  'São José SC', 'Palhoça SC', 'Jaraguá do Sul SC', 'Brusque SC',
  'Lages SC', 'Caçador SC', 'Concórdia SC', 'Araranguá SC',
  'Curitiba PR', 'Londrina PR', 'Maringá PR', 'Cascavel PR',
  'Porto Alegre RS', 'Caxias do Sul RS', 'Pelotas RS',
  'Campinas SP', 'Sorocaba SP', 'Ribeirão Preto SP', 'Santos SP',
];

// Templates de busca por nicho
const NICHE_TEMPLATES = {
  imobiliarias: [
    'imobiliária {city} compra venda imóveis CRECI -assessoria -consultoria -zapimoveis -vivareal -olx',
    'imobiliária {city} "à venda" "comprar imóvel" -assessoria -zapimoveis -vivareal',
    'imobiliária {city} "imóveis à venda" -assessoria -consultoria -zapimoveis -vivareal',
    'imobiliária {city} CRECI "venda de imóveis" -assessoria -zapimoveis -olx',
  ],
  restaurantes: [
    'restaurante {city} site próprio cardápio delivery -ifood -anotaai -uber',
    'restaurante {city} "reserva online" OR "peça aqui" -ifood -tripadvisor -google',
    'churrascaria OR pizzaria OR hamburgueria {city} site -ifood -tripadvisor',
    'restaurante {city} "conheça nosso cardápio" -ifood -rappi',
  ],
  academias: [
    'academia de musculação {city} site -totalpass -gympass -smartfit',
    'academia fitness {city} "matricule-se" OR "agende sua aula" -totalpass -gympass',
    'personal trainer {city} site próprio agendamento -instagram -linkedin',
    'crossfit OR funcional OR pilates {city} site -totalpass -gympass',
  ],
  clinicas: [
    'clínica odontológica {city} site agendamento -doctoralia -convenio',
    'clínica estética {city} "agende sua consulta" -doctoralia -guiademedicina',
    'clínica de fisioterapia OR nutrição {city} site -doctoralia',
    'consultório médico OR dermatologista {city} site próprio -doctoralia -plano',
  ],
  saloes: [
    'salão de beleza {city} site agendamento -guia -listagem',
    'barbearia {city} "agende seu horário" site próprio -trinks -booksy',
    'estética facial OR corporal {city} site agendamento -guia',
    'manicure OR spa {city} site próprio -instagram -listagem',
  ],
  escritorios: [
    'escritório de advocacia {city} site -migalhas -jusbrasil',
    'contabilidade OR escritório contábil {city} site -contabilizei -agilize',
    'arquitetura OR design de interiores {city} site portfólio -archdaily -behance',
    'agência de marketing OR publicidade {city} site -linkedin -google',
  ],
};

function buildQuery(template, city) {
  return template.replace('{city}', city);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Padrões no domínio que indicam assessoria/consultoria (não imobiliária de venda)
const ASSESSORIA_DOMAIN_PATTERNS = [
  /assessoria/i, /consultoria/i, /consultor[ia]/i, /gestao/i,
  /gestão/i, /corretora/i, /corretor\b/i, /advogad/i,
];

function isValidLead(hostname) {
  if (EXCLUDE_DOMAINS.some(d => hostname.includes(d))) return false;
  // Só aceita domínios .com.br (foco em imobiliárias brasileiras com site próprio)
  if (!hostname.endsWith('.com.br') && !hostname.endsWith('.imb.br')) return false;
  // Rejeita domínios de assessoria/consultoria
  if (ASSESSORIA_DOMAIN_PATTERNS.some(re => re.test(hostname))) return false;
  return true;
}

async function searchOnce(page, query) {
  const urls = [];
  try {
    await page.goto('https://duckduckgo.com/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await sleep(800 + Math.random() * 500);

    // Digita a query na caixa de busca
    await page.fill('input[name="q"]', query);
    await sleep(300 + Math.random() * 200);
    await page.keyboard.press('Enter');
    await page.waitForLoadState('domcontentloaded', { timeout: 20000 });
    await sleep(1500);

    // Múltiplos seletores para capturar links orgânicos do DDG (seletores mudam com versões)
    const links = await page.$$eval(
      'article[data-testid="result"] a[data-testid="result-title-a"], ' +
      'a[data-testid="result-title-a"], ' +
      'h2.EKtkFWMYpwzMKOYr0GYm a, ' +
      '.result__a, .result-title a, a.result-link, ' +
      '.Rlt__Info a.Rlt__Title',
      els => els.map(a => a.href).filter(h => h && h.startsWith('http'))
    ).catch(() => []);

    // Fallback robusto: todos hrefs com .com.br
    const fallback = await page.$$eval('a[href]', els =>
      els.map(a => a.href)
         .filter(h => h && h.includes('.com.br') && !h.includes('duckduckgo') && !h.includes('bing.com'))
    ).catch(() => []);

    const candidates = [...links, ...fallback];
    for (const url of candidates) {
      try {
        const host = new URL(url).hostname.replace(/^www\./, '');
        if (isValidLead(host)) {
          urls.push(url.split('?')[0]);
        }
      } catch { /* URL inválida */ }
    }
  } catch (err) {
    logError(`Busca falhou para "${query}": ${err.message}`);
  }
  return [...new Set(urls)];
}

async function search(targetCount, existingHosts, nicho = 'imobiliarias') {
  const TEMPLATES = NICHE_TEMPLATES[nicho] || NICHE_TEMPLATES.imobiliarias;
  const stateKey = `${nicho}_cityIndex`;
  const stateKey2 = `${nicho}_templateIndex`;
  const state = loadState();
  let cityIndex = state[stateKey] || 0;
  let templateIndex = state[stateKey2] || 0;
  const seenHosts = new Set(existingHosts);
  const allURLs = [];

  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  try {
    const ctx = await browser.newContext({
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'pt-BR',
      timezoneId: 'America/Sao_Paulo',
    });
    const page = await ctx.newPage();
    await page.route('**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,mp4,mp3}', r => r.abort());

    while (allURLs.length < targetCount) {
      if (cityIndex >= CITIES.length) {
        log(`[${nicho}] Ciclo completo de cidades — reiniciando`);
        cityIndex = 0;
        templateIndex = 0;
      }

      const city = CITIES[cityIndex];
      const query = buildQuery(TEMPLATES[templateIndex], city);
      log(`[${nicho}] Buscando: ${query}`);

      const urls = await searchOnce(page, query);
      let added = 0;
      for (const url of urls) {
        try {
          const host = new URL(url).hostname.replace(/^www\./, '');
          if (!seenHosts.has(host)) {
            seenHosts.add(host);
            allURLs.push(url);
            added++;
          }
        } catch { /* skip */ }
      }
      log(`  → ${added} novas URLs (total: ${allURLs.length})`);

      templateIndex++;
      if (templateIndex >= TEMPLATES.length) {
        templateIndex = 0;
        cityIndex++;
      }
      // Salva estado por nicho para não misturar posições entre nichos diferentes
      const updatedState = loadState();
      updatedState[stateKey]  = cityIndex;
      updatedState[stateKey2] = templateIndex;
      saveState(updatedState);

      if (allURLs.length < targetCount) {
        await sleep(3000 + Math.random() * 2000);
      }
    }
  } finally {
    await browser.close();
  }

  return allURLs;
}

module.exports = { search, NICHE_TEMPLATES };
