# PROJECT: Site Carbon Films

## Identidade
- **ID:** `project-site-carbon`
- **Nome:** Site Carbon Films
- **Tipo:** site estático + portal de clientes (em desenvolvimento)
- **Status:** ativo
- **Criado em:** 2026-03-12

## Descrição
Site institucional da Carbon Films, agência de marketing visual cinematográfico em Santa Catarina. Criado com Claude Code e hospedado na Netlify. Em desenvolvimento: portal de clientes para acompanhamento de campanhas de tráfego pago (Meta Ads + Google Ads).

## Arquivos do Projeto

**Caminho local:** `/c/Users/suzam/aios-core-main/aios-core-main/site-carbon/`

| Arquivo | Status | Descrição |
|---------|--------|-----------|
| `index.html` | Produção | Página inicial |
| `servicos.html` | Produção | Serviços |
| `sobre.html` | Produção | Institucional |
| `contato.html` | Produção | Formulário de contato |
| `logo.png` | Produção | Logo oficial |
| `cliente.html` | Produção | Login unificado — redireciona por role (cliente/sócio) |
| `portal.html` | Produção | Dashboard do cliente com Chart.js, KPIs, análise |
| `admin-portal.html` | Produção | Painel dos sócios — visão de todos os clientes |
| `netlify/functions/meta-ads.js` | Produção | Meta Ads API — period param + daily data |
| `netlify/functions/google-ads.js` | Produção | Google Ads API — period param + daily data |
| `netlify/functions/admin-ads.js` | Produção | Admin — consolida todos os clientes (role: admin) |

**Design System:** `projects/site-carbon/design-system.md` (Status: Completo)

| Arquivo DS | Status |
|-----------|--------|
| `design-tokens.css` | Completo — 10 tokens de cor, tipografia, espacamento, z-index, animacao |
| `components.css` | Completo — 20 componentes `.cf-*` |
| `animations.css` | Completo — 14 keyframes, scroll reveal, skeleton, spinner |
| `utilities.css` | Completo — classes flex, gap, margin, padding, display |
| `assets/cf-core.js` | Completo — cursor, scroll reveal, contadores |
| `assets/logo-white.png` | Novo — 1024×1024, fundo transparente |
| `assets/logo-black.png` | Novo — 1024×1024, fundo transparente |
| `assets/logo-gray.png` | Novo — 1024×1024, fundo transparente |
| `assets/logo-white-on-black.png` | Novo — 1024×1024 |
| `assets/logo-black-on-white.png` | Novo — 1024×1024 |
| `assets/logo-white-sm.png` | Novo — 512×512, uso web |
| `assets/favicon-64.png` | Novo — 64×64 |
| `demo.html` | Completo — showcase de todos os tokens e componentes |

## Stack Tecnológica
- **Frontend:** HTML5 + CSS3 + Vanilla JS (sem framework, sem build system)
- **Hosting:** Netlify
- **Auth:** Netlify Identity (GoTrue)
- **Serverless:** Netlify Functions (Node.js)
- **APIs externas:** Meta Ads API + Google Ads API
- **Formulários:** [confirmar — Netlify Forms?]
- **Analytics:** [confirmar]

## Referências & Links

| O que é | Link / Local |
|---------|-------------|
| Produção | https://carbonfilms.com.br |
| Painel Netlify | https://app.netlify.com |
| Repositório | [adicionar] |

## Integrações Planejadas — Portal de Clientes

### Meta Ads API
- Base URL: `https://graph.facebook.com/v18.0/`
- Endpoint de métricas: `/act_{account_id}/insights`
- **BLOQUEIO:** App ID, App Secret, Access Token por cliente

### Google Ads API
- Base URL: `https://googleads.googleapis.com/`
- Endpoint: `customers/{customer_id}/googleAds:search`
- **BLOQUEIO:** OAuth2 Client ID, Client Secret, Refresh Token, Customer ID por cliente

### Mapeamento cliente → contas (a preencher)
```json
[
  {
    "id": "cliente-001",
    "nome": "Nome do Cliente",
    "email": "email@cliente.com",
    "meta_account_id": "act_XXXXXXXXXX",
    "google_customer_id": "XXX-XXX-XXXX"
  }
]
```
**BLOQUEIO:** Lista real de clientes e seus IDs de conta nas plataformas.

## Regras de Desenvolvimento
1. Manter visual dark/cinema — ver design-system.md para tokens
2. Novas páginas: copiar tokens CSS e padrões de index.html
3. Incluir grain overlay + cursor customizado em todas as páginas
4. Nunca expor API keys no frontend — sempre via Netlify Functions
5. Apenas edições locais — sem deploy sem aprovação explícita
6. Decisões arquiteturais: registrar no DAILY_LOG antes de implementar

## Contatos & Responsáveis
- **Dono:** próprio (dono da agência)
- **Dev:** Claude Code (AIOX)

## Histórico
| Data | O que aconteceu |
|------|----------------|
| 2026-03-12 | Projeto registrado no AIOX |
| 2026-03-12 | Contexto completo documentado + design system extraído |
| 2026-03-12 | MTASK-001 criada: portal de clientes com Meta Ads + Google Ads |
| 2026-03-13 | Portal do cliente redesenhado: Chart.js, 6 KPIs, análise de insights, period selector |
| 2026-03-13 | Admin portal criado: visão consolidada de todos os clientes para sócios |
| 2026-03-13 | Functions atualizadas: period param (7/30/90d), daily data, CPC/CPM calculados |
| 2026-03-13 | Login inteligente: detecta role admin e redireciona para o portal correto |
| 2026-03-13 | Nova function admin-ads.js: acesso exclusivo por role "admin" no Netlify Identity |
| 2026-04-24 | Design System v1.0 concluído: tokens, 20 componentes, animações, utilitários, demo |
| 2026-04-24 | Nova logo processada (escudo+relâmpago+barras): 7 variações PNG com fundo transparente |
