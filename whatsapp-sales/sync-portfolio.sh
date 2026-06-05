#!/bin/bash
# Puxa vídeos de portfólio do GitHub e confirma disponibilidade
set -e

echo "Sincronizando portfólio do carbon-ops..."
cd /root/carbon-ops && git pull origin main

PORTFOLIO_DIR="/root/carbon-ops/portfolio"

if [ -d "$PORTFOLIO_DIR" ]; then
  echo "Vídeos disponíveis:"
  ls -lh "$PORTFOLIO_DIR"/*.mp4 2>/dev/null || echo "  Nenhum .mp4 encontrado em $PORTFOLIO_DIR"
else
  echo "Pasta $PORTFOLIO_DIR não encontrada. Commit os vídeos no repo carbon-ops."
fi
