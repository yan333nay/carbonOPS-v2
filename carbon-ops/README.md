# Carbon OPS

Sistema operacional de IA da **Carbon Films** — agência de marketing visual cinematográfico em Santa Catarina, Brasil.

> *90% da operação rodando com agentes de IA especializados. Yan e Joel atuam apenas como aprovadores nos pontos formais.*

---

## Visão Geral

A Carbon Films opera com **8 agentes de IA** em três níveis:

```
ESTRATÉGICO     → CEO-ATLAS (coordena tudo, alerta fundadores)
TÁTICO          → MIRA (CMO) · FINN (CFO) · VECTOR (CSO)
OPERACIONAL     → NOVA (comercial) · PULSE · FLUX · SAGE
```

**Fundadores:** Yan e Joel — aprovam contratos, decisões financeiras relevantes e situações de crise. Não executam.

---

## Estrutura do Repositório

```
carbon-ops/
│
├── agents/                  # System prompts de produção
│   ├── ceo-atlas.md         # v1.1 — Orquestrador estratégico
│   ├── nova.md              # v1.1 — Atendimento e comercial
│   ├── vector.md            # v1.1 — Estratégia de vendas (CSO)
│   ├── mira.md              # v1.1 — Marketing e conteúdo (CMO)
│   ├── finn.md              # v1.1 — Finanças e contratos (CFO)
│   ├── pulse.md             # v1.0 — Follow-up e lembretes (worker)
│   ├── flux.md              # v1.0 — ClickUp e operações (worker)
│   └── sage.md              # v1.1 — Drafts de conteúdo (worker)
│
├── templates/               # Documentos prontos para uso
│   ├── mensagens-padrao.md  # MSG-01 a MSG-reativação
│   ├── diagnostico.md       # Ficha de diagnóstico (P02)
│   ├── proposta-comercial.md # Template completo 7 blocos (P03)
│   ├── briefing-completo.md # Reunião de onboarding (P04)
│   ├── relatorio-mensal.md  # Relatório para clientes (P06)
│   └── dossie-saida.md      # Encerramento de contrato (P08)
│
├── docs/                    # Guias técnicos e runbooks
│   ├── guia-clickup.md      # Configuração completa do ClickUp
│   ├── guia-n8n.md          # 7 workflows de automação n8n
│   ├── guia-ferramentas.md  # Comparativo e recomendações
│   ├── guia-fireflies.md    # Transcrição de reuniões
│   ├── onboarding-por-servico.md  # Acessos por serviço
│   ├── simulacoes-nova.md   # 10 cenários de teste para NOVA
│   ├── script-apresentacao-proposta.md
│   └── runbooks/
│       ├── emergencias.md   # 8 cenários de emergência
│       └── operacao-diaria.md  # Rotina Yan/Joel
│
├── governance/              # Documentos para Yan/Joel preencherem
│   ├── icp-template.md      # ⬅ PREENCHER — perfil do cliente ideal
│   ├── precificacao-template.md  # ⬅ PREENCHER — valores dos serviços
│   ├── autonomia-template.md     # ⬅ PREENCHER — o que cada agente pode fazer
│   └── banco-decisoes-atlas.md   # Aprende com decisões reais de Yan
│
├── reports/                 # Relatórios das sessões autônomas de trabalho
│   └── YYYY-MM-DD_HHh-sessao.md
│
├── checklist.md             # Status de implementação por fase
└── CLAUDE.md                # Instruções para sessões autônomas (Claude Code)
```

---

## Status Atual

| Fase | Status | Descrição |
|------|--------|-----------|
| **FASE 0** — Decisões estratégicas | ⏳ Aguardando Yan/Joel | 7 decisões pendentes |
| **FASE 1** — Infraestrutura | ⏳ Bloqueada | Precisa da Fase 0 |
| **FASE 2** — System prompts | ✅ Completa | 8 agentes em v1.1 |
| **FASE 3** — Integração e testes | ⏳ Bloqueada | Precisa da Fase 1 |
| **FASE 4** — Operação supervisionada | ⏳ Bloqueada | Precisa da Fase 3 |
| **FASE 5** — Documentação | ✅ ~95% completa | 19/19 docs criados |
| **FASE 6** — Expansão | ⏳ Após 60 dias | — |

