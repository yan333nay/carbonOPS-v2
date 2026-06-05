#!/usr/bin/env node
'use strict';

/**
 * story-demo.js
 * Gera um carrossel de storytelling editorial para demonstração.
 * Design completamente diferente: narrativa por capítulos, sem labels corporativas.
 * Não posta — só gera e captura para preview.
 *
 * Uso: node scripts/story-demo.js
 */

const fs    = require('fs');
const path  = require('path');
const https = require('https');

const ROOT      = path.join(__dirname, '..');
const OUT       = path.join(ROOT, 'output', 'slides');
const LOGO_PATH = path.join(ROOT, 'assets', 'logo-carbon.png');
const ENV_PATH  = path.join(ROOT, '.env');

function loadEnv() {
  try {
    const lines = fs.readFileSync(ENV_PATH, 'utf8').split('\n');
    for (const line of lines) {
      const m = line.match(/^([A-Z_]+)=(.+)$/);
      if (m) process.env[m[1]] = m[2].trim();
    }
  } catch {}
}

function getLogoBase64() {
  try {
    return `data:image/png;base64,${fs.readFileSync(LOGO_PATH).toString('base64')}`;
  } catch { return ''; }
}

function fetchUnsplash(query) {
  return new Promise((resolve) => {
    const key = process.env.UNSPLASH_ACCESS_KEY;
    if (!key) { resolve(''); return; }
    const q   = encodeURIComponent(query);
    const url = `https://api.unsplash.com/photos/random?query=${q}&orientation=portrait&w=1080&h=1350&client_id=${key}`;
    https.get(url, { headers: { 'Accept-Version': 'v1' } }, (res) => {
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve(JSON.parse(data).urls?.regular || ''); }
        catch { resolve(''); }
      });
    }).on('error', () => resolve(''));
  });
}

const GRAIN = `data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E`;

// Fontes carregadas via Google Fonts — aguardar document.fonts.ready no Playwright
function head(extraCss = '') {
  return `<meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Montserrat:ital,wght@0,300;0,400;0,700;1,300&family=JetBrains+Mono:wght@400;500&family=Playfair+Display:ital@1&display=swap" rel="stylesheet">
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { width: 1080px; height: 1350px; overflow: hidden; background: #050505; }
.slide {
  width: 1080px; height: 1350px; position: relative;
  display: flex; flex-direction: column; justify-content: space-between; overflow: hidden;
}
.bg { position: absolute; inset: 0; background-size: cover; background-position: center; z-index: 0; }
.overlay { position: absolute; inset: 0; z-index: 1; }
.grain {
  position: absolute; inset: 0; z-index: 3; pointer-events: none; opacity: 0.04;
  background-image: url("${GRAIN}"); background-size: 200px 200px;
}
.topo {
  position: relative; z-index: 4; padding: 60px 72px 0;
  display: flex; align-items: center; justify-content: space-between;
}
.marca { display: flex; align-items: center; gap: 18px; }
.logo-circle {
  width: 80px; height: 80px; border-radius: 50%;
  border: 1.5px solid rgba(255,255,255,0.18);
  overflow: hidden; background: #111; flex-shrink: 0;
}
.logo-circle img { width: 100%; height: 100%; object-fit: cover; display: block; }
.marca-nome {
  font-family: 'Montserrat', sans-serif; font-weight: 700;
  font-size: 34px; color: #fff; letter-spacing: -0.3px;
}
.marca-handle { font-family: 'JetBrains Mono', monospace; font-size: 22px; color: rgba(255,255,255,0.40); }
.num-slide { font-family: 'JetBrains Mono', monospace; font-size: 22px; color: rgba(255,255,255,0.30); letter-spacing: 0.08em; }
.corpo-slide {
  position: relative; z-index: 4; padding: 0 72px;
  flex: 1; display: flex; flex-direction: column; justify-content: flex-end; padding-bottom: 120px;
}
.capitulo {
  font-family: 'JetBrains Mono', monospace; font-size: 22px;
  color: rgba(255,255,255,0.35); letter-spacing: 0.18em; text-transform: uppercase;
  margin-bottom: 28px; display: block;
}
.titulo {
  font-family: 'Anton', sans-serif; font-size: 88px; color: #fff;
  line-height: 0.98; letter-spacing: -1px; text-transform: uppercase; margin-bottom: 44px;
}
.texto {
  font-family: 'Montserrat', sans-serif; font-size: 37px;
  color: rgba(255,255,255,0.65); line-height: 1.6; font-weight: 300; max-width: 900px;
}
.texto + .texto { margin-top: 24px; }
.rodape {
  position: relative; z-index: 4; padding: 0 72px 56px;
  display: flex; align-items: center; justify-content: space-between;
}
.seta-btn {
  width: 64px; height: 64px; background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12); border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
}
.seta-btn svg { width: 26px; height: 26px; }
.hint-txt { font-family: 'Montserrat', sans-serif; font-size: 24px; color: rgba(255,255,255,0.30); font-weight: 300; margin-left: 16px; }
.continua { font-family: 'JetBrains Mono', monospace; font-size: 20px; color: rgba(255,255,255,0.20); }
${extraCss}
</style>`;
}

