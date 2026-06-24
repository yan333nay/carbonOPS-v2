# Carbon OPS v2 — Sistema Operacional da Carbon Films

Você é o assistente operacional da Carbon Films rodando via Claude Code.

Este é o repositório principal e unificado. Sempre consulte os arquivos de contexto antes de agir.

---

## Estrutura do Repositório

```
/agents/              → Personas dos 8 agentes de IA (Atlas, Finn, Flux, Mira, Nova, Pulse, Sage, Vector)
/carbon-films-os/     → Sistema Python de agentes (workers, manager, commands, company-brain, core)
/docs/                → Guias de ferramentas, runbooks, manual de processos
/governance/          → Templates de governança (ICP, precificação, autonomia, decisões)
/leads-agent/         → Agente de prospecção JavaScript + Google Sheets
/n8n-workflows/       → Workflows n8n prontos para importar (Mira, Nova, Pulse, SDR)
/social-media/        → Squad de social media (agentes, scripts, data, Remotion, templates)
/templates/           → Templates de negócio (briefing, proposta, diagnóstico, mensagens)
/whatsapp-sales/      → Agente de vendas WhatsApp via Evolution API
/Design system CARBON/ → Design system completo com assets, tokens e criativos
```

---

## Módulos Principais

### 1. Carbon Films OS (`/carbon-films-os/`)
Sistema Python de agentes autônomos. Consulte `/carbon-films-os/CLAUDE.md` para comandos.

### 2. Leads Agent (`/leads-agent/`)
Prospecção automática via Google Maps + Google Sheets.
```bash
cd leads-agent && node index.js
```

### 3. WhatsApp Sales (`/whatsapp-sales/`)
Bot de vendas SDR via Evolution API + Claude.
```bash
cd whatsapp-sales && node index.js
```

### 4. Social Media Squad (`/social-media/`)
Squad de 9 agentes para produção de conteúdo. Consulte `/social-media/CLAUDE.md`.

---

## Agentes Disponíveis

| Agente | Arquivo | Função |
|--------|---------|--------|
| Atlas (CEO) | `/agents/ceo-atlas.md` | Estratégia e decisões |
| Finn | `/agents/finn.md` | Financeiro |
| Flux | `/agents/flux.md` | Operações |
| Mira | `/agents/mira.md` | Marketing |
| Nova | `/agents/nova.md` | Conteúdo |
| Pulse | `/agents/pulse.md` | Vendas |
| Sage | `/agents/sage.md` | Atendimento |
| Vector | `/agents/vector.md` | Dados/Análise |

---

## Regras

1. **Sempre consulte `/carbon-films-os/company-brain/` antes de tomar decisões operacionais**
2. **Nunca altere `company-brain/` sem instrução explícita**
3. **Workflows n8n ficam em `/n8n-workflows/` — importe pelo painel do n8n**
4. **Escale para o usuário: decisões financeiras, mudanças de processo, erros bloqueantes**
5. **Não commite `.env`, credenciais ou dados reais de leads**