---

## O Que Precisa de Você Agora (Yan/Joel)

### 🔴 Esta semana (desbloqueantes)

1. **Orçamento de IA** — quanto investir/mês em APIs e ferramentas
2. **Criar conta Anthropic** — [console.anthropic.com](https://console.anthropic.com)
3. **Escolher e contratar transcrição** — Fireflies.ai recomendado (`docs/guia-fireflies.md`)
4. **Configurar automação** — n8n (`docs/guia-n8n.md`) — Cloud (~US$24/mês) ou self-hosted (Docker)
5. **WhatsApp Business API** — 360dialog recomendado (`docs/guia-ferramentas.md`)
6. **Criar conta Google dedicada** para a agência
7. **Criar workspace no ClickUp** — `docs/guia-clickup.md`

### 🟡 Em paralelo (não bloqueantes mas importantes)

8. Preencher `governance/icp-template.md` — segmentos prioritários
9. Preencher `governance/precificacao-template.md` — valores dos 9 serviços
10. Preencher `governance/autonomia-template.md` — o que cada agente pode fazer sozinho

---

## Os 8 Agentes

### 🧠 Clones de IA (raciocínio estratégico e tático)

| Agente | Função | Referências |
|--------|--------|-------------|
| **CEO-ATLAS** | Gestão diária, coordena C-levels, briefing executivo | Elon Musk · Alex Hormozi · Sam Altman |
| **NOVA** | Atendimento, qualificação de leads, condução comercial | Oprah · Jordan Belfort · Donald Miller |
| **MIRA** | Estratégia de marketing, revisão de conteúdo, growth | Seth Godin · Neil Patel · Gary Vee |
| **FINN** | Finanças, inadimplências, contratos, projeções | Warren Buffett · Ramit Sethi · Naval |
| **VECTOR** | Estratégia comercial, ICP, funil de vendas, propostas | Alex Hormozi · Grant Cardone · Chris Voss |

### 🤖 Agentes Workers (execução automatizada)

| Agente | Função | Aciona quando |
|--------|--------|--------------|
| **PULSE** | Lembretes de reunião (MSG-04/05), follow-up de propostas, reativação | Eventos no Google Agenda, propostas sem resposta |
| **FLUX** | Cria/atualiza tasks no ClickUp, monitora prazos, alerta atrasos | Eventos em qualquer processo |
| **SAGE** | First drafts de conteúdo, compilação de métricas, rascunhos de relatório | Solicitação de MIRA ou FLUX |

---

## Ferramentas do Sistema

| Finalidade | Ferramenta |
|-----------|-----------|
| Gestão de projetos | ClickUp (fonte única de verdade) |
| Reuniões | Google Meet |
| Agenda e notificações | Google Agenda |
| Transcrição de reuniões | Fireflies.ai |
| Automação / orquestração | n8n |
| IA dos agentes | Anthropic Claude API |
| Comunicação com clientes | WhatsApp Business API |
| Armazenamento | Google Drive |
| Contratos | D4Sign |
| Relatórios | Google Looker Studio |

---

## Como Este Repositório É Atualizado

Claude Code trabalha de forma autônoma neste repositório a cada 5 horas:
1. Faz `git pull` para pegar mudanças que Yan fez
2. Trabalha ~30 min nos itens pendentes do `checklist.md`
3. Faz `git push` com relatório do que foi feito

**Para interagir:** Edite qualquer arquivo diretamente no GitHub — na próxima sessão, as mudanças são incorporadas antes do trabalho começar.

---

*Carbon Films — marketing visual com estratégia*
*Santa Catarina, Brasil · syfilms2.0@gmail.com · +55 (47) 8922-7584*