function marcaHtml(logo, num) {
  return `
  <div class="topo">
    <div class="marca">
      <div class="logo-circle"><img src="${logo}" alt=""></div>
      <div>
        <div class="marca-nome">Carbon Films</div>
        <div class="marca-handle">@carbonfilms.sc</div>
      </div>
    </div>
    <span class="num-slide">${num}</span>
  </div>`;
}

// ── SLIDE 1 — HOOK ────────────────────────────────────────────
function slide1(logo, img) {
  return `<!DOCTYPE html><html lang="pt-BR"><head>${head()}</head><body>
<div class="slide">
  <div class="bg" style="background-image:url('${img}')"></div>
  <div class="overlay" style="background:linear-gradient(to bottom,rgba(5,5,5,0.55) 0%,rgba(5,5,5,0.15) 30%,rgba(5,5,5,0.72) 60%,rgba(5,5,5,0.98) 100%)"></div>
  <div class="grain"></div>
  ${marcaHtml(logo, '01 / 07')}
  <div class="corpo-slide" style="padding-bottom:130px;">
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:36px;">
      <div style="width:56px;height:2px;background:rgba(255,255,255,0.45);"></div>
      <span style="font-family:'JetBrains Mono',monospace;font-size:22px;color:rgba(255,255,255,0.50);letter-spacing:0.14em;text-transform:uppercase;">História real</span>
    </div>
    <h1 style="font-family:'Anton',sans-serif;font-size:112px;color:#fff;line-height:0.95;letter-spacing:-2px;text-transform:uppercase;margin-bottom:40px;">
      ELE VENDEU<br>O CARRO<br>PARA PAGAR<br>AS CONTAS.
    </h1>
    <p style="font-family:'Montserrat',sans-serif;font-size:38px;color:rgba(255,255,255,0.60);line-height:1.5;font-weight:300;max-width:820px;">
      Seis meses depois, faturava R$80 mil por mês. O que mudou foi uma única decisão.
    </p>
  </div>
  <div class="rodape">
    <div style="display:flex;align-items:center;">
      <div class="seta-btn">
        <svg viewBox="0 0 26 26" fill="none"><path d="M5 13h16M14 7l6 6-6 6" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </div>
      <span class="hint-txt">arrasta para continuar</span>
    </div>
  </div>
</div>
</body></html>`;
}

