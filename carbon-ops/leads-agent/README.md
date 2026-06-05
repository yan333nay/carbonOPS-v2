# Leads Agent — Carbon Films

Agente autônomo que gera listas de leads de imobiliárias (foco em venda de imóveis) e salva no Google Sheets do CRM.

## O que faz

- Busca imobiliárias que vendem imóveis em cidades de SC/PR/RS/SP via DuckDuckGo
- Filtra assessorias, portais e domínios genéricos
- Extrai nome, email, telefone (WhatsApp prioritário) e serviços que a Carbon Films pode oferecer
- Salva na planilha Google Sheets e no banco local de deduplicação
- Roda todo dia útil às 08:00 BRT via crontab

## Setup na VPS

```bash
cd /root/leads-agent
npm install
npx playwright install chromium
```

Crie o arquivo `.env`:
```
SPREADSHEET_ID=<id da planilha>
GOOGLE_CREDENTIALS_PATH=./google-credentials.json
TARGET_LEADS_PER_DAY=25
```

Siga `SETUP-GOOGLE-SHEETS.md` para configurar a Service Account do Google.

## Crontab

```
# Todo dia útil 08:00 BRT (11:00 UTC)
0 11 * * 1-5 /usr/bin/node /root/leads-agent/index.js >> /root/leads-agent/logs/leads.log 2>&1
```

## Comandos

```bash
# Rodar completo
node index.js

# Dry-run (não salva)
node index.js --dry-run
```

## Padrão da planilha CRM

| NOME | E-MAIL | TELEFONE | URL DO SITE | SERVIÇOS | DATA |
|---|---|---|---|---|---|
| Nome da imobiliária | email@imob.com.br | (47) 99999-9999 | https://... | Serviços que a Carbon Films oferece | 15/05/2026 |
