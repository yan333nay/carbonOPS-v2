/**
 * generate-slides-html.js
 * Gera slides HTML usando o template oficial Carbon Films
 * (templates/carrossel-carbon-films.html).
 *
 * Saída: slides individuais 1080×1080 prontos para Instagram.
 *
 * Uso: node generate-slides-html.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT          = path.join(__dirname, '..');
const BRIEFING_PATH = path.join(ROOT, 'data',      'carousel-latest.json');
const TEMPLATE_PATH = path.join(ROOT, 'templates', 'carrossel-carbon-films.html');
const LOGO_PATH     = path.join(ROOT, 'assets',    'logo-carbon.png');
const OUTPUT_DIR    = path.join(ROOT, 'output',    'slides');

// ---------------------------------------------------------------
// Logo como base64 (funciona offline e no Playwright)
// ---------------------------------------------------------------
function getLogoDataUrl() {
  try {
    const buf = fs.readFileSync(LOGO_PATH);
    return `data:image/png;base64,${buf.toString('base64')}`;
  } catch {
    return '';
  }
}

// ---------------------------------------------------------------
// Extrai CSS do template
// ---------------------------------------------------------------
function getSharedCss(raw) {
  const m = raw.match(/<style>([\s\S]*?)<\/style>/);
  return m ? m[1] : '';
}

// ---------------------------------------------------------------
// Escapa HTML
// ---------------------------------------------------------------
function esc(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;');
}

// ---------------------------------------------------------------
// Substitui o texto dentro de um elemento pelo id
// ---------------------------------------------------------------
function replaceById(html, id, newContent) {
  const re = new RegExp(`(id="${id}"[^>]*>)[^<]*(<)`, 'g');
  return html.replace(re, `$1${newContent}$2`);
}

// ---------------------------------------------------------------
// Injeta imagem no placeholder do slide
// Remove a classe "placeholder" e substitui o <span> por <img>
// ---------------------------------------------------------------
function injectImage(html, n, imageUrl) {
  if (!imageUrl) return html;
  const wrapperId = `s${n}-img-wrap`;

  const imgTag = `<img src="${imageUrl}" alt="slide ${n}" style="width:100%;height:100%;object-fit:cover;display:block;">`;

  // Remove classe "placeholder" do wrapper
  html = html.replace(
    new RegExp(`(id="${wrapperId}"[^>]*?)\\s*placeholder`, 'g'),
    `$1`
  );

  // Substitui o conteúdo interno (span ou img existente) pelo novo img
  html = html.replace(
    new RegExp(`(id="${wrapperId}"[^>]*>)(?:<span[^>]*>[^<]*<\\/span>|<img[^>]*>)`),
    `$1${imgTag}`
  );

  return html;
}

// ---------------------------------------------------------------
// Extrai o bloco de um slide pelo id="slideN"
// ---------------------------------------------------------------
function extractSlideBlock(html, n) {
  return extractSlideBlockById(html, `slide${n}`);
}

// ---------------------------------------------------------------
// Extrai o bloco de um slide por id arbitrário
// ---------------------------------------------------------------
function extractSlideBlockById(html, id) {
  const marker = `id="${id}"`;
  const start = html.indexOf(marker);
  if (start === -1) return null;

  const divStart = html.lastIndexOf('<div', start);
  if (divStart === -1) return null;

  let depth = 0;
  let i = divStart;
  while (i < html.length) {
    if (html.slice(i, i + 4) === '<div') { depth++; i += 4; continue; }
    if (html.slice(i, i + 6) === '</div>') {
      depth--;
      i += 6;
      if (depth === 0) return html.slice(divStart, i);
      continue;
    }
    i++;
  }
  return null;
}

// ---------------------------------------------------------------
// CSS de override para Instagram Feed 1080×1350 (4:5)
// Fator de escala: 1080 / 390 = 2.769
// Altura resultante: 488 × 2.769 = 1351 ≈ 1350px — encaixe perfeito
// ---------------------------------------------------------------
function getInstagramCss(theme) {
  const isDark = theme !== 'white';
  const bg       = isDark ? '#000' : '#fff';
  const arrowBg  = isDark ? '#1a1a1a' : '#f0f0f0';
  const footerClr = isDark ? '#666' : '#aaa';

  return `
/* === RESET COMPLETO DO BODY DO TEMPLATE === */
html, body {
  width: 1080px !important;
  height: 1350px !important;
  min-height: 1350px !important;
  background: ${bg} !important;
  margin: 0 !important;
  padding: 0 !important;
  gap: 0 !important;
  display: block !important;
  overflow: hidden !important;
  align-items: unset !important;
  flex-direction: unset !important;
}

