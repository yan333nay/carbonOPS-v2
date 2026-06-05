/**
 * Raspador de sites de imobiliárias.
 * Extrai do footer: nome, email, telefone, serviços.
 * Reutiliza um único browser para todos os sites (mais rápido).
 */
const { chromium } = require('playwright');
const { log, logError } = require('./logger');

const EMAIL_RE = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const PHONE_RE = /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)(?:9\s?)?\d{4}[-.\s]?\d{4}/g;

// Número celular brasileiro: DDD(2) + 9(prefixo) + 8 dígitos = 11 dígitos locais
function isMobilePhone(phone) {
  const d = phone.replace(/\D/g, '');
  const local = d.startsWith('55') && d.length > 11 ? d.slice(2) : d;
  return local.length === 11 && local[2] === '9';
}

const FOOTER_SELECTORS = [
  'footer', '#footer', '.footer', '.rodape', '#rodape',
  '[class*="footer"]', '[class*="rodape"]', '.site-footer', '#site-footer',
];

// Serviços que a Carbon Films pode oferecer, por nicho
const NICHE_SERVICES = {
  imobiliarias: [
    ['Landing page de alta conversão', /\b(landing|conversao|leads|captac|formulario|anuncio)/i],
    ['Vídeo cinematográfico de imóveis', /\b(lux[ou]|alto padr[aã]o|premium|exclusiv|lancamento)/i],
    ['Fotos profissionais de imóveis', /\b(foto|imagem|galeria|tour|virtual|3[Dd])/i],
    ['Reels e Stories para Instagram', /\b(instagram|redes sociais|social media)/i],
    ['Vídeo institucional', /\b(institucional|empresa|equipe|sobre n[oó]s)/i],
    ['Carrosséis de marketing digital', /\b(marketing|digital|online|anuncio)/i],
  ],
  restaurantes: [
    ['Vídeo institucional e cardápio', /\b(cardapio|menu|prato|culinaria|chef|receita)/i],
    ['Fotos profissionais de pratos', /\b(foto|imagem|gastronomia|prato|especialidade)/i],
    ['Reels de bastidores e novidades', /\b(instagram|stories|reels|redes|tiktok)/i],
    ['Campanha de lançamento', /\b(lancamento|abertura|inaugura|novidade)/i],
    ['Conteúdo para redes sociais', /\b(marketing|digital|online|delivery|reserva)/i],
  ],
  academias: [
    ['Vídeo institucional e tour da academia', /\b(tour|espaco|estrutura|instalac|equipa)/i],
    ['Reels motivacionais de treinos', /\b(treino|musculacao|aula|personal|exercicio)/i],
    ['Fotos profissionais do espaço', /\b(foto|imagem|ambiente|infraestrutura)/i],
    ['Campanha de matrícula', /\b(matricula|inscricao|plano|mensalidade|oferta)/i],
    ['Conteúdo para redes sociais', /\b(instagram|redes|marketing|digital|motivac)/i],
  ],
  clinicas: [
    ['Vídeo institucional da clínica', /\b(clinica|consultorio|saude|tratamento|especialidad)/i],
    ['Fotos profissionais do espaço e equipe', /\b(foto|equipe|medico|especialista|doutora?)/i],
    ['Depoimentos e cases de sucesso', /\b(depoimento|resultado|antes|depois|caso|transforma)/i],
    ['Reels educativos e informativos', /\b(dica|saude|cuidado|prevencao|estetica)/i],
    ['Conteúdo para redes sociais', /\b(instagram|redes|marketing|digital|agendamento)/i],
  ],
  saloes: [
    ['Fotos de transformações e serviços', /\b(cabelo|unha|estetica|beleza|coloracao|corte)/i],
    ['Reels de before and after', /\b(antes|depois|transforma|resultado|look)/i],
    ['Vídeo institucional do salão', /\b(salao|barbearia|espaco|ambiente|studio)/i],
    ['Campanha de atração de clientes', /\b(agendamento|reserva|promo|desconto|oferta)/i],
    ['Conteúdo para redes sociais', /\b(instagram|redes|marketing|digital|tiktok)/i],
  ],
  escritorios: [
    ['Vídeo institucional profissional', /\b(escritorio|empresa|equipe|servico|corporat)/i],
    ['Fotos profissionais do espaço e equipe', /\b(foto|equipe|profissional|executivo|socio)/i],
    ['Conteúdo para LinkedIn e redes sociais', /\b(linkedin|instagram|redes|marketing|digital)/i],
    ['Cases de sucesso em vídeo', /\b(case|resultado|cliente|projeto|portfolio)/i],
    ['Campanha de posicionamento de marca', /\b(marca|brand|posicionamento|diferencial|reputac)/i],
  ],
};