// ── SLIDE 2 — CONTEXTO ────────────────────────────────────────
function slide2(logo, img) {
  return `<!DOCTYPE html><html lang="pt-BR"><head>${head()}</head><body>
<div class="slide">
  <div class="bg" style="background-image:url('${img}')"></div>
  <div class="overlay" style="background:linear-gradient(to bottom,rgba(5,5,5,0.70) 0%,rgba(5,5,5,0.30) 40%,rgba(5,5,5,0.88) 70%,rgba(5,5,5,1.0) 100%)"></div>
  <div class="grain"></div>
  ${marcaHtml(logo, '02 / 07')}
  <div class="corpo-slide">
    <span class="capitulo">O contexto</span>
    <h2 class="titulo">PRODUTO BOM.<br>ZERO CLIENTES<br>NOVOS.</h2>
    <p class="texto">Marcos tinha uma pequena empresa de construção em Joinville. Quatro anos no mercado, clientes antigos fiéis, trabalho impecável.</p>
    <p class="texto">Mas nenhum cliente novo chegava. O problema não era qualidade. Era visibilidade.</p>
  </div>
  <div class="rodape">
    <div style="width:40px;height:2px;background:rgba(255,255,255,0.15);"></div>
    <span class="continua">continua</span>
  </div>
</div>
</body></html>`;
}

// ── SLIDE 3 — A CRISE ─────────────────────────────────────────
function slide3(logo, img) {
  return `<!DOCTYPE html><html lang="pt-BR"><head>${head()}</head><body>
<div class="slide">
  <div class="bg" style="background-image:url('${img}')"></div>
  <div class="overlay" style="background:linear-gradient(to bottom,rgba(5,5,5,0.80) 0%,rgba(5,5,5,0.45) 35%,rgba(5,5,5,0.88) 65%,rgba(5,5,5,1.0) 100%)"></div>
  <div class="grain"></div>
  ${marcaHtml(logo, '03 / 07')}
  <div class="corpo-slide">
    <span class="capitulo">A crise</span>
    <h2 class="titulo">O MÊS EM QUE<br>NÃO PAGOU<br>O ALUGUEL.</h2>
    <p class="texto">Fevereiro de 2023. Três obras em andamento, mas dois clientes atrasaram pagamento. Ele vendeu o carro para cobrir os custos e continuou funcionando.</p>
    <p class="texto">Foi nesse momento que ele fez a pergunta certa: <em style="font-style:italic;color:rgba(255,255,255,0.88);">por que ninguém me acha?</em></p>
  </div>
  <div class="rodape">
    <div style="width:40px;height:2px;background:rgba(255,255,255,0.15);"></div>
    <span class="continua">continua</span>
  </div>
</div>
</body></html>`;
}

// ── SLIDE 4 — A DECISÃO ───────────────────────────────────────
function slide4(logo, img) {
  return `<!DOCTYPE html><html lang="pt-BR"><head>${head()}</head><body>
<div class="slide">
  <div class="bg" style="background-image:url('${img}')"></div>
  <div class="overlay" style="background:linear-gradient(to bottom,rgba(5,5,5,0.65) 0%,rgba(5,5,5,0.20) 35%,rgba(5,5,5,0.82) 65%,rgba(5,5,5,1.0) 100%)"></div>
  <div class="grain"></div>
  ${marcaHtml(logo, '04 / 07')}
  <div class="corpo-slide">
    <span class="capitulo">A decisão</span>
    <h2 class="titulo">ELE PAROU<br>DE DEPENDER<br>DE INDICAÇÃO.</h2>
    <p class="texto">Investiu em identidade visual e produção de conteúdo. Documentou o processo das obras. Mostrou o antes e depois. Contou a história por trás de cada projeto.</p>
    <p class="texto">Pela primeira vez, clientes chegaram sem ele pedir.</p>
  </div>
  <div class="rodape">
    <div style="width:40px;height:2px;background:rgba(255,255,255,0.15);"></div>
    <span class="continua">continua</span>
  </div>
</div>
</body></html>`;
}

