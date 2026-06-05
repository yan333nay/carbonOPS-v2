# Carbon OPS — Claude Code Project

## O que é este projeto

Implementação do sistema operacional de IA da **Carbon Films**, agência de marketing visual
cinematográfico em Santa Catarina. O objetivo é que 90% da operação rode com agentes de IA
especializados, com Yan e Joel atuando apenas como aprovadores nos pontos formais.

## Documentos de referência

- `docs/manual-processos.md` — Manual completo de processos v2.1
- `checklist.md` — Status da implementação (atualizar sempre após trabalho)
- `agents/` — System prompts de produção de cada agente
- `governance/` — Parâmetros de autonomia, ICP, precificação
- `templates/` — Templates de mensagens, diagnóstico, proposta
- `reports/` — Relatórios de cada sessão de trabalho

## Instruções para sessões autônomas (cron)

A cada sessão de trabalho autônoma (cron de 5h):

1. Ler `checklist.md` para ver o estado atual
2. Identificar os próximos itens executáveis SEM precisar de Yan/Joel
3. Trabalhar por ~30 min nos itens identificados
4. Criar relatório em `reports/YYYY-MM-DD_HH-sessao.md`
5. Atualizar `checklist.md` com o progresso

## O que pode ser feito autonomamente

- Escrever/melhorar system prompts dos agentes
- Criar templates de mensagens, formulários, documentos
- Criar documentação de processos detalhada
- Criar runbooks operacionais
- Criar estrutura de pastas e arquivos
- Melhorar qualquer documento existente

## O que NUNCA fazer sem aprovação de Yan/Joel

- Configurar APIs com chaves reais
- Fazer chamadas a serviços externos (WhatsApp, ClickUp, etc.)
- Confirmar orçamentos ou valores
- Tomar decisões sobre ferramentas (apenas recomendar)
- Commitar mudanças para git remoto

## Stack de referência

- IA: Anthropic Claude (opus para CEO-Atlas, sonnet para C-levels, haiku para workers)
- Gestão: ClickUp (fonte única de verdade)
- Automação: n8n (Cloud ou self-hosted Docker)
- Reuniões: Google Meet + Fireflies.ai (transcrição)
- Comunicação: WhatsApp Business API
- Armazenamento: Google Drive
- Contratos: D4Sign

## Agentes do sistema

| Agente | Tipo | Arquivo de prompt |
|--------|------|------------------|
| CEO-Atlas | Clone estratégico | `agents/ceo-atlas.md` |
| MIRA | Clone CMO | `agents/mira.md` |
| FINN | Clone CFO | `agents/finn.md` |
| VECTOR | Clone CSO | `agents/vector.md` |
| NOVA | Clone comercial | `agents/nova.md` |
| PULSE | Agente worker | `agents/pulse.md` |
| FLUX | Agente worker | `agents/flux.md` |
| SAGE | Agente worker | `agents/sage.md` |
