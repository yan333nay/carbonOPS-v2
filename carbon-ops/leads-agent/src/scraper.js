/**
 * Raspador de sites de imobiliárias.
 * Extrai do footer: nome, email, telefone, serviços.
 * Reutiliza um único browser para todos os sites (mais rápido).
 */
const { chromium } = require('playwright');
const { log, logError } = require('./logger');

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)(?:9\s?)?\d{4}[-.\s]?\d{4}/g;

const FOOTER_SELECTORS = [
  'footer', '#footer', '.footer', '.rodape', '#rodape',
  '[class*="footer"]', '[class*="rodape"]', '.site-footer', '#site-footer',
];

// Serviços que a Carbon Films pode oferecer PARA imobiliárias
// Selecionados com base no perfil detectado no site do lead
const CARBON_SERVICES = [
  ['Vídeo cinematográfico de imóveis', /\b(lux[ou]|alto padrão|alto\s+padr[aã]o|premium|exclusiv)/i],
  ['Campanha de lançamento cinematográfica', /\blan[çc]amento/i],
  ['Reels e Stories para Instagram', /\b(instagram|redes sociais|social media)\b/i],
  ['Fotos profissionais de imóveis', /\b(foto|imagem|galer[ií]a)\b/i],
  ['Vídeo institucional', /\b(institucional|empresa|equipe|sobre n[oó]s)\b/i],
  ['Carrosséis de marketing digital', /\b(marketing|digital|online)\b/i],
  ['Tour virtual cinematográfico', /\b(tour|virtual|3[Dd]|visita)\b/i],
  ['Conteúdo para redes sociais', /\b(temporada|ferias|verão|inverno)\b/i],
];

const JUNK_EMAILS = ['example.com', 'seudominio', '@email.com', 'seuemail', 'dominio'];

function parseEmails(text) {
  const raw = text.match(EMAIL_RE) || [];
  return [...new Set(raw)].filter(e =>
    !JUNK_EMAILS.some(j => e.toLowerCase().includes(j)) && e.length < 80
  );
}

function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, '');
  // Remove DDI 55
  const local = digits.startsWith('55') && digits.length > 11 ? digits.slice(2) : digits;
  if (local.length === 11) return `(${local.slice(0,2)}) ${local.slice(2,7)}-${local.slice(7)}`;
  if (local.length === 10) return `(${local.slice(0,2)}) ${local.slice(2,6)}-${local.slice(6)}`;
  return null;
}

function parsePhones(text) {
  const raw = text.match(PHONE_RE) || [];
  return [...new Set(raw)]
    .map(p => normalizePhone(p))
    .filter(Boolean);
}

function parseWhatsApps(html) {
  const nums = [];
  let m;
  const re = /(?:wa\.me\/|phone=)(\d{10,13})/gi;
  while ((m = re.exec(html)) !== null) nums.push(m[1]);
  return [...new Set(nums)].map(n => normalizePhone(n)).filter(Boolean);
}

function parseServices(text) {
  const matched = CARBON_SERVICES
    .filter(([, re]) => re.test(text))
    .map(([label]) => label);

  if (matched.length === 0) {
    return 'Vídeo cinematográfico de imóveis, Reels e Stories para Instagram, Fotos profissionais de imóveis';
  }
  return matched.slice(0, 4).join(', ');
}

const JUNK_TITLE_PATTERNS = [
  /^contato$/i,
  /^(fale|entre em contato)/i,
  /casas e apartamentos/i,
  /compra.*venda.*aluguel/i,
  /venda.*aluguel/i,
  /aluguel.*venda/i,
  /imóveis\s+(para|em)\b/i,
  /imoveis\s+(para|em)\b/i,
  /^(home|início|index|sobre|página|pagina|principal|bem-vindo)/i,
  /\b(comprar|alugar|vender)\s+imóveis\b/i,
];

function domainFallbackName(url) {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    const base = host.split('.')[0]
      .replace(/-/g, ' ')
      .replace(/imoveis|imobiliaria|imob/gi, '')
      .trim();
    return base.length > 2 ? base : null;
  } catch { return null; }
}

function parseName(url, title) {
  if (title) {
    const cleaned = title
      .replace(/\s*[-|–|»|·|—].*/, '')
      .replace(/\s+/g, ' ')
      .trim();

    const isJunk = cleaned.length <= 2
      || cleaned.length >= 70
      || JUNK_TITLE_PATTERNS.some(re => re.test(cleaned));

    if (!isJunk) return cleaned;
  }
  return domainFallbackName(url);
}

