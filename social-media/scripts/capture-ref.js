const { chromium } = require('playwright');
const path = require('path');

const COMP = path.join(__dirname, '..', 'componentes');
const OUT  = path.join(__dirname, '..', 'output', 'slides');

const slides = [
  { file: path.join(COMP, 'slide-capa.html'),    out: path.join(OUT, 'preview-capa.jpg') },
  { file: path.join(COMP, 'slide-dica.html'),    out: path.join(OUT, 'preview-dica.jpg') },
  { file: path.join(COMP, 'slide-dado.html'),    out: path.join(OUT, 'preview-dado.jpg') },
  { file: path.join(COMP, 'slide-lista.html'),   out: path.join(OUT, 'preview-lista.jpg') },
  { file: path.join(COMP, 'slide-citacao.html'), out: path.join(OUT, 'preview-citacao.jpg') },
  { file: path.join(COMP, 'slide-cta.html'),     out: path.join(OUT, 'preview-cta.jpg') },
];

(async () => {
  const browser = await chromium.launch({ args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1080, height: 1350 });

  for (const s of slides) {
    console.log(`Capturando ${path.basename(s.file)}...`);
    await page.goto(`file://${s.file}`, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(1200);
    await page.screenshot({
      path: s.out, type: 'jpeg', quality: 92,
      clip: { x: 0, y: 0, width: 1080, height: 1350 }
    });
    console.log(`  Salvo: ${path.basename(s.out)}`);
  }

  await browser.close();
  console.log('Concluido.');
})();