const NICHE_DEFAULTS = {
  imobiliarias: 'Landing page de alta conversão, Vídeo cinematográfico de imóveis, Reels e Stories para Instagram',
  restaurantes: 'Vídeo institucional e cardápio, Fotos profissionais de pratos, Reels de bastidores e novidades',
  academias: 'Vídeo institucional e tour da academia, Reels motivacionais de treinos, Conteúdo para redes sociais',
  clinicas: 'Vídeo institucional da clínica, Fotos profissionais do espaço e equipe, Conteúdo para redes sociais',
  saloes: 'Fotos de transformações e serviços, Reels de before and after, Conteúdo para redes sociais',
  escritorios: 'Vídeo institucional profissional, Fotos profissionais do espaço e equipe, Conteúdo para LinkedIn e redes sociais',
};

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
  // wa.me/55XXXXXXXXXX
  const re1 = /wa\.me\/(\d{10,13})/gi;
  while ((m = re1.exec(html)) !== null) nums.push(m[1]);
  // api.whatsapp.com/send?phone= ou ?l=&phone=
  const re2 = /[?&]phone=(\d{10,13})/gi;
  while ((m = re2.exec(html)) !== null) nums.push(m[1]);
  // whatsapp://send?phone=
  const re3 = /whatsapp:\/\/send[^"'<]{0,50}?phone=(\d{10,13})/gi;
  while ((m = re3.exec(html)) !== null) nums.push(m[1]);
  return [...new Set(nums)].map(n => normalizePhone(n)).filter(Boolean);
}

function parseServices(text, nicho = 'imobiliarias') {
  const services = NICHE_SERVICES[nicho] || NICHE_SERVICES.imobiliarias;
  const matched = services
    .filter(([, re]) => re.test(text))
    .map(([label]) => label);
  if (matched.length === 0) {
    return NICHE_DEFAULTS[nicho] || NICHE_DEFAULTS.imobiliarias;
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

// Exporta função que aceita browser já aberto (para reuso) e nicho para serviços específicos
async function scrapeWebsite(url, sharedBrowser, nicho = 'imobiliarias') {
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

    // Detecção DOM de botões/links WhatsApp (captura widgets flutuantes e ícones)
    const wppHrefs = await page.$$eval(
      'a[href*="wa.me"], a[href*="whatsapp.com"], a[href*="whatsapp://"]',
      els => els.map(a => a.href)
    ).catch(() => []);
    for (const href of wppHrefs) {
      const dm = href.match(/(\d{10,13})/);
      if (dm) {
        const n = normalizePhone(dm[1]);
        if (n && !whatsapps.includes(n)) whatsapps.push(n);
      }
    }

    // Tenta página de contato se sem dados ou sem WhatsApp
    if (emails.length === 0 && phones.length === 0 || whatsapps.length === 0) {
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
            if (whatsapps.length === 0) {
              whatsapps = parseWhatsApps(ch);
              // DOM também na página de contato
              const cHrefs = await page.$$eval(
                'a[href*="wa.me"], a[href*="whatsapp.com"], a[href*="whatsapp://"]',
                els => els.map(a => a.href)
              ).catch(() => []);
              for (const href of cHrefs) {
                const dm = href.match(/(\d{10,13})/);
                if (dm) {
                  const n = normalizePhone(dm[1]);
                  if (n && !whatsapps.includes(n)) whatsapps.push(n);
                }
              }
            }
          } catch { /* skip */ }
        }
      } catch { /* skip */ }
    }

    // Extrai links de perfis de redes sociais (Instagram, Facebook) — usados pelo enricher
    const socialLinks = await page.$$eval('a[href]', els =>
      els.map(a => a.href).filter(h => h && (
        (h.includes('instagram.com/') && !h.includes('/p/') && !h.includes('/reel/') && !h.includes('/stories/')) ||
        (h.includes('facebook.com/') && !h.includes('/posts/') && !h.includes('/events/') && !h.includes('/photos/')) ||
        (h.includes('fb.com/') && !h.includes('/posts/'))
      ))
    ).catch(() => []);

    await ctx.close();

    const nome = parseName(url, title);
    if (!nome) return null;

    // whatsapp: prioriza link wa.me, depois celular (9 dígitos), senão vazio
    const mobilePhones = phones.filter(isMobilePhone);
    const whatsapp = whatsapps[0] || mobilePhones[0] || '';
    // telefone mantém o melhor número disponível para exibição
    const telefone = whatsapps[0] || phones[0] || '';

    // Aceita lead mesmo sem contato direto se tiver email, telefone ou links sociais
    const hasContact = emails.length > 0 || telefone || whatsapp || socialLinks.length > 0;
    if (!hasContact) return null;

    return {
      nome: nome.substring(0, 100),
      email: emails[0] || '',
      telefone,
      whatsapp,
      siteUrl: url,
      servicos: parseServices(fullText, nicho),
      socialLinks: [...new Set(socialLinks)].slice(0, 5),
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