// Padrões que confirmam venda de imóveis
const VENDA_SIGNALS = [
  /\bimóveis\s+à\s+venda\b/i, /\bcomprar\s+im[oó]vel\b/i,
  /\bà\s+venda\b/i, /\bvenda\s+de\s+im[oó]veis\b/i,
  /\bcasas\s+à\s+venda\b/i, /\bapartamentos\s+à\s+venda\b/i,
  /\bcompre\s+seu\s+im[oó]vel\b/i, /\bver\s+im[oó]veis\b/i,
  /\blançamentos\b/i, /\bCRECI\b/,
];

// Padrões que indicam assessoria/consultoria (não é imobiliária de venda direta)
const ASSESSORIA_SIGNALS = [
  /\bassessoria\s+imobili[aá]ria\b/i, /\bconsultoria\s+imobili[aá]ria\b/i,
  /\bassessoria\s+de\s+investimento\b/i, /\bgestão\s+de\s+patrimônio\b/i,
  /\bplanejamento\s+financeiro\b/i,
];

function isImobiliaria(text, url) {
  // Se o domínio contém "assessoria" ou "consultoria", rejeita
  try {
    const host = new URL(url).hostname;
    if (/assessoria|consultoria/i.test(host)) return false;
  } catch { /* skip */ }

  // Se o texto tem fortes sinais de assessoria sem sinais de venda, rejeita
  const hasAssessoriaSignal = ASSESSORIA_SIGNALS.some(re => re.test(text));
  const hasVendaSignal = VENDA_SIGNALS.some(re => re.test(text));

  if (hasAssessoriaSignal && !hasVendaSignal) return false;
  return true;
}

async function getFooterText(page) {
  let best = '';
  for (const sel of FOOTER_SELECTORS) {
    try {
      const t = await page.locator(sel).first().innerText({ timeout: 2500 }).catch(() => '');
      if (t.length > best.length) best = t;
    } catch { /* skip */ }
  }
  return best;
}

// Exporta função que aceita browser já aberto (para reuso)
async function scrapeWebsite(url, sharedBrowser) {
  const browser = sharedBrowser || await chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const ownBrowser = !sharedBrowser;

  try {
    const ctx = await browser.newContext({
      userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      locale: 'pt-BR',
      timezoneId: 'America/Sao_Paulo',
    });

    const page = await ctx.newPage();
    await page.route('**/*.{png,jpg,jpeg,gif,webp,svg,ico,woff,woff2,ttf,eot,mp4,mp3,pdf}', r => r.abort());

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    } catch {
      await ctx.close();
      return null;
    }

    const title = await page.title().catch(() => '');
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)).catch(() => {});
    await page.waitForTimeout(600);

    const footerText = await getFooterText(page);
    const fullText = await page.evaluate(() => document.body.innerText).catch(() => '');
    const html = await page.content().catch(() => '');

    const analysisText = (footerText.length > 80 ? footerText + '\n' : '') + fullText;

    let emails = parseEmails(analysisText);
    let phones = parsePhones(analysisText);
    let whatsapps = parseWhatsApps(html);

    // Tenta página de contato se sem dados
    if (emails.length === 0 && phones.length === 0) {
      try {
        const contactLinks = await page.$$eval('a', els =>
          els
            .filter(a => /(contato|contact|fale|sobre)/i.test((a.href || '') + (a.textContent || '')))
            .map(a => a.href)
            .filter(h => h.startsWith('http'))
            .slice(0, 2)
        );
        for (const link of contactLinks) {
          try {
            await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 12000 });
            const ct = await page.evaluate(() => document.body.innerText).catch(() => '');
            const ch = await page.content().catch(() => '');
            if (emails.length === 0) emails = parseEmails(ct);
            if (phones.length === 0) phones = parsePhones(ct);
            if (whatsapps.length === 0) whatsapps = parseWhatsApps(ch);
          } catch { /* skip */ }
        }
      } catch { /* skip */ }
    }

    await ctx.close();

    if (emails.length === 0 && phones.length === 0 && whatsapps.length === 0) return null;

    // Rejeita assessorias e sites sem foco em venda de imóveis
    if (!isImobiliaria(fullText, url)) return null;

    const nome = parseName(url, title);
    if (!nome) return null;

    // Prioriza WhatsApp; phones já estão normalizados, whatsapps também
    const telefone = whatsapps[0] || phones[0] || '';

    return {
      nome: nome.substring(0, 100),
      email: emails[0] || '',
      telefone,
      siteUrl: url,
      servicos: parseServices(fullText),
    };

  } finally {
    if (ownBrowser) await browser.close();
  }
}

async function createBrowser() {
  return chromium.launch({
    headless: true,
    executablePath: process.env.PLAYWRIGHT_EXECUTABLE,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });
}

module.exports = { scrapeWebsite, createBrowser };
