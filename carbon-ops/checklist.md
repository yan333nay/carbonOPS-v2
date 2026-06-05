# Carbon Films — Checklist de Implementação
**Última atualização:** 2026-05-03
**Status geral:** FASE 0 aguardando Yan/Joel | FASE 2 completa | SDR Bot construído e pronto para setup | Make → n8n migrado

---

## Legenda
- ✅ Concluído
- 🔄 Em progresso (Claude Code trabalhando)
- ⏳ Aguardando decisão/ação de Yan/Joel
- ❌ Bloqueado
- ⬜ Pendente

---

## FASE 0 — DECISÕES ESTRATÉGICAS (Yan/Joel)

| # | Item | Status | Notas |
|---|------|--------|-------|
| 0.1 | Definir orçamento mensal total do sistema de IA | ⏳ | Precisa de Yan/Joel |
| 0.2 | Escolher ferramenta de transcrição (Fireflies recomendado) | ⏳ | Ver comparativo em `docs/ferramentas.md` |
| 0.3 | Escolher modo de deploy do n8n (Cloud ou self-hosted Docker) | ⏳ | Ver `docs/guia-n8n.md` — **n8n escolhido como plataforma** |
| 0.4 | Definir estratégia de WhatsApp Business | ⏳ | API Oficial recomendada |
| 0.5 | Definir parâmetros de autonomia de cada Clone | ⏳ | Template em `governance/autonomia-template.md` |
| 0.6 | Definir ICP detalhado para VECTOR e NOVA | ⏳ | Template em `governance/icp-template.md` |
| 0.7 | Definir tabela de precificação dos 9 serviços | ⏳ | Template em `governance/precificacao-template.md` |

---

## FASE 1 — INFRAESTRUTURA BASE

| # | Item | Status | Notas |
|---|------|--------|-------|
| 1.1 | Configurar ClickUp completo | ⏳ | Precisa decisão 0.1 |
| 1.2 | Configurar Google Workspace da agência | ⏳ | Precisa conta Google dedicada |
| 1.3 | Configurar ferramenta de transcrição | ⏳ | Precisa decisão 0.2 |
| 1.4 | Configurar n8n (Cloud ou Docker) | ⏳ | Precisa decisões 0.3 e 0.4 — ver `docs/guia-n8n.md` |
| 1.5 | Configurar Anthropic API | ⏳ | Precisa orçamento aprovado |

---

## FASE 2 — CONSTRUÇÃO DOS AGENTES

| # | Item | Status | Notas |
|---|------|--------|-------|
| 2.1 | System prompt CEO-ATLAS | ✅ | `agents/ceo-atlas.md` — v1.2 |
| 2.2 | System prompt NOVA | ✅ | `agents/nova.md` — v1.2 |
| 2.3 | System prompt VECTOR | ✅ | `agents/vector.md` — v1.2 |
| 2.4 | System prompt MIRA | ✅ | `agents/mira.md` — v1.1 |
| 2.5 | System prompt FINN | ✅ | `agents/finn.md` — v1.1 |
| 2.6 | Regras e mensagens PULSE | ✅ | `agents/pulse.md` — v1.0 |
| 2.7 | Regras FLUX | ✅ | `agents/flux.md` — v1.0 |
| 2.8 | System prompt SAGE | ✅ | `agents/sage.md` — v1.1 |
| 2.9 | Integrar agentes nas ferramentas | ⏳ | Precisa Fase 1 completa |
| 2.10 | Calibrar e testar cada agente | ⏳ | Precisa integração |

---

## FASE 3 — INTEGRAÇÃO E TESTES

| # | Item | Status | Notas |
|---|------|--------|-------|
| 3.1 | Teste de fluxo comercial completo | ⏳ | Precisa Fase 2 |
| 3.2 | Teste de fluxo operacional | ⏳ | Precisa Fase 2 |
| 3.3 | Teste de gestão de crise | ⏳ | Precisa Fase 2 |

---

## SDR BOT — Sistema de Vendas Ativas

| # | Item | Status | Notas |
|---|------|--------|-------|
| SDR.1 | WF-SDR-01: Inbound handler (conversa + reunião) | ✅ | `n8n-workflows/wf-sdr-01-inbound.json` |
| SDR.2 | WF-SDR-02: Outbound primeiro contato | ✅ | `n8n-workflows/wf-sdr-02-outbound.json` |
| SDR.3 | WF-SDR-03: Follow-up D+3, D+7, D+14 | ✅ | `n8n-workflows/wf-sdr-03-followup.json` |
| SDR.4 | Guia de setup completo com testes | ✅ | `docs/sdr-bot-setup.md` |
| SDR.5 | Criar propriedades customizadas no HubSpot | ⏳ | Ver `docs/sdr-bot-setup.md` — Passo 1 |
| SDR.6 | Criar pipeline SDR no HubSpot | ⏳ | Ver `docs/sdr-bot-setup.md` — Passo 2 |
| SDR.7 | Configurar WhatsApp Business API | ⏳ | Decisão 0.4 — 360dialog recomendado para início |
| SDR.8 | Configurar Google Calendar API + OAuth | ⏳ | Ver `docs/sdr-bot-setup.md` — Passo 5 |
| SDR.9 | Importar workflows no n8n e configurar variáveis | ⏳ | Ver `docs/sdr-bot-setup.md` — Passos 6 e 7 |
| SDR.10 | Executar testes com curl (sem WhatsApp real) | ⏳ | Ver `docs/sdr-bot-setup.md` — Passo 8 |
| SDR.11 | Adicionar primeiros leads de teste no HubSpot | ⏳ | Yan faz manualmente |
| SDR.12 | Ativar workflows em produção | ⏳ | Após SDR.5 a SDR.11 |

