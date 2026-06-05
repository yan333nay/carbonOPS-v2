/**
 * capture-slides.js
 * Captura screenshots dos slides HTML e salva como JPG.
 * Suporta múltiplos formatos (carousel, feed, stories, reels).
 * Serve backgrounds locais via HTTP para os slides HTML.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const SLIDES_DIR = path.join(ROOT, 'output', 'slides');
const BG_DIR = path.join(ROOT, 'output', 'backgrounds');
const INDEX_FILE = path.join(SLIDES_DIR, 'index.json');
const PORT = 7891;

function findChromePath() {
  const candidates = [
    process.env.CHROME_PATH,
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium',
    '/usr/local/bin/chromium',
    '/snap/bin/chromium',
    // Windows (compatibilidade)
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ].filter(Boolean);

  for (const p of candidates) {
    try { if (fs.existsSync(p)) return p; } catch {}
  }
  return undefined; // Playwright usa seu próprio Chromium embutido
}

const FORMATS = {
  carousel: { w: 1080, h: 1080 },
  feed:     { w: 1080, h: 1350 },
  stories:  { w: 1080, h: 1920 },
  reels:    { w: 1080, h: 1920 },
  template: { w: 390,  h: 488  },
};

function startServer() {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      // Serve HTML slides
      if (req.url.match(/\/slide-\d+\.html$/)) {
        const filePath = path.join(SLIDES_DIR, req.url.slice(1));
        if (fs.existsSync(filePath)) {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(fs.readFileSync(filePath));
          return;
        }
      }
      // Serve background images
      if (req.url.startsWith('/backgrounds/')) {
        const bgFile = path.join(BG_DIR, path.basename(req.url));
        if (fs.existsSync(bgFile)) {
          const ext = path.extname(bgFile).toLowerCase();
          const ct = ext === '.png' ? 'image/png' : 'image/jpeg';
          res.writeHead(200, { 'Content-Type': ct });
          res.end(fs.readFileSync(bgFile));
          return;
        }
      }
      res.writeHead(404);
      res.end('not found');
    });
    server.listen(PORT, '127.0.0.1', () => resolve(server));
  });
}

async function captureSlides() {
  if (!fs.existsSync(INDEX_FILE)) {
    throw new Error('index.json não encontrado. Rode generate-slides-html.js primeiro.');
  }

  const index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  const { files, total, format = 'carousel' } = index;
  const dim = FORMATS[format] || FORMATS.carousel;

  console.log(`Capturando ${total} slides — formato: ${format} (${dim.w}x${dim.h})`);

  const server = await startServer();
  const chromePath = findChromePath();
  const browser = await chromium.launch({
    ...(chromePath ? { executablePath: chromePath } : {}),
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setViewportSize({ width: dim.w, height: dim.h });

  const outputFiles = [];

  for (let i = 0; i < files.length; i++) {
    const fileName = path.basename(files[i]);
    const url = `http://127.0.0.1:${PORT}/${fileName}`;
    const outPath = path.join(SLIDES_DIR, `slide-${i + 1}.jpg`);

    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Aguarda fontes carregarem
    await page.evaluate(() => document.fonts.ready);

    await page.screenshot({ path: outPath, type: 'jpeg', quality: 94 });
    outputFiles.push(outPath);
    console.log(`  [${i + 1}/${total}] ${fileName} → slide-${i + 1}.jpg (${dim.w}x${dim.h})`);
  }

  await browser.close();
  server.close();

  const manifest = {
    generated_at: new Date().toISOString(),
    format,
    dimensions: `${dim.w}x${dim.h}`,
    total,
    files: outputFiles,
  };
  fs.writeFileSync(
    path.join(SLIDES_DIR, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  console.log(`\n${total} slides capturados → ${SLIDES_DIR}`);
  return manifest;
}

if (require.main === module) {
  captureSlides().catch(err => { console.error(err.message); process.exit(1); });
}

module.exports = { captureSlides };