/* === INSTAGRAM FEED 1080×1350 — escala 2.769× === */
.slide {
  width: 1080px !important;
  min-height: 1350px !important;
  height: 1350px !important;
  padding: 89px 78px 50px !important;
  border-radius: 0 !important;
  background: ${bg} !important;
}
.slide-header {
  gap: 39px !important;
  margin-bottom: 78px !important;
}
.logo-circle {
  width: 144px !important;
  height: 144px !important;
  border-width: 5px !important;
  flex-shrink: 0 !important;
}
.brand-info {
  gap: 6px !important;
}
.brand-name {
  gap: 17px !important;
}
.brand-name span {
  font-size: 47px !important;
  letter-spacing: -0.6px !important;
}
.verified-badge {
  width: 50px !important;
  height: 50px !important;
}
.verified-badge svg {
  width: 28px !important;
  height: 28px !important;
}
.handle {
  font-size: 37px !important;
}
.slide--intro .slide-title {
  font-size: 68px !important;
  line-height: 1.25 !important;
  margin-bottom: 44px !important;
}
.slide--intro .slide-body {
  font-size: 40px !important;
  line-height: 1.6 !important;
  margin-bottom: 55px !important;
}
.slide--tip .slide-title {
  font-size: 61px !important;
  line-height: 1.25 !important;
  margin-bottom: 44px !important;
}
.slide--tip .slide-body {
  font-size: 40px !important;
  line-height: 1.6 !important;
  margin-bottom: 55px !important;
}
.slide-image {
  flex: 1 !important;
  min-height: 350px !important;
  max-height: 520px !important;
  border-radius: 8px !important;
}
.slide-image img {
  width: 100% !important;
  height: 100% !important;
  object-fit: cover !important;
  display: block !important;
}
.slide-footer {
  margin-top: 28px !important;
  gap: 22px !important;
  padding-bottom: 0 !important;
}
.arrow-circle {
  width: 66px !important;
  height: 66px !important;
  background: ${arrowBg} !important;
}
.arrow-circle svg {
  width: 30px !important;
  height: 30px !important;
}
.slide-footer span {
  font-size: 34px !important;
  color: ${footerClr} !important;
}
/* CTA slide — estilo antigo (logo + handle) */
.slide--cta:not(.slide--cta-new) {
  padding-top: 166px !important;
  justify-content: center !important;
  align-items: center !important;
  gap: 0 !important;
}
.logo-circle-big {
  width: 305px !important;
  height: 305px !important;
  margin-bottom: 61px !important;
  border-width: 5px !important;
}
.handle-big {
  gap: 22px !important;
  margin-bottom: 78px !important;
}
.handle-big span { font-size: 55px !important; }
.handle-big .verified-badge { width: 60px !important; height: 60px !important; }
.cta-box { padding: 50px 55px !important; margin-bottom: 55px !important; }
.cta-box p { font-size: 52px !important; line-height: 1.35 !important; }
.cta-sub { font-size: 38px !important; padding: 0 28px !important; line-height: 1.55 !important; }

/* CTA slide — novo estilo (lista + pill) */
.slide--cta-new {
  padding: 89px 78px 70px !important;
  justify-content: flex-start !important;
  align-items: flex-start !important;
  gap: 0 !important;
}
.cta-dots { margin-bottom: 55px !important; gap: 14px !important; }
.cta-dots span { width: 22px !important; height: 22px !important; border-radius: 6px !important; }
.cta-headline { font-size: 88px !important; line-height: 1.1 !important; margin-bottom: 50px !important; letter-spacing: -2px !important; }
.cta-card {
  padding: 44px !important;
  gap: 30px !important;
  margin-bottom: 40px !important;
  border-radius: 38px !important;
  width: 100% !important;
}
.cta-item { font-size: 36px !important; gap: 22px !important; line-height: 1.4 !important; }
.cta-arrow { font-size: 30px !important; margin-top: 4px !important; }
.cta-pill { padding: 30px 38px !important; border-radius: 28px !important; margin-top: 10px !important; gap: 6px !important; }
.cta-pill-title { font-size: 38px !important; }
.cta-pill-sub { font-size: 32px !important; }
.cta-bottom { margin-top: 0 !important; }
.cta-bottom p { font-size: 34px !important; line-height: 1.5 !important; }
.cta-icon { width: 77px !important; height: 77px !important; }
.cta-icon svg { width: 38px !important; height: 38px !important; }
.cta-face { width: 220px !important; height: 220px !important; bottom: -28px !important; left: -28px !important; opacity: 0.25 !important; }
`;
}

// Mantém compatibilidade: constante para uso sem tema explícito
const INSTAGRAM_CSS = getInstagramCss('dark');

// ---------------------------------------------------------------
// Gera HTML do slide individual para captura 1080×1350
// ---------------------------------------------------------------
function wrapSlide(slideBlock, templateCss, theme) {
  const instagramCss = getInstagramCss(theme || 'dark');
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
${templateCss}
${instagramCss}
</style>
</head>
<body>
${slideBlock}
</body>
</html>`;
}