---

## FASE 4 — OPERAÇÃO SUPERVISIONADA

| # | Item | Status | Notas |
|---|------|--------|-------|
| 4.1 | Semana de shadowing NOVA (Yan monitora) | ⏳ | Precisa Fase 3 |
| 4.2 | Monitoramento CEO-ATLAS semana 1 | ⏳ | Precisa Fase 3 |
| 4.3 | Ativar PULSE e FLUX em produção | ⏳ | Precisa Fase 3 |

---

## FASE 5 — DOCUMENTAÇÃO VIVA

| # | Item | Status | Notas |
|---|------|--------|-------|
| 5.1 | Sistema de versionamento de prompts | ✅ | Estrutura em `agents/` com versões |
| 5.2 | Runbook de operação para Yan/Joel | 🔄 | Em `docs/runbooks/` |
| 5.3 | Agenda de manutenção recorrente | ✅ | Em `governance/manutencao.md` |

---

## FASE 6 — EXPANSÃO (após 60 dias estável)

| # | Item | Status | Notas |
|---|------|--------|-------|
| 6.1 | NOVA em modo de condução de reunião (voz) | ⏳ | Decisão de Yan/Joel |
| 6.2 | Dashboard de KPIs em tempo real (Looker Studio) | ⏳ | Precisa Fase 4 |
| 6.3 | Banco de decisões para CEO-ATLAS | ⏳ | Após 60 dias operação |

---

## TRABALHO AUTÔNOMO DISPONÍVEL AGORA

Estes itens podem ser feitos sem Yan/Joel e serão priorizados nas sessões de cron:

- [x] Criar templates completos de mensagens — `templates/mensagens-padrao.md`
- [x] Criar formulário de diagnóstico detalhado — `templates/diagnostico.md`
- [x] Criar template de proposta comercial completo — `templates/proposta-comercial.md`
- [x] Criar runbooks de operação para Yan/Joel — `docs/runbooks/emergencias.md` + `docs/runbooks/operacao-diaria.md`
- [x] Criar guia de configuração do ClickUp — `docs/guia-clickup.md`
- [x] Criar guia de configuração do Make com cenários — `docs/guia-make.md`
- [x] Criar comparativo de ferramentas — `docs/guia-ferramentas.md`
- [x] Criar documento de ICP template — `governance/icp-template.md`
- [x] Criar documento de precificação template — `governance/precificacao-template.md`
- [x] Criar documento de parâmetros de autonomia — `governance/autonomia-template.md`
- [x] Criar banco de simulações para calibrar NOVA (10 cenários) — `docs/simulacoes-nova.md`
- [x] Refinar system prompts v1.1 com casos de uso específicos da Carbon — todos os 8 agentes em v1.1
- [x] Criar template de relatório mensal — `templates/relatorio-mensal.md`
- [x] Criar guia de onboarding técnico por serviço — `docs/onboarding-por-servico.md`
- [x] Criar banco de decisões para CEO-ATLAS — `governance/banco-decisoes-atlas.md`
- [x] Criar script de apresentação de proposta — `docs/script-apresentacao-proposta.md`
- [x] Criar template de briefing completo (Processo 04) — `templates/briefing-completo.md`
- [x] Criar guia de configuração do Fireflies.ai — `docs/guia-fireflies.md`
- [x] Criar template de dossiê de saída (Processo 08) — `templates/dossie-saida.md`
- [x] Criar README.md para GitHub com visão geral do projeto — `README.md`
- [x] Criar banco de simulações para calibrar VECTOR (8 cenários) — `docs/simulacoes-vector.md`
- [x] Criar banco de simulações para calibrar CEO-ATLAS (8 cenários) — `docs/simulacoes-ceo-atlas.md`
- [x] Refinar NOVA v1.2 — playbook de objeções SC, protocolo leads frios, sinais de compra
- [x] Criar banco de simulações para calibrar FINN (8 cenários) — `docs/simulacoes-finn.md`
- [x] Criar banco de simulações para calibrar MIRA (7 cenários) — `docs/simulacoes-mira.md`
- [x] Refinar CEO-ATLAS v1.2 — relatório semanal P3, exemplo de síntese, árvore de conflito
- [x] Criar banco de simulações para calibrar PULSE (7 cenários) — `docs/simulacoes-pulse.md`
- [x] Criar banco de simulações para calibrar FLUX (8 cenários) — `docs/simulacoes-flux.md`
- [x] Criar banco de simulações para calibrar SAGE (7 cenários) — `docs/simulacoes-sage.md`
- [x] Refinar VECTOR v1.2 — perfis de abordagem para 5 segmentos SC com ciclo de venda, objeções e sinais de compra
- [x] Migrar plataforma Make → n8n — criar `docs/guia-n8n.md` com 7 workflows completos (WF-01 a WF-07)
- [x] Integrar manual de processos v3 — `docs/manual-processos-v3.md` (P09 outbound, protocolo de identificação de agentes)
- [x] Adicionar protocolo de identificação `[AGENTE]:` a todos os 8 system prompts
- [x] Adicionar P09 outbound a NOVA v1.3 (MSG-OUT-01/02/03), PULSE v1.1 (MSG-OUT-04/05), VECTOR v1.3 (lista), MIRA v1.2 (pesquisa)
