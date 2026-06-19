# Processo Comercial — Carbon Films
> Baseado no ICP definido em junho/2026 e no fluxo Receita Previsível.
> Revisar a cada 4–6 semanas com dados reais do Carbon Hub.

---

## Fluxo Geral

```
ICP → Carbon Hub (Email + SDR) → Lead Scoring → MQL? → Qualificação SDR (ligação) → SQL? → Oportunidade → Diagnóstico/Proposta → Fechamento
                                                    ↓ não                                  ↓ não
                                                 Nutrição                             Reciclar/descartar
```

---

## Segmentos Prioritários (ICP)

| Segmento | Dor principal | Gatilho de abertura |
|---|---|---|
| Clínicas e consultórios (estética, odonto, saúde) | Agendamentos perdidos por demora no atendimento WhatsApp | "Perdem clientes por demorar a responder?" |
| Imobiliárias e corretores autônomos | Leads esfriando antes de ser atendidos | "Lead interessado que sumiu por falta de follow-up rápido?" |
| Restaurantes, delivery e food service local | Pedidos perdidos no pico por falta de automação | "Perdem pedidos no rush por não ter atendimento automático?" |

**Perfil geral:** 1–15 funcionários · dono decide sozinho · tem presença digital · perde venda por lentidão no atendimento.

### Quem NÃO prospectar
- Tem CRM ou automação já implementada visivelmente
- Mais de 50 funcionários ou TI própria
- Franquias com decisão centralizada
- Sem presença digital (sem Instagram, sem Google Maps)

---

## Estágio 1: Geração de Leads
**Responsável:** Agente `leads`
**Fontes:** Google Maps · Instagram · LinkedIn
**Critérios mínimos:**
- Encaixa em um dos 3 segmentos do ICP
- Tem presença digital (Instagram ativo ou site)
- Email encontrado
- Sem CRM visível implementado

**Listas no Carbon Hub:** 3 listas separadas por segmento — não misturar. Mensagem de cada segmento é diferente.

**Output:** Lead adicionado com `funnelStage: prospect` e `setor` correto para pontuação.

---

## Estágio 2: Prospecção automatizada — Carbon Hub
**Responsável:** Agente `campaign` (email outbound) + agente `sdr` (WhatsApp/DM)
**Canal:** Email primeiro → WhatsApp se abriu mas não respondeu

**Cadência:**
- Dia 0: Cold email de abertura (gatilho por segmento)
- Dia 3: Follow-up 1 — valor (ex: dado relevante do setor)
- Dia 7: Follow-up 2 — urgência leve
- Dia 14: Follow-up 3 — último toque

**Lead scoring automático:**
- Email enviado: +2 pts
- Email aberto: +5 pts
- Email aberto 3x+: +10 pts (sinal forte)
- Respondeu positivo: +25 pts
- Quer reunião: +40 pts

**Threshold MQL:** Score ≥ 30 → entra em fila de qualificação SDR.

---

## Estágio 3: Qualificação SDR — LIGAÇÃO
**Responsável:** Yan (SDR humano) — a partir de segunda-feira (22/06/2026)
**Gatilho:** Hot Call criada no Carbon Hub quando score ≥ 30 ou resposta positiva/reunião

**Objetivo:** Qualificar em 5 minutos. Não vender. Entender se há dor real e decisor disponível.

**Perguntas por segmento:**

*Clínicas:*
1. "Como vocês gerenciam os agendamentos que chegam fora do horário?"
2. "Já perderam clientes por demorar a responder no WhatsApp?"
3. "Quem decide sobre ferramentas de automação aqui — você mesmo?"

*Imobiliárias:*
1. "Como está o follow-up de leads que pedem info pelo Instagram?"
2. "Quantos leads estimam que perdem por falta de resposta rápida?"
3. "A decisão de testar uma ferramenta nova passa por você?"

*Restaurantes/food service:*
1. "O atendimento no WhatsApp no horário de pico — como está dando conta?"
2. "Já calcularam quantos pedidos perdem por não responder rápido?"
3. "Você é o dono ou tem um sócio que precisa aprovar?"

**Output SQL:** Lead respondeu sim para dor + decisor = avança para Oportunidade.
**Output não-SQL:** Reciclar (dor existe mas ciclo longo) ou descartar (sem dor, sem fit).

---

## Estágio 4: Oportunidade — Reunião de Diagnóstico
**Responsável:** Yan
**Formato:** Videochamada 30 min (Google Meet)
**Objetivo:** Aprofundar diagnóstico, não apresentar portfólio. Proposta vem depois.

**Agenda padrão:**
1. (5 min) Contexto da empresa — deixar o lead falar
2. (10 min) Aprofundar a dor principal identificada na qualificação
3. (10 min) Apresentar como a Carbon Films resolveu isso para outros
4. (5 min) Próximos passos — proposta em 24h

**funnelStage no CRM:** `oportunidade`

---

## Estágio 5: Proposta
**Prazo:** Máximo 24h após reunião
**Produto-âncora (entrada):** O produto mais simples e fácil de fechar — não apresentar portfólio completo.
**Formato:** PDF personalizado com diagnóstico + solução + investimento + ROI estimado + próximos passos

---

## Estágio 6: Fechamento / Follow-up
**Fechou:** `funnelStage: campeao` · registrar valor, tipo e data de receita
**Não fechou:** Registrar motivo exato. Agente `analyst` processa para refinar ICP.
**Follow-up pós-não:** Cadência de nutrição — contato a cada 30 dias até perder validade.

---

## Métricas de Validação por Segmento
> Após 30–60 prospecções por segmento, comparar:

| Métrica | Meta semana 1–2 |
|---|---|
| Taxa de resposta ao cold email | > 5% |
| Taxa de resposta à ligação SDR | > 20% |
| Taxa SQL / leads qualificados | > 30% das ligações |
| Taxa reunião agendada / SQL | > 50% |
| Ciclo médio até proposta | < 7 dias |

**O segmento que converter melhor vira prioridade. Os outros dois são pausados ou ajustados.**