// ---------------------------------------------------------------
// MAIN
// ---------------------------------------------------------------
function main() {
  if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  let briefing;
  try {
    briefing = JSON.parse(fs.readFileSync(BRIEFING_PATH, 'utf8'));
  } catch {
    console.error('Erro: data/carousel-latest.json nao encontrado.');
    process.exit(1);
  }

  let template;
  try {
    template = fs.readFileSync(TEMPLATE_PATH, 'utf8');
  } catch {
    console.error('Erro: templates/carrossel-carbon-films.html nao encontrado.');
    process.exit(1);
  }

  // Tema: 'dark' (padrão) ou 'white'
  const theme = briefing.theme === 'white' ? 'white' : 'dark';

  // Prefixo de IDs conforme tema: dark usa s1/s2..., white usa ws1/ws2...
  const idPrefix = theme === 'white' ? 'ws' : 's';

  // Prefere 'copy' (hook+body textuais) sobre 'slides' (specs de layout)
  const rawSlides = briefing.copy || briefing.slides || [];

  // Mapeia N slides → 5 posições do template (s1-s4 = conteúdo, s5 = CTA)
  let slides;
  if (rawSlides.length <= 5) {
    slides = rawSlides;
  } else {
    slides = [...rawSlides.slice(0, 4), rawSlides[rawSlides.length - 1]];
  }

  // Mapa de imagens por número de slide (de briefing.assets)
  const photoMap = {};
  (briefing.assets || []).forEach(a => {
    const num = a.slide || a.slide_number;
    if (num && (a.photo_url || a.asset_url)) {
      photoMap[num] = a.photo_url || a.asset_url;
    }
  });

  console.log(`Template: carrossel-carbon-films.html`);
  console.log(`Tema:     ${theme}`);
  console.log(`Slides:   ${slides.length} de ${rawSlides.length}`);
  console.log(`Imagens:  ${Object.keys(photoMap).length} mapeadas`);

  // Injeta logo
  const logoDataUrl = getLogoDataUrl();
  let filled = template.replace(/LOGO_PLACEHOLDER/g, logoDataUrl);

  // Slides 1-4: título + corpo + imagem
  for (let i = 0; i < Math.min(slides.length, 4); i++) {
    const n    = i + 1;
    const s    = slides[i];

    filled = replaceById(filled, `${idPrefix}${n}-title`, esc(s.hook  || s.title || ''));
    filled = replaceById(filled, `${idPrefix}${n}-body`,  esc(s.body  || s.text  || ''));

    // Imagem: tenta no slide, depois no photoMap (por posição ou slide_number)
    const imgUrl = s.image_url || s.photo_url || photoMap[n] || photoMap[s.slide] || null;
    if (imgUrl) {
      // Para white theme, o wrapper tem id="ws{n}-img-wrap"
      const wrapperId = `${idPrefix}${n}-img-wrap`;
      const imgTag = `<img src="${imgUrl}" alt="slide ${n}" style="width:100%;height:100%;object-fit:cover;display:block;">`;
      filled = filled.replace(
        new RegExp(`(id="${wrapperId}"[^>]*?)\\s*placeholder`, 'g'),
        '$1'
      );
      filled = filled.replace(
        new RegExp(`(id="${wrapperId}"[^>]*>)(?:<span[^>]*>[^<]*<\\/span>|<img[^>]*>)`),
        `$1${imgTag}`
      );
      console.log(`  Imagem slide ${n}: OK`);
    }
  }

  // Slide 5 (CTA)
  const cta = slides[4];
  if (cta) {
    filled = replaceById(filled, `${idPrefix}5-cta`, esc(cta.hook || cta.cta || ''));
    filled = replaceById(filled, `${idPrefix}5-sub`, esc(cta.body || cta.sub || ''));
  }

  // Remove editor inline
  filled = filled.replace(/<div class="editor-section">[\s\S]*?<\/div>\s*<\/body>/, '</body>');

  // Salva carousel completo (preview no browser)
  const carouselPath = path.join(OUTPUT_DIR, 'carousel.html');
  fs.writeFileSync(carouselPath, filled, 'utf8');
  console.log(`\nCarousel completo → output/slides/carousel.html`);

  // CSS do template (sem overrides Instagram — só para o carousel.html)
  const templateCss = getSharedCss(template);

  // Salva slides individuais 1080×1350
  const htmlFiles = [];

  for (let n = 1; n <= Math.min(slides.length, 5); n++) {
    // White: extrai pelo id "ws{n}"; dark: extrai pelo id "slide{n}"
    const slideId = theme === 'white' ? `ws${n}` : n;
    const block = theme === 'white'
      ? extractSlideBlockById(filled, `ws${n}`)
      : extractSlideBlock(filled, n);

    if (!block) {
      console.warn(`  Aviso: slide ${n} nao encontrado no template (tema: ${theme})`);
      continue;
    }
    const slideHtml = wrapSlide(block, templateCss, theme);
    const outPath   = path.join(OUTPUT_DIR, `slide-${n}.html`);
    fs.writeFileSync(outPath, slideHtml, 'utf8');
    htmlFiles.push(outPath);
    console.log(`  Slide ${n} → 1080×1350 OK`);
  }

  // index.json
  const index = {
    files: htmlFiles,
    carousel: carouselPath,
    total: htmlFiles.length,
    format: 'feed',
    theme,
    template: 'carrossel-carbon-films',
    generated_at: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.json'), JSON.stringify(index, null, 2));

  console.log(`\n${htmlFiles.length} slides prontos → output/slides/`);
  console.log('Proximo passo: node scripts/capture-slides.js');
}

main();
