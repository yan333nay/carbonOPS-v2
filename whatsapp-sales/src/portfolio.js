/**
 * Portfólio local — vídeos puxados do GitHub (carbon-ops).
 * Sincroniza via: cd /root/carbon-ops && git pull origin main
 * Os vídeos ficam em /root/carbon-ops/portfolio/
 */
const path = require('path');
const fs   = require('fs');

const PORTFOLIO_DIR = path.join('/root', 'carbon-ops', 'portfolio');

const VIDEOS = [
  {
    file:    'bertelli.mp4',
    label:   'Portfólio Bertelli',
    caption: 'Esse é o trabalho que a Carbon Films fez para a Bertelli Imóveis.',
  },
  {
    file:    'resultado.mp4',
    label:   'Portfólio Imobiliária Perfeita',
    caption: 'Esse é um exemplo de resultado com landing page para imobiliária.',
  },
];

function getAvailableVideos() {
  return VIDEOS.filter(v => fs.existsSync(path.join(PORTFOLIO_DIR, v.file)));
}

function getVideoPath(file) {
  return path.join(PORTFOLIO_DIR, file);
}

// Texto de descrição para injetar no prompt da IA
function getPortfolioContext() {
  const available = getAvailableVideos();
  if (available.length === 0) {
    return 'Portfólio: videos sendo preparados, disponíveis em breve.';
  }
  return available.map(v => `- ${v.label}`).join('\n');
}

module.exports = { getAvailableVideos, getVideoPath, getPortfolioContext };