// ── SLIDE 5 — O RESULTADO ─────────────────────────────────────
function slide5(logo, img) {
  return `<!DOCTYPE html><html lang="pt-BR"><head>${head()}</head><body>
<div class="slide">
  <div class="bg" style="background-image:url('${img}')"></div>
  <div class="overlay" style="background:linear-gradient(to bottom,rgba(5,5,5,0.70) 0%,rgba(5,5,5,0.25) 35%,rgba(5,5,5,0.82) 60%,rgba(5,5,5,1.0) 100%)"></div>
  <div class="grain"></div>
  ${marcaHtml(logo, '05 / 07')}
  <div class="corpo-slide">
    <span class="capitulo">O resultado</span>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:36px;margin-bottom:44px;">
      <div style="border-top:1px solid rgba(255,255,255,0.15);padding-top:28px;">
        <div style="font-family:'Anton',sans-serif;font-size:96px;color:#fff;line-height:0.9;letter-spacing:-2px;">R$80K</div>
        <div style="font-family:'Montserrat',sans-serif;font-size:28px;color:rgba(255,255,255,0.45);font-weight:300;margin-top:12px;">faturamento mensal</div>
      </div>
      <div style="border-top:1px solid rgba(255,255,255,0.15);padding-top:28px;">
        <div style="font-family:'Anton',sans-serif;font-size:96px;color:#fff;line-height:0.9;letter-spacing:-2px;">6 MES</div>
        <div style="font-family:'Montserrat',sans-serif;font-size:28px;color:rgba(255,255,255,0.45);font-weight:300;margin-top:12px;">para dobrar o negócio</div>
      </div>
    </div>
    <p class="texto">A empresa é a mesma. O produto é o mesmo. A única coisa que mudou foi que as pessoas passaram a ver — e a confiar.</p>
  </div>
  <div class="rodape">
    <div style="width:40px;height:2px;background:rgba(255,255,255,0.15);"></div>
    <span class="continua">continua</span>
  </div>
</div>
</body></html>`;
}

