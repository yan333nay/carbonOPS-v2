# Relatório de Sessão — Carbon OPS
**Data:** 2026-04-16
**Tipo:** Sessão inicial de configuração
**Duração estimada:** ~1.5 horas

---

## O QUE FOI FEITO NESTA SESSÃO

### Estrutura do projeto criada
- `/root/carbon-ops/` com todas as subpastas
- `CLAUDE.md` com instruções para sessões autônomas
- `checklist.md` com status completo de todas as 6 fases

### System prompts criados (todos em v1.0)

| Agente | Arquivo | Qualidade estimada | Notas |
|--------|---------|-------------------|-------|
| CEO-ATLAS | `agents/ceo-atlas.md` | ★★★★☆ | Sólido, precisa de ICP e preços reais |
| NOVA | `agents/nova.md` | ★★★★★ | Completo — fluxo de estados, tratamento por cenário |
| VECTOR | `agents/vector.md` | ★★★★☆ | Completo — precisa de tabela de preços real |
| MIRA | `agents/mira.md` | ★★★★☆ | Completo |
| FINN | `agents/finn.md` | ★★★★☆ | Completo — precisa de limites financeiros reais |
| PULSE | `agents/pulse.md` | ★★★★★ | Completo — todas as 6 mensagens e cenários |
| FLUX | `agents/flux.md` | ★★★★★ | Completo — todos os 8 triggers mapeados |
| SAGE | `agents/sage.md` | ★★★★☆ | Completo |

**Melhoria vs. prompts originais:** Os prompts originais do documento tinham ~8-15 linhas.
Os novos têm 80-150 linhas com fluxos, regras, exemplos, checklists e casos de uso específicos.

### Documentos de governança criados
- `governance/autonomia-template.md` — para Yan/Joel preencherem (decisão 0.5)
- `governance/icp-template.md` — para Yan/Joel preencherem (decisão 0.6)
- `governance/precificacao-template.md` — para Yan/Joel preencherem (decisão 0.7)

### Templates criados
- `templates/diagnostico.md` — ficha de diagnóstico completa (Processo 02)
- `templates/mensagens-padrao.md` — todas as mensagens (MSG-01 a MSG-Follow, onboarding, cobrança)

### Documentação técnica criada
- `docs/guia-clickup.md` — passo a passo completo de configuração do ClickUp
- `docs/guia-ferramentas.md` — comparativo e recomendações de ferramentas

---

## STATUS DO CHECKLIST APÓS ESTA SESSÃO

- **FASE 0:** 7/7 itens aguardando Yan/Joel (inalterado — são decisões deles)
- **FASE 1:** 5/5 itens aguardando implementação técnica (inalterado)
- **FASE 2:** 8/8 system prompts criados em v1.0 ✅
- **FASE 5:** 5.1 e 5.3 concluídos, 5.2 em andamento

---

## O QUE YAN/JOEL PRECISAM FAZER PARA DESBLOQUEAR O PROJETO

**Esta semana (bloqueantes):**

1. **Decisão 0.1** — Definir orçamento mensal para IA
   - Estimativa: R$300-600/mês para começar (escala com volume)

2. **Decisão 0.2** — Escolher ferramenta de transcrição
   - Recomendação: Fireflies.ai (~$10-19/mês)
   - Ver: `docs/guia-ferramentas.md`

3. **Decisão 0.3** — Escolher automação
   - Recomendação: Make (~$9-16/mês)
   - Ver: `docs/guia-ferramentas.md`

4. **Decisão 0.4** — WhatsApp Business
   - Recomendação: API Oficial via 360dialog (evitar Evolution API — risco de ban)
   - Ver: `docs/guia-ferramentas.md`

5. **Criar conta Anthropic API** — console.anthropic.com

6. **Criar conta Google dedicada** para a agência (não pessoal)

7. **Criar workspace no ClickUp** — ver: `docs/guia-clickup.md`

**Esta semana (não bloqueantes mas importantes):**

8. **Preencher ICP** — `governance/icp-template.md`
9. **Preencher tabela de preços** — `governance/precificacao-template.md`
10. **Preencher parâmetros de autonomia** — `governance/autonomia-template.md`

---

## PRÓXIMAS SESSÕES AUTÔNOMAS (sem Yan/Joel)

- [ ] Criar template completo de proposta comercial
- [ ] Criar runbooks de operação (o que fazer em cada emergência)
- [ ] Criar guia de configuração do Make com cenários detalhados
- [ ] Criar banco de simulações de conversa para testar NOVA
- [ ] Refinar prompts v1.1 com casos de uso específicos
- [ ] Criar estrutura de testes A/B para NOVA
- [ ] Criar checklist de onboarding técnico por serviço

---

## OBSERVAÇÕES

Os system prompts criados são significativamente mais robustos que os originais
do documento, mas precisarão de calibração com dados reais (ICP, preços, casos
de clientes) para atingir performance ótima. A estrutura está sólida para receber
esses dados quando Yan/Joel preencherem os templates de governança.

O projeto está bem mapeado e documentado. O principal gargalo agora são as
7 decisões estratégicas da Fase 0 — sem elas, não é possível configurar
as integrações e ativar os agentes em produção.
