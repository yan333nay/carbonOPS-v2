/**
 * Enriquecimento de leads sem telefone.
 * Tenta encontrar o telefone via:
 *   1. Links de Instagram/Facebook encontrados no site do lead
 *   2. Busca no DuckDuckGo: "nome empresa" telefone whatsapp
 */
const { log, logError } = require('./logger');

const PHONE_RE = /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)(?:9\s?)?\d{4}[-.\s]?\d{4}/g;

function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, '');
  const local = digits.startsWith('55') && digits.length > 11 ? digits.slice(2) : digits;
  if (local.length === 11) return `(${local.slice(0,2)}) ${local.slice(2,7)}-${local.slice(7)}`;
  if (local.length === 10) return `(${local.slice(0,2)}) ${local.slice(2,6)}-${local.slice(6)}`;
  return null;
}

function parsePhones(text) {
  const raw = text.match(PHONE_RE) || [];
  return [...new Set(raw)].map(p => normalizePhone(p)).filter(Boolean);
}

function parseWhatsAppsFromHtml(html) {
  const nums = [];
  let m;
  const re1 = /wa\.me\/(\d{10,13})/gi;
  while ((m = re1.exec(html)) !== null) nums.push(m[1]);
  const re2 = /[?&]phone=(\d{10,13})/gi;
  while ((m = re2.exec(html)) !== null) nums.push(m[1]);
  return [...new Set(nums)].map(n => normalizePhone(n)).filter(Boolean);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Extrai links de redes sociais do site (perfis, não posts)
async function extractSocialLinks(siteUrl, page) {
  try {
    await page.goto(siteUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const links = await page.$$eval('a[href]', els =>
      els.map(a => a.href).filter(h => h && (
        (h.includes('instagram.com/') && !h.includes('/p/') && !h.includes('/reel/') && !h.includes('/stories/')) ||
        (h.includes('facebook.com/') && !h.includes('/posts/') && !h.includes('/events/') && !h.includes('/photos/')) ||
        (h.includes('fb.com/') && !h.includes('/posts/'))
      ))
    ).catch(() => []);
    return [...new Set(links)];
  } catch {
    return [];
  }
}

// Extrai telefone de perfil Instagram (bio visível sem login)
async function phoneFromInstagram(profileUrl, page) {
  try {
    // Tenta versão mobile (menos restrições de bot)
    const mobileUrl = profileUrl.replace('instagram.com', 'instagram.com').replace(/\/$/, '');
    await page.goto(mobileUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await sleep(2000);

    const text = await page.evaluate(() => document.body.innerText).catch(() => '');
    const phones = parsePhones(text);
    if (phones.length > 0) return phones[0];

    // Tenta links wa.me que às vezes aparecem no link da bio
    const html = await page.content().catch(() => '');
    const wpp = parseWhatsAppsFromHtml(html);
    if (wpp.length > 0) return wpp[0];
  } catch { /* skip */ }
  return null;
}

// Extrai telefone de página do Facebook (About público)
async function phoneFromFacebook(profileUrl, page) {
  try {
    await page.goto(profileUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
    await sleep(2000);

    const text = await page.evaluate(() => document.body.innerText).catch(() => '');
    const phones = parsePhones(text);
    if (phones.length > 0) return phones[0];

    const html = await page.content().catch(() => '');
    const wpp = parseWhatsAppsFromHtml(html);
    if (wpp.length > 0) return wpp[0];
  } catch { /* skip */ }
  return null;
}

// Busca no DuckDuckGo: "nome empresa" telefone whatsapp
async function phoneFromDuckDuckGo(nome, page) {
  try {
    const query = `"${nome}" telefone whatsapp`;
    await page.goto('https://duckduckgo.com/', { waitUntil: 'domcontentloaded', timeout: 15000 });
    await sleep(800 + Math.random() * 400);
    await page.fill('input[name="q"]', query);
    await sleep(300 + Math.random() * 200);
    await page.keyboard.press('Enter');
    await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
    await sleep(1500);

    const text = await page.evaluate(() => document.body.innerText).catch(() => '');
    const phones = parsePhones(text);
    if (phones.length > 0) return phones[0];

    const html = await page.content().catch(() => '');
    const wpp = parseWhatsAppsFromHtml(html);
    if (wpp.length > 0) return wpp[0];
  } catch { /* skip */ }
  return null;
}

/**
 * Recebe lista de leads, tenta preencher telefone nos que estão faltando.
 * Usa o browser compartilhado (já aberto).
 */
async function enrichLeads(leads, browser) {
  const needsPhone = leads.filter(l => !l.whatsapp && !l.telefone);
  if (needsPhone.length === 0) {
    log('[enricher] Todos os leads já têm telefone.');
    return leads;
  }

  log(`\n[enricher] ${needsPhone.length} lead(s) sem telefone — buscando em redes sociais e DuckDuckGo...`);

  let enriched = 0;

  const ctx = await browser.newContext({
    userAgent: 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  });
  const page = await ctx.newPage();
  await page.route('**/*.{png,jpg,jpeg,gif,webp,svg,ico,woff,woff2,ttf,eot,mp4,mp3,pdf}', r => r.abort());

  try {
    for (const lead of needsPhone) {
      log(`[enricher] ${lead.nome} (${lead.siteUrl})`);

      // 1. Extrai links de redes sociais do site
      const socialLinks = lead.socialLinks || await extractSocialLinks(lead.siteUrl, page);
      let phone = null;

      // 2. Tenta Instagram
      const igLink = socialLinks.find(h =>
        h.includes('instagram.com/') && !h.includes('/p/') && !h.includes('/reel/')
      );
      if (igLink) {
        log(`  → Instagram: ${igLink}`);
        phone = await phoneFromInstagram(igLink, page);
        if (phone) log(`  Encontrado via Instagram: ${phone}`);
      }

      // 3. Tenta Facebook
      if (!phone) {
        const fbLink = socialLinks.find(h =>
          (h.includes('facebook.com/') || h.includes('fb.com/')) && !h.includes('/posts/')
        );
        if (fbLink) {
          log(`  → Facebook: ${fbLink}`);
          phone = await phoneFromFacebook(fbLink, page);
          if (phone) log(`  Encontrado via Facebook: ${phone}`);
        }
      }

      // 4. DuckDuckGo como último recurso
      if (!phone) {
        log(`  → Buscando no DuckDuckGo: "${lead.nome}" telefone whatsapp`);
        phone = await phoneFromDuckDuckGo(lead.nome, page);
        if (phone) log(`  Encontrado via DuckDuckGo: ${phone}`);
      }

      if (phone) {
        lead.telefone = phone;
        lead.whatsapp = phone;
        enriched++;
      } else {
        log(`  Telefone não encontrado`);
      }

      await sleep(1200 + Math.random() * 800);
    }
  } finally {
    await ctx.close();
  }

  log(`[enricher] ${enriched}/${needsPhone.length} telefone(s) encontrado(s) via enriquecimento`);
  return leads;
}

module.exports = { enrichLeads };