// ── SLIDE 6 — A LIÇÃO (tipográfico puro — sem foto) ──────────
function slide6(logo) {
  // Fundo sólido com linhas diagonais sutis — sem imagem para máximo impacto da frase
  const diagonalPattern = `data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='0.4' stroke-opacity='0.04'%3E%3Cline x1='0' y1='60' x2='60' y2='0'/%3E%3C/g%3E%3C/svg%3E`;
  return `<!DOCTYPE html><html lang="pt-BR"><head>${head(`
.slide-6 { background: #070707; }
.aspas {
  font-family: 'Playfair Display', serif; font-style: italic;
  font-size: 220px; line-height: 0.5; color: rgba(255,255,255,0.05);
  position: absolute; top: 180px; left: 60px; pointer-events: none; z-index: 2;
}
.citacao {
  font-family: 'Playfair Display', serif; font-style: italic;
  font-size: 62px; color: #fff; line-height: 1.35; letter-spacing: -0.5px; max-width: 880px;
  margin-bottom: 52px; position: relative; z-index: 5;
}
.atrib {
  font-family: 'JetBrains Mono', monospace; font-size: 24px;
  color: rgba(255,255,255,0.30); letter-spacing: 0.12em; text-transform: uppercase;
  position: relative; z-index: 5;
}
.linha-divisor {
  width: 64px; height: 1px; background: rgba(255,255,255,0.20); margin-bottom: 32px;
  position: relative; z-index: 5;
}
`)}</head><body>
<div class="slide slide-6" style="background-image:url('${diagonalPattern}');">
  <div class="grain"></div>
  <div class="aspas">"</div>
  ${marcaHtml(logo, '06 / 07')}
  <div style="position:relative;z-index:4;padding:0 72px;flex:1;display:flex;flex-direction:column;justify-content:center;">
    <p class="citacao">
      Produto invisível não compete. Presença visual não é estética — é sobrevivência no mercado atual.
    </p>
    <div class="linha-divisor"></div>
    <span class="atrib">A lição de Marcos — e de qualquer negócio</span>
  </div>
  <div class="rodape">
    <div style="width:40px;height:2px;background:rgba(255,255,255,0.15);"></div>
    <span class="continua">última página</span>
  </div>
</div>
</body></html>`;
}

// ── SLIDE 7 — CTA ─────────────────────────────────────────────
function slide7(logo, img) {
  return `<!DOCTYPE html><html lang="pt-BR"><head>${head()}</head><body>
<div class="slide">
  <div class="bg" style="background-image:url('${img}')"></div>
  <div class="overlay" style="background:linear-gradient(to bottom,rgba(5,5,5,0.82) 0%,rgba(5,5,5,0.60) 40%,rgba(5,5,5,0.90) 70%,rgba(5,5,5,1.0) 100%)"></div>
  <div class="grain"></div>
  ${marcaHtml(logo, '07 / 07')}
  <div class="corpo-slide">
    <h2 style="font-family:'Anton',sans-serif;font-size:90px;color:#fff;line-height:0.97;letter-spacing:-1.5px;text-transform:uppercase;margin-bottom:44px;">
      SUA MARCA<br>TEM UMA<br>HISTÓRIA ASSIM.
    </h2>
    <p class="texto" style="margin-bottom:52px;">A questão não é se você tem algo para mostrar. É se alguém está vendo. Produção cinematográfica para marcas que querem ser encontradas.</p>
    <div style="display:flex;align-items:center;gap:28px;">
      <div style="width:1px;height:44px;background:rgba(255,255,255,0.20);"></div>
      <div>
        <div style="font-family:'Montserrat',sans-serif;font-size:30px;color:rgba(255,255,255,0.50);font-weight:300;margin-bottom:4px;">conversa sem compromisso</div>
        <div style="font-family:'JetBrains Mono',monospace;font-size:30px;color:#fff;letter-spacing:0.04em;">DM @carbonfilms.sc</div>
      </div>
    </div>
  </div>
  <div class="rodape">
    <div style="display:flex;align-items:center;gap:16px;">
      <div class="logo-circle" style="width:52px;height:52px;"><img src="${logo}" alt=""></div>
      <span style="font-family:'JetBrains Mono',monospace;font-size:22px;color:rgba(255,255,255,0.35);">Carbon Films — Santa Catarina</span>
    </div>
  </div>
</div>
</body></html>`;
}

// ── Preview HTML dedicado ─────────────────────────────────────
function buildPreviewHtml() {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Story Preview — Carbon Films</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: #080808; font-family: 'JetBrains Mono', monospace; color: #fff; padding: 48px 32px; }
h1 { font-size: 13px; letter-spacing: 0.2em; color: #333; text-transform: uppercase; margin-bottom: 6px; }
.sub { font-size: 12px; color: #222; margin-bottom: 48px; }
.grid { display: flex; flex-wrap: wrap; gap: 20px; justify-content: center; }
.card { display: flex; flex-direction: column; align-items: center; gap: 10px; }
.cap { font-size: 11px; color: #2a2a2a; letter-spacing: 0.14em; text-transform: uppercase; }
.card img {
  display: block; width: 280px; height: 350px; object-fit: cover;
  border-radius: 8px; border: 1px solid #141414; cursor: pointer;
  transition: transform 0.2s, border-color 0.2s;
}
.card img:hover { transform: scale(1.04); border-color: #2a2a2a; }

#lb { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.95); z-index: 99; align-items: center; justify-content: center; }
#lb.open { display: flex; }
#lb img { max-height: 94vh; max-width: 94vw; border-radius: 10px; }
#lb-close { position: absolute; top: 24px; right: 32px; font-size: 24px; color: #444; cursor: pointer; letter-spacing: 0.1em; }
#lb-close:hover { color: #fff; }
#lb-nav { position: absolute; bottom: 28px; font-size: 11px; color: #333; letter-spacing: 0.16em; }
</style>
</head>
<body>
<h1>Carbon Films — Storytelling</h1>
<div class="sub">7 slides · 1080×1350px · clique para ampliar</div>
<div class="grid" id="grid"></div>

<div id="lb">
  <span id="lb-close">FECHAR</span>
  <img id="lb-img" src="" alt="">
  <span id="lb-nav"></span>
</div>

<script>
const slides = [
  { n: 1, cap: '01 — hook' },
  { n: 2, cap: '02 — contexto' },
  { n: 3, cap: '03 — a crise' },
  { n: 4, cap: '04 — a decisão' },
  { n: 5, cap: '05 — resultado' },
  { n: 6, cap: '06 — a lição' },
  { n: 7, cap: '07 — cta' },
];

let current = 0;
const grid = document.getElementById('grid');

slides.forEach((s, i) => {
  const card = document.createElement('div');
  card.className = 'card';
  const cap = document.createElement('div');
  cap.className = 'cap';
  cap.textContent = s.cap;
  const img = document.createElement('img');
  img.src = \`slide-\${s.n}.jpg?t=\${Date.now()}\`;
  img.alt = s.cap;
  img.onclick = () => openLb(i);
  card.appendChild(cap);
  card.appendChild(img);
  grid.appendChild(card);
});

function openLb(i) {
  current = i;
  document.getElementById('lb-img').src = \`slide-\${slides[i].n}.jpg?t=\${Date.now()}\`;
  document.getElementById('lb-nav').textContent = slides[i].cap.toUpperCase();
  document.getElementById('lb').classList.add('open');
}

document.getElementById('lb-close').onclick = () => document.getElementById('lb').classList.remove('open');
document.getElementById('lb').onclick = (e) => {
  if (e.target === document.getElementById('lb')) document.getElementById('lb').classList.remove('open');
};

document.addEventListener('keydown', (e) => {
  if (!document.getElementById('lb').classList.contains('open')) return;
  if (e.key === 'ArrowRight' && current < slides.length - 1) openLb(++current);
  if (e.key === 'ArrowLeft' && current > 0) openLb(--current);
  if (e.key === 'Escape') document.getElementById('lb').classList.remove('open');
});
</script>
</body>
</html>`;
}

// ── Pipeline ──────────────────────────────────────────────────
async function main() {
  loadEnv();
  const logo = getLogoBase64();

  console.log('\nCarbon Films — Storytelling Demo');
  console.log('=================================\n');

  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

  const queries = [
    'entrepreneur night city cinematic dark',
    'construction worker site portrait dramatic',
    'man thinking alone dark room moody',
    'empty road sunset dramatic sky',
    'business team celebrating success office',
    null, // slide 6 é tipográfico puro
    'santa catarina florianopolis aerial dusk',
  ];

  console.log('Buscando imagens no Unsplash...');
  const images = [];
  for (let i = 0; i < 7; i++) {
    if (!queries[i]) { images.push(''); console.log(`  [${i + 1}/7] tipográfico — sem foto`); continue; }
    const url = await fetchUnsplash(queries[i]);
    images.push(url);
    console.log(`  [${i + 1}/7] "${queries[i]}" → ${url ? 'ok' : 'sem imagem'}`);
    await new Promise(r => setTimeout(r, 400));
  }

  const generators = [slide1, slide2, slide3, slide4, slide5, (l, _) => slide6(l), slide7];
  const htmlFiles  = [];

  console.log('\nGerando slides HTML...');
  for (let i = 0; i < 7; i++) {
    const html     = generators[i](logo, images[i]);
    const filePath = path.join(OUT, `slide-${i + 1}.html`);
    fs.writeFileSync(filePath, html, 'utf8');
    htmlFiles.push(filePath);
    console.log(`  [${i + 1}/7] slide-${i + 1}.html`);
  }

  // Preview HTML dedicado
  const previewPath = path.join(OUT, 'story-preview.html');
  fs.writeFileSync(previewPath, buildPreviewHtml(), 'utf8');

  // index.json para capture-slides.js
  fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify({
    generated_at: new Date().toISOString(),
    format: 'feed',
    total: 7,
    files: htmlFiles,
  }, null, 2));

  console.log('\nCapturando screenshots com Playwright...');
  const { captureSlides } = require('./capture-slides');
  await captureSlides();

  // Garante servidor de preview ativo
  const { execSync } = require('child_process');
  try {
    execSync('pgrep -f "python3 -m http.server 8080"', { stdio: 'ignore' });
  } catch {
    console.log('Subindo servidor de preview...');
    execSync(`cd ${OUT} && nohup python3 -m http.server 8080 > /tmp/preview-server.log 2>&1 &`);
    await new Promise(r => setTimeout(r, 800));
  }

  console.log('\nPronto. Acesse:');
  console.log('  http://76.13.172.41:8080/story-preview.html\n');
}

main().catch(err => { console.error('\nErro:', err.message); process.exit(1); });
