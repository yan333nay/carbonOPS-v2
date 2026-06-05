#!/usr/bin/env node
'use strict';

/**
 * Pixel — Canva Export
 * Exporta design finalizado como JPG e retorna URL publica
 *
 * Uso: node canva-export.js <design_id> [format]
 *      node canva-export.js DAHFL6HSvFk jpg
 */

const https = require('https');
const client = require('./canva-client');

async function exportDesign(designId, format = 'jpg') {
  const token = await client.getValidToken();

  console.log(`Exportando design ${designId} como ${format.toUpperCase()}...`);

  // Step 1: Criar job de export
  const body = JSON.stringify({
    design_id: designId,
    format: { type: format },
  });

  const jobRes = await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: 'api.canva.com',
      path: '/rest/v1/exports',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
      },
    }, (r) => {
      let data = '';
      r.on('data', c => { data += c; });
      r.on('end', () => resolve({ status: r.statusCode, body: JSON.parse(data) }));
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });

  if (jobRes.status !== 200) {
    throw new Error(`Export job failed (${jobRes.status}): ${JSON.stringify(jobRes.body)}`);
  }

  const jobId = jobRes.body.job?.id;
  if (!jobId) throw new Error(`No export job ID: ${JSON.stringify(jobRes.body)}`);

  console.log(`  Job criado: ${jobId}`);

  // Step 2: Poll ate completar
  for (let i = 0; i < 30; i++) {
    await new Promise(r => setTimeout(r, 2000));

    const poll = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.canva.com',
        path: `/rest/v1/exports/${jobId}`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      }, (r) => {
        let data = '';
        r.on('data', c => { data += c; });
        r.on('end', () => resolve({ status: r.statusCode, body: JSON.parse(data) }));
      });
      req.on('error', reject);
      req.end();
    });

    const job = poll.body.job;
    process.stdout.write(`  Status: ${job?.status}...\r`);

    if (job?.status === 'success') {
      const urls = job.urls || [];
      console.log(`\n  Exportado: ${urls.length} arquivo(s)`);
      return urls;
    }

    if (job?.status === 'failed') {
      throw new Error(`Export job failed: ${JSON.stringify(job)}`);
    }
  }

  throw new Error('Export job timed out (60s)');
}

// CLI
if (require.main === module) {
  const designId = process.argv[2];
  const format = process.argv[3] || 'jpg';

  if (!designId) {
    console.error('Uso: node canva-export.js <design_id> [format]');
    console.error('Exemplo: node canva-export.js DAHFL6HSvFk jpg');
    process.exit(1);
  }

  exportDesign(designId, format)
    .then(urls => {
      console.log('\nURLs de download:');
      urls.forEach((url, i) => console.log(`  [${i + 1}] ${url}`));
    })
    .catch(err => {
      console.error('Erro:', err.message);
      process.exit(1);
    });
}

module.exports = { exportDesign };
