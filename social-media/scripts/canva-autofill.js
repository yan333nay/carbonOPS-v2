#!/usr/bin/env node
'use strict';

/**
 * canva-autofill.js — Pixel (canva-designer)
 *
 * Usa o template de carousel salvo e aplica novos textos + imagens.
 * Estratégia:
 *   1. Verifica se o template é um brand template (suporta autofill)
 *   2. Se sim: usa POST /rest/v1/autofills para preencher campos
 *   3. Se não: duplica o design e retorna URL do editor para edição manual
 *
 * Uso:
 *   node canva-autofill.js --input carousel-latest.json
 *   node canva-autofill.js --topic "3 erros de marketing"
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const client = require('./canva-client');
const ROOT = path.join(__dirname, '..');
const TEMPLATE_IDS_PATH = path.join(ROOT, 'data', 'canva-template-ids.json');
const LATEST_FILE = path.join(ROOT, 'data', 'carousel-latest.json');

function loadTemplateIds() {
  try {
    return JSON.parse(fs.readFileSync(TEMPLATE_IDS_PATH, 'utf8'));
  } catch {
    return {};
  }
}

function separator(title) {
  console.log('\n' + '='.repeat(50));
  if (title) console.log(`  ${title}`);
  console.log('='.repeat(50));
}

// ---------------------------------------------------------------
// Tenta autofill via Brand Template API
// Requer que o template tenha campos de autofill configurados
// ---------------------------------------------------------------
async function tryAutofill(templateId, slides) {
  const token = await client.getValidToken();

  // Monta data fields com os slides
  const data = {};
  slides.forEach((slide, i) => {
    const n = i + 1;
    data[`slide_${n}_hook`] = { type: 'text', text: slide.hook || '' };
    if (slide.body) {
      data[`slide_${n}_body`] = { type: 'text', text: slide.body };
    }
    // Se tiver imagem gerada por IA, inclui como asset
    const bgPath = path.join(ROOT, 'output', 'backgrounds', `bg-slide-${n}.png`);
    if (fs.existsSync(bgPath)) {
      // Para usar imagem no autofill, precisa fazer upload primeiro
      // (deixamos como texto por enquanto — a imagem fica no fundo via HTML)
    }
  });

  const body = JSON.stringify({
    brand_template_id: templateId,
    title: `Carbon Films — ${slides[0]?.hook || 'Carousel'} — ${new Date().toLocaleDateString('pt-BR')}`,
    data,
  });

  return new Promise((resolve) => {
    const req = https.request({
      hostname: 'api.canva.com',
      path: '/rest/v1/autofills',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let raw = '';
      res.on('data', c => { raw += c; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(raw) });
        } catch {
          resolve({ status: res.statusCode, body: raw });
        }
      });
    });
    req.on('error', (err) => resolve({ status: 0, body: { error: err.message } }));
    req.write(body);
    req.end();
  });
}

// ---------------------------------------------------------------
// Faz upload de imagem para o Canva Assets
// ---------------------------------------------------------------
async function uploadImageToCanva(imagePath) {
  const token = await client.getValidToken();
  const imageBuffer = fs.readFileSync(imagePath);
  const filename = path.basename(imagePath);

  // Cria asset upload
  const createRes = await new Promise((resolve) => {
    const body = JSON.stringify({
      name: filename,
      import_type: 'image',
    });
    const req = https.request({
      hostname: 'api.canva.com',
      path: '/rest/v1/asset-uploads',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (res) => {
      let raw = '';
      res.on('data', c => { raw += c; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });
    req.write(body);
    req.end();
  });

  if (createRes.status !== 200 || !createRes.body.job?.id) {
    return null;
  }

  const jobId = createRes.body.job.id;
  const uploadUrl = createRes.body.job.upload_url;

  if (!uploadUrl) return null;

  // Upload do arquivo para a URL pré-assinada
  const uploadRes = await new Promise((resolve) => {
    const urlObj = new URL(uploadUrl);
    const req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'PUT',
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': imageBuffer.length,
      },
    }, (res) => {
      res.resume();
      res.on('end', () => resolve({ status: res.statusCode }));
    });
    req.write(imageBuffer);
    req.end();
  });

  if (uploadRes.status >= 400) return null;

  // Aguarda conclusão do job
  for (let i = 0; i < 15; i++) {
    await new Promise(r => setTimeout(r, 2000));
    const poll = await new Promise((resolve) => {
      const req = https.request({
        hostname: 'api.canva.com',
        path: `/rest/v1/asset-uploads/${jobId}`,
        headers: { 'Authorization': `Bearer ${token}` },
      }, (res) => {
        let raw = '';
        res.on('data', c => { raw += c; });
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
          catch { resolve({ status: res.statusCode, body: raw }); }
        });
      });
      req.end();
    });

    if (poll.body?.job?.status === 'success') {
      return poll.body.job.asset?.id || null;
    }
    if (poll.body?.job?.status === 'failed') return null;
  }

  return null;
}

// ---------------------------------------------------------------
// Main
// ---------------------------------------------------------------
async function run(options = {}) {
  const ids = loadTemplateIds();

  if (!ids.carousel) {
    console.log('\nNenhum template configurado.');
    console.log('Execute primeiro: node canva-setup-template.js');
    return null;
  }

  separator('PIXEL — CANVA AUTOFILL');
  console.log(`Template: ${ids.carousel_title || ids.carousel}`);
  console.log(`ID:       ${ids.carousel}`);

  // Carrega briefing
  let briefing;
  if (options.inputFile) {
    briefing = JSON.parse(fs.readFileSync(options.inputFile, 'utf8'));
  } else {
    briefing = JSON.parse(fs.readFileSync(LATEST_FILE, 'utf8'));
  }

  const slides = briefing.slides || [];
  console.log(`Slides:   ${slides.length}`);

  // [1] Tenta autofill via brand template API
  console.log('\n[1/2] Tentando autofill via API...');
  const autofillRes = await tryAutofill(ids.carousel, slides);

  if (autofillRes.status === 200 && autofillRes.body.design) {
    const newDesign = autofillRes.body.design;
    separator('DESIGN GERADO VIA AUTOFILL');
    console.log(`Novo design: ${newDesign.id}`);
    console.log(`Editor URL: ${client.getEditorUrl(newDesign.id)}`);

    // Atualiza carousel-latest.json com o novo design
    briefing.design = briefing.design || {};
    briefing.design.canva_design_id = newDesign.id;
    briefing.design.editor_url = client.getEditorUrl(newDesign.id);
    briefing.design.autofill_used = true;
    fs.writeFileSync(LATEST_FILE, JSON.stringify(briefing, null, 2));

    return {
      designId: newDesign.id,
      editorUrl: client.getEditorUrl(newDesign.id),
      method: 'autofill',
    };
  }

  // [2] Fallback: retorna URL do template original para edição manual
  console.log(`  Autofill não disponível (${autofillRes.body?.message || 'template não é brand template'})`);
  console.log('\n[2/2] Modo manual — abrindo template original...');

  const editorUrl = ids.carousel_editor_url || client.getEditorUrl(ids.carousel);

  separator('TEMPLATE PRONTO PARA EDIÇÃO');
  console.log(`\nO template está pronto no Canva.`);
  console.log(`Abra e edite os textos e imagens conforme o briefing abaixo:\n`);

  slides.forEach((s, i) => {
    console.log(`  Slide ${i + 1}: "${s.hook}"${s.body ? ` — ${s.body.slice(0, 50)}...` : ''}`);
  });

  console.log(`\nURL do editor: ${editorUrl}`);
  console.log('\nDica: Para automatizar completamente, converta o template para');
  console.log('"Brand Template" no Canva e adicione campos de autofill.');

  // Salva a URL no briefing
  briefing.design = briefing.design || {};
  briefing.design.canva_design_id = ids.carousel;
  briefing.design.editor_url = editorUrl;
  briefing.design.autofill_used = false;
  briefing.design.manual_edit_required = true;
  fs.writeFileSync(LATEST_FILE, JSON.stringify(briefing, null, 2));

  return {
    designId: ids.carousel,
    editorUrl,
    method: 'manual',
  };
}

// ---------------------------------------------------------------
// CLI
// ---------------------------------------------------------------
if (require.main === module) {
  const args = process.argv.slice(2);
  const inputIdx = args.indexOf('--input');
  const inputFile = inputIdx !== -1 ? path.resolve(args[inputIdx + 1]) : null;

  run({ inputFile })
    .then(result => {
      if (result) {
        console.log('\n--- Resultado ---');
        console.log(`Método: ${result.method}`);
        console.log(`URL:    ${result.editorUrl}`);
      }
    })
    .catch(err => {
      console.error('Erro:', err.message);
      process.exit(1);
    });
}

module.exports = { run };
